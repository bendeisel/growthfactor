#!/usr/bin/env python3
"""agentmux - worktree-per-agent workspaces for Claude Code.

A portable take on what cmux gives macOS users: one git worktree and one
tmux window per agent, live agent state in the status line, and a push
notification when an agent needs you.

Standard library only. Targets WSL2, Linux and macOS; degrades to
worktree-only management when tmux is unavailable.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shlex
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

VERSION = "0.1.0"

# Agent lifecycle states, mapped from Claude Code hook events.
WORKING = "working"   # agent is mid-turn
WAITING = "waiting"   # agent needs a human (permission prompt / idle prompt)
IDLE = "idle"         # turn finished, session still open
DONE = "done"         # session ended
UNKNOWN = "unknown"

GLYPH = {WORKING: "*", WAITING: "!", IDLE: "-", DONE: ".", UNKNOWN: "?"}
COLOR = {
    WORKING: "\033[32m",
    WAITING: "\033[33m",
    IDLE: "\033[90m",
    DONE: "\033[90m",
    UNKNOWN: "\033[90m",
}
RESET = "\033[0m"
BOLD = "\033[1m"

# Hook event -> state. Events not listed here are ignored.
EVENT_STATE = {
    "SessionStart": WORKING,
    "UserPromptSubmit": WORKING,
    "PreToolUse": WORKING,
    "PostToolUse": WORKING,
    "Notification": WAITING,
    "Stop": IDLE,
    "StopFailure": IDLE,
    "SessionEnd": DONE,
}

DEFAULT_NOTIFY_EVENTS = ("Notification", "Stop", "StopFailure")


class AgentmuxError(Exception):
    """A user-facing error. Printed without a traceback."""


# --------------------------------------------------------------------------
# process helpers
# --------------------------------------------------------------------------


def run(cmd, cwd=None, check=True, capture=True, input_=None, timeout=None):
    proc = subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        check=False,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        text=True,
        input=input_,
        timeout=timeout,
    )
    if check and proc.returncode != 0:
        detail = ((proc.stderr or "") + (proc.stdout or "")).strip()
        raise AgentmuxError("%s failed: %s" % (" ".join(cmd[:3]), detail or "no output"))
    return proc


def git(args, cwd=None, check=True):
    return run(["git", *args], cwd=cwd, check=check)


def git_out(args, cwd=None, check=True):
    return git(args, cwd=cwd, check=check).stdout.strip()


# --------------------------------------------------------------------------
# repository + config
# --------------------------------------------------------------------------


def repo_root(start=None):
    """Root of the *main* checkout, even when called from inside a worktree."""
    start = Path(start or Path.cwd())
    proc = git(["rev-parse", "--git-common-dir"], cwd=start, check=False)
    if proc.returncode != 0:
        raise AgentmuxError("not inside a git repository: %s" % start)
    common = Path(proc.stdout.strip())
    if not common.is_absolute():
        common = start / common
    common = common.resolve()
    if common.name == ".git":
        return common.parent
    return Path(git_out(["rev-parse", "--show-toplevel"], cwd=start)).resolve()


NAME_RE = re.compile(r"[^a-z0-9._-]+")


def slugify(text):
    slug = NAME_RE.sub("-", str(text).strip().lower()).strip("-._")
    slug = re.sub(r"-{2,}", "-", slug)
    if not slug:
        raise AgentmuxError("workspace name is empty after normalisation")
    return slug[:48]


def tmux_safe(text):
    """tmux treats '.' and ':' as target separators."""
    return re.sub(r"[.:\s]+", "-", text)


class Config:
    """Resolved settings: .agentmux.json at the repo root, overridden by env."""

    def __init__(self, root):
        self.root = root
        raw = {}
        config_file = root / ".agentmux.json"
        if config_file.is_file():
            try:
                raw = json.loads(config_file.read_text(encoding="utf-8"))
            except (OSError, ValueError) as exc:
                raise AgentmuxError("could not read %s: %s" % (config_file, exc))
            if not isinstance(raw, dict):
                raise AgentmuxError("%s must contain a JSON object" % config_file)

        def setting(key, env, default):
            value = os.environ.get(env)
            if value is None or value == "":
                value = raw.get(key, default)
            return value

        home = os.environ.get("AGENTMUX_HOME")
        self.home = Path(home) if home else Path.home() / ".local" / "state" / "agentmux"
        digest = hashlib.sha1(str(root).encode("utf-8")).hexdigest()[:8]
        self.state_dir = self.home / "repos" / ("%s-%s" % (slugify(root.name), digest))

        worktree_root = setting("worktree_root", "AGENTMUX_WORKTREE_ROOT", None)
        self.worktree_root = (
            Path(os.path.expanduser(worktree_root)).resolve()
            if worktree_root
            else root.parent / ("%s-agents" % root.name)
        )
        self.session = tmux_safe(
            setting("session", "AGENTMUX_SESSION", "agentmux-%s" % slugify(root.name))
        )
        self.agent_cmd = setting("agent_cmd", "AGENTMUX_AGENT_CMD", "claude")
        self.branch_prefix = setting("branch_prefix", "AGENTMUX_BRANCH_PREFIX", "agent/")
        self.base = setting("base", "AGENTMUX_BASE", "") or ""
        self.ntfy_topic = str(setting("ntfy_topic", "AGENTMUX_NTFY_TOPIC", "")).strip()
        self.ntfy_server = str(
            setting("ntfy_server", "AGENTMUX_NTFY_SERVER", "https://ntfy.sh")
        ).rstrip("/")
        events = setting("notify_events", "AGENTMUX_NOTIFY_EVENTS", None)
        if isinstance(events, str):
            events = [e.strip() for e in events.split(",") if e.strip()]
        self.notify_events = tuple(events or DEFAULT_NOTIFY_EVENTS)

    @property
    def workspaces_dir(self):
        return self.state_dir / "workspaces"


def load_config(start=None):
    return Config(repo_root(start))


# --------------------------------------------------------------------------
# workspace records
# --------------------------------------------------------------------------


def record_path(cfg, name):
    return cfg.workspaces_dir / ("%s.json" % name)


def save_record(cfg, record):
    cfg.workspaces_dir.mkdir(parents=True, exist_ok=True)
    path = record_path(cfg, record["name"])
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(record, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    tmp.replace(path)


def load_record(cfg, name):
    path = record_path(cfg, name)
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except ValueError:
        return None


def all_records(cfg):
    if not cfg.workspaces_dir.is_dir():
        return []
    records = []
    for path in sorted(cfg.workspaces_dir.glob("*.json")):
        try:
            records.append(json.loads(path.read_text(encoding="utf-8")))
        except ValueError:
            continue
    return records


def require_record(cfg, name):
    record = load_record(cfg, name)
    if record is None:
        known = ", ".join(r["name"] for r in all_records(cfg)) or "none"
        raise AgentmuxError("no workspace named %r (have: %s)" % (name, known))
    return record


# --------------------------------------------------------------------------
# tmux
# --------------------------------------------------------------------------


def tmux_available():
    if os.environ.get("AGENTMUX_NO_TMUX"):
        return False
    return shutil.which("tmux") is not None


def tmux(args, check=True):
    return run(["tmux", *args], check=check)


def session_exists(cfg):
    return tmux_available() and tmux(["has-session", "-t", cfg.session], check=False).returncode == 0


def window_target(cfg, name):
    return "%s:%s" % (cfg.session, name)


def window_exists(cfg, name):
    if not session_exists(cfg):
        return False
    proc = tmux(["list-windows", "-t", cfg.session, "-F", "#{window_name}"], check=False)
    return name in proc.stdout.split()


def open_window(cfg, name, cwd, command):
    """Create the session or window and start the agent inside it."""
    if not tmux_available():
        return False
    if not session_exists(cfg):
        tmux(["new-session", "-d", "-s", cfg.session, "-n", name, "-c", str(cwd)])
    elif not window_exists(cfg, name):
        tmux(["new-window", "-d", "-t", cfg.session, "-n", name, "-c", str(cwd)])
    target = window_target(cfg, name)
    set_window_state(cfg, name, WORKING)
    if command:
        tmux(["send-keys", "-t", target, command, "C-m"])
    return True


def set_window_state(cfg, name, state):
    """Expose state to the tmux status line as @agentmux_state."""
    if not window_exists(cfg, name):
        return
    tmux(
        ["set-option", "-w", "-t", window_target(cfg, name), "@agentmux_state", state],
        check=False,
    )


def client_ttys():
    if not tmux_available():
        return []
    proc = tmux(["list-clients", "-F", "#{client_tty}"], check=False)
    if proc.returncode != 0:
        return []
    return [line.strip() for line in proc.stdout.splitlines() if line.strip()]


# --------------------------------------------------------------------------
# notifications
# --------------------------------------------------------------------------


def notify_ntfy(cfg, title, body, priority="default"):
    if not cfg.ntfy_topic:
        return False
    url = "%s/%s" % (cfg.ntfy_server, cfg.ntfy_topic)
    request = urllib.request.Request(
        url,
        data=body.encode("utf-8"),
        method="POST",
        headers={
            "Title": title.encode("ascii", "replace").decode("ascii"),
            "Priority": priority,
            "Tags": "robot",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=5):
            return True
    except (urllib.error.URLError, OSError, ValueError):
        return False


def in_wsl():
    if os.environ.get("WSL_DISTRO_NAME") or os.environ.get("WSL_INTEROP"):
        return True
    try:
        return "microsoft" in Path("/proc/version").read_text(encoding="utf-8").lower()
    except OSError:
        return False


def notify_windows(title, body):
    """Toast on the Windows desktop from inside WSL, via powershell.exe."""
    powershell = shutil.which("powershell.exe")
    script = Path(__file__).resolve().parent / "hooks" / "toast.ps1"
    if not powershell or not script.is_file():
        return False
    win_path = str(script)
    wslpath = shutil.which("wslpath")
    if wslpath:
        proc = run([wslpath, "-w", str(script)], check=False)
        if proc.returncode == 0 and proc.stdout.strip():
            win_path = proc.stdout.strip()
    try:
        proc = run(
            [
                powershell,
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                win_path,
                "-Title",
                title,
                "-Body",
                body,
            ],
            check=False,
            timeout=15,
        )
    except subprocess.TimeoutExpired:
        return False
    return proc.returncode == 0


def notify_desktop(title, body):
    if shutil.which("notify-send"):
        return run(["notify-send", title, body], check=False).returncode == 0
    if sys.platform == "darwin" and shutil.which("osascript"):
        script = 'display notification %s with title %s' % (
            json.dumps(body),
            json.dumps(title),
        )
        return run(["osascript", "-e", script], check=False).returncode == 0
    return False


def notify(cfg, title, body):
    """Fan out to every channel that works here. Never raises."""
    delivered = []
    try:
        if notify_ntfy(cfg, title, body):
            delivered.append("ntfy")
    except Exception:
        pass
    try:
        if in_wsl() and notify_windows(title, body):
            delivered.append("windows")
        elif notify_desktop(title, body):
            delivered.append("desktop")
    except Exception:
        pass
    try:
        if tmux_available() and session_exists(cfg):
            tmux(["display-message", "-d", "4000", "%s - %s" % (title, body)], check=False)
            delivered.append("tmux")
    except Exception:
        pass
    return delivered


# --------------------------------------------------------------------------
# git worktrees
# --------------------------------------------------------------------------


def default_base(root):
    """origin's default branch when we can see it, else the current HEAD."""
    proc = git(["symbolic-ref", "--quiet", "refs/remotes/origin/HEAD"], cwd=root, check=False)
    ref = proc.stdout.strip()
    if proc.returncode == 0 and ref.startswith("refs/remotes/"):
        return ref[len("refs/remotes/") :]
    for candidate in ("origin/main", "origin/master"):
        if git(["rev-parse", "--verify", "--quiet", candidate], cwd=root, check=False).returncode == 0:
            return candidate
    head = git_out(["rev-parse", "--abbrev-ref", "HEAD"], cwd=root, check=False)
    return head or "HEAD"


def branch_exists(root, branch):
    return (
        git(["show-ref", "--verify", "--quiet", "refs/heads/%s" % branch], cwd=root, check=False).returncode
        == 0
    )


def worktree_status(path, base=None):
    """(dirty_file_count, ahead, behind) for a worktree; (None, None, None) if gone.

    "ahead" is measured against the upstream when there is one, and against the
    base revision otherwise - an unpushed branch still has commits worth seeing.
    """
    path = Path(path)
    if not path.is_dir():
        return None, None, None
    proc = git(["status", "--porcelain"], cwd=path, check=False)
    if proc.returncode != 0:
        return None, None, None
    dirty = len([line for line in proc.stdout.splitlines() if line.strip()])
    ahead = behind = 0
    counts = git(["rev-list", "--left-right", "--count", "@{upstream}...HEAD"], cwd=path, check=False)
    if counts.returncode != 0 and base:
        counts = git(["rev-list", "--left-right", "--count", "%s...HEAD" % base], cwd=path, check=False)
    if counts.returncode == 0:
        parts = counts.stdout.split()
        if len(parts) == 2:
            behind, ahead = int(parts[0]), int(parts[1])
    return dirty, ahead, behind


# --------------------------------------------------------------------------
# commands
# --------------------------------------------------------------------------


def cmd_new(args):
    cfg = load_config()
    name = slugify(args.name)
    existing = load_record(cfg, name)
    if existing and not args.reuse:
        raise AgentmuxError(
            "workspace %r already exists at %s (use 'agentmux attach %s')" % (name, existing["path"], name)
        )

    branch = args.branch or "%s%s" % (cfg.branch_prefix, name)
    base = args.base or cfg.base or default_base(cfg.root)
    path = (cfg.worktree_root / name).resolve()

    if path.exists() and not existing:
        raise AgentmuxError("%s already exists; remove it or pick another name" % path)

    if not path.exists():
        cfg.worktree_root.mkdir(parents=True, exist_ok=True)
        if branch_exists(cfg.root, branch):
            git(["worktree", "add", str(path), branch], cwd=cfg.root)
        else:
            git(["worktree", "add", "-b", branch, str(path), base], cwd=cfg.root)

    record = existing or {}
    record.update(
        {
            "name": name,
            "branch": branch,
            "base": base,
            "path": str(path),
            "session": cfg.session,
            "state": WORKING if not args.no_agent else UNKNOWN,
            "message": "",
            "created_at": record.get("created_at") or time.time(),
            "updated_at": time.time(),
        }
    )
    save_record(cfg, record)

    command = ""
    if not args.no_agent:
        command = cfg.agent_cmd
        if args.prompt:
            command = "%s %s" % (command, shlex.quote(args.prompt))

    started = open_window(cfg, name, path, command)
    print("worktree %s" % path)
    print("branch   %s (from %s)" % (branch, base))
    if started:
        print("window   %s" % window_target(cfg, name))
        if not args.no_attach and sys.stdout.isatty():
            return attach(cfg, name)
        if args.no_attach:
            print("\nattach with: agentmux attach %s" % name)
    else:
        print("\ntmux not available - worktree only. Start the agent with:")
        print("  cd %s && %s" % (path, cfg.agent_cmd))
    return 0


def attach(cfg, name):
    if not tmux_available():
        raise AgentmuxError("tmux is not available; cd into the worktree and run the agent directly")
    if not window_exists(cfg, name):
        raise AgentmuxError("no tmux window for %r; recreate it with 'agentmux new %s --reuse'" % (name, name))
    target = window_target(cfg, name)
    if os.environ.get("TMUX"):
        tmux(["select-window", "-t", target])
        return 0
    os.execvp("tmux", ["tmux", "attach-session", "-t", target])
    return 0  # not reached


def cmd_attach(args):
    cfg = load_config()
    record = require_record(cfg, slugify(args.name))
    return attach(cfg, record["name"])


def cmd_ls(args):
    cfg = load_config()
    records = all_records(cfg)
    if not records:
        print("no workspaces yet - create one with: agentmux new <name>")
        return 0

    rows = []
    for record in records:
        dirty, ahead, _ = worktree_status(record["path"], record.get("base"))
        alive = window_exists(cfg, record["name"])
        state = record.get("state", UNKNOWN)
        if not alive and state in (WORKING, WAITING):
            state = UNKNOWN
        rows.append(
            {
                "name": record["name"],
                "state": state,
                "branch": record.get("branch", "?"),
                "dirty": "-" if dirty is None else str(dirty),
                "ahead": "-" if ahead is None else "+%d" % ahead,
                "note": (record.get("message") or "").replace("\n", " ")[:44],
                "missing": dirty is None,
            }
        )

    if args.json:
        print(json.dumps(rows, indent=2))
        return 0

    color = sys.stdout.isatty() and not args.no_color
    headers = {"name": "WORKSPACE", "branch": "BRANCH", "dirty": "DIRTY", "ahead": "AHEAD"}
    widths = {
        key: max(len(label), max(len(row[key]) for row in rows))
        for key, label in headers.items()
    }
    header = "  %-*s  %-*s  %*s  %*s  %s" % (
        widths["name"], headers["name"],
        widths["branch"], headers["branch"],
        widths["dirty"], headers["dirty"],
        widths["ahead"], headers["ahead"],
        "AGENT",
    )
    print(BOLD + header + RESET if color else header)
    for row in rows:
        glyph = GLYPH.get(row["state"], "?")
        label = row["state"] + (" (worktree gone)" if row["missing"] else "")
        if row["note"]:
            label = "%s - %s" % (label, row["note"])
        line = "%s %-*s  %-*s  %*s  %*s  %s" % (
            glyph,
            widths["name"], row["name"],
            widths["branch"], row["branch"],
            widths["dirty"], row["dirty"],
            widths["ahead"], row["ahead"],
            label,
        )
        if color:
            line = COLOR.get(row["state"], "") + line + RESET
        print(line)
    return 0


def cmd_rm(args):
    cfg = load_config()
    name = slugify(args.name)
    record = require_record(cfg, name)
    path = Path(record["path"])

    dirty, _, _ = worktree_status(path, record.get("base"))
    if dirty and not args.force:
        raise AgentmuxError(
            "%s has %d uncommitted change(s); commit them or re-run with --force" % (path, dirty)
        )

    if window_exists(cfg, name):
        tmux(["kill-window", "-t", window_target(cfg, name)], check=False)

    if path.is_dir():
        remove = ["worktree", "remove", str(path)]
        if args.force:
            remove.append("--force")
        proc = git(remove, cwd=cfg.root, check=False)
        if proc.returncode != 0:
            raise AgentmuxError("git worktree remove failed: %s" % proc.stderr.strip())
    else:
        git(["worktree", "prune"], cwd=cfg.root, check=False)

    if not args.keep_branch:
        branch = record.get("branch")
        if branch and branch_exists(cfg.root, branch):
            proc = git(["branch", "-d", branch], cwd=cfg.root, check=False)
            if proc.returncode != 0:
                if args.force:
                    git(["branch", "-D", branch], cwd=cfg.root, check=False)
                else:
                    print(
                        "kept branch %s (not fully merged; delete with 'git branch -D %s')"
                        % (branch, branch)
                    )

    record_path(cfg, name).unlink(missing_ok=True)
    print("removed workspace %s" % name)
    return 0


# --------------------------------------------------------------------------
# hook handling
# --------------------------------------------------------------------------


def find_workspace_for_cwd(cfg, cwd):
    """Deepest workspace whose worktree contains cwd."""
    try:
        target = Path(cwd).resolve()
    except (OSError, ValueError):
        return None
    best = None
    for record in all_records(cfg):
        try:
            candidate = Path(record["path"]).resolve()
        except (OSError, ValueError, KeyError):
            continue
        if candidate == target or candidate in target.parents:
            if best is None or len(str(candidate)) > len(str(Path(best["path"]).resolve())):
                best = record
    return best


def summarise_event(event, payload):
    if event == "Notification":
        kind = payload.get("notification_type") or "notification"
        return payload.get("message") or kind.replace("_", " ")
    if event in ("Stop", "StopFailure"):
        message = (payload.get("last_assistant_message") or "").strip()
        if message:
            first = " ".join(message.split())
            return first[:120]
        return "turn finished"
    if event == "SessionEnd":
        return "session ended (%s)" % (payload.get("end_reason") or "unknown")
    return ""


def cmd_hook(args):
    """Consume a Claude Code hook payload. Always exits 0 - never blocks the agent."""
    raw = sys.stdin.read() if not sys.stdin.isatty() else ""
    try:
        payload = json.loads(raw) if raw.strip() else {}
    except ValueError:
        return 0
    if not isinstance(payload, dict):
        return 0

    event = args.event or payload.get("hook_event_name") or ""
    state = EVENT_STATE.get(event)
    if state is None:
        return 0

    cwd = payload.get("cwd") or os.getcwd()
    try:
        cfg = load_config(cwd)
    except AgentmuxError:
        return 0

    record = find_workspace_for_cwd(cfg, cwd)
    if record is None:
        return 0

    # Subagents share the workspace; let them report activity but never
    # let a subagent's Stop mark the whole workspace as idle.
    if payload.get("agent_id") and state in (IDLE, DONE):
        return 0

    message = summarise_event(event, payload)
    record.update(
        {
            "state": state,
            "message": message,
            "updated_at": time.time(),
            "session_id": payload.get("session_id") or record.get("session_id", ""),
        }
    )
    save_record(cfg, record)
    set_window_state(cfg, record["name"], state)

    if event in cfg.notify_events:
        title = "%s: %s" % (record["name"], "needs you" if state == WAITING else "done")
        notify(cfg, title, message or event)
    return 0


def cmd_status(args):
    """Compact per-repo summary, for the tmux status line."""
    try:
        cfg = load_config()
    except AgentmuxError:
        return 0
    counts = {}
    for record in all_records(cfg):
        state = record.get("state", UNKNOWN)
        if state in (DONE, UNKNOWN):
            continue
        counts[state] = counts.get(state, 0) + 1
    parts = [
        "%d%s" % (counts[state], GLYPH[state])
        for state in (WAITING, WORKING, IDLE)
        if counts.get(state)
    ]
    print(" ".join(parts))
    return 0


def cmd_next_waiting(args):
    """Select the next tmux window whose agent is waiting on a human."""
    cfg = load_config()
    if not session_exists(cfg):
        return 0
    proc = tmux(
        ["list-windows", "-t", cfg.session, "-F", "#{window_index} #{@agentmux_state}"],
        check=False,
    )
    if proc.returncode != 0:
        return 0
    for line in proc.stdout.splitlines():
        parts = line.split()
        if len(parts) == 2 and parts[1] == WAITING:
            tmux(["select-window", "-t", "%s:%s" % (cfg.session, parts[0])], check=False)
            return 0
    tmux(["display-message", "no agent is waiting"], check=False)
    return 0

# --------------------------------------------------------------------------
# setup helpers
# --------------------------------------------------------------------------


HOOK_EVENTS = ("SessionStart", "UserPromptSubmit", "Notification", "Stop", "SessionEnd")
HOOK_COMMAND = "${CLAUDE_PROJECT_DIR}/tools/agentmux/hooks/agentmux-hook"


def cmd_install_hooks(args):
    cfg = load_config()
    filename = "settings.json" if args.shared else "settings.local.json"
    settings_path = cfg.root / ".claude" / filename

    settings = {}
    if settings_path.is_file():
        try:
            settings = json.loads(settings_path.read_text(encoding="utf-8"))
        except ValueError as exc:
            raise AgentmuxError("%s is not valid JSON: %s" % (settings_path, exc))

    hooks = settings.setdefault("hooks", {})
    for event in HOOK_EVENTS:
        entries = [
            entry
            for entry in hooks.get(event, [])
            if not any(
                HOOK_COMMAND in str(handler.get("command", ""))
                for handler in entry.get("hooks", [])
            )
        ]
        entries.append(
            {
                "hooks": [
                    {
                        "type": "command",
                        "command": HOOK_COMMAND,
                        "args": [event],
                        "timeout": 10,
                    }
                ]
            }
        )
        hooks[event] = entries

    rendered = json.dumps(settings, indent=2) + "\n"
    if not args.write:
        print("# would write %s\n" % settings_path)
        print(rendered, end="")
        print("\n# re-run with --write to apply")
        return 0

    settings_path.parent.mkdir(parents=True, exist_ok=True)
    settings_path.write_text(rendered, encoding="utf-8")
    print("wrote %s" % settings_path)
    print("restart any running Claude Code session to pick the hooks up")
    return 0


def cmd_doctor(args):
    ok = True

    def check(label, good, detail=""):
        nonlocal ok
        ok = ok and good
        print("%s %-22s %s" % ("PASS" if good else "FAIL", label, detail))

    try:
        cfg = load_config()
    except AgentmuxError as exc:
        print("FAIL repo                   %s" % exc)
        return 1

    check("repo", True, str(cfg.root))
    check("state dir", True, str(cfg.state_dir))
    check("worktree root", True, str(cfg.worktree_root))

    version = git_out(["--version"], check=False)
    check("git", bool(version), version or "not found")

    if tmux_available():
        check("tmux", True, run(["tmux", "-V"], check=False).stdout.strip())
        check("tmux session", session_exists(cfg), cfg.session)
    else:
        check("tmux", False, "not found - worktree-only mode (install tmux, or use WSL on Windows)")

    agent = shutil.which(cfg.agent_cmd.split()[0])
    check("agent command", bool(agent), agent or "%r not on PATH" % cfg.agent_cmd)

    if cfg.ntfy_topic:
        check("ntfy push", True, "%s/%s" % (cfg.ntfy_server, cfg.ntfy_topic))
    else:
        print("WARN %-22s unset - no phone push (set AGENTMUX_NTFY_TOPIC)" % "ntfy push")

    if in_wsl():
        check("windows toast", bool(shutil.which("powershell.exe")), "powershell.exe")
    elif shutil.which("notify-send"):
        check("desktop notify", True, "notify-send")
    elif sys.platform == "darwin":
        check("desktop notify", bool(shutil.which("osascript")), "osascript")

    for filename in ("settings.local.json", "settings.json"):
        path = cfg.root / ".claude" / filename
        if path.is_file() and HOOK_COMMAND in path.read_text(encoding="utf-8"):
            check("claude hooks", True, str(path))
            break
    else:
        check("claude hooks", False, "not installed - run: agentmux install-hooks --write")

    print("\n%d workspace(s)" % len(all_records(cfg)))
    return 0 if ok else 1


# --------------------------------------------------------------------------
# entry point
# --------------------------------------------------------------------------


def build_parser():
    parser = argparse.ArgumentParser(
        prog="agentmux",
        description="worktree-per-agent workspaces for Claude Code",
    )
    parser.add_argument("--version", action="version", version="agentmux %s" % VERSION)
    sub = parser.add_subparsers(dest="command", required=True)

    new = sub.add_parser("new", help="create a workspace and start an agent in it")
    new.add_argument("name", help="short workspace name, e.g. 'fix-nav'")
    new.add_argument("-p", "--prompt", help="initial prompt to hand the agent")
    new.add_argument("-b", "--branch", help="branch name (default: <prefix><name>)")
    new.add_argument("--base", help="base revision for the new branch")
    new.add_argument("--no-attach", action="store_true", help="create it but stay put")
    new.add_argument("--no-agent", action="store_true", help="open a shell, do not start the agent")
    new.add_argument("--reuse", action="store_true", help="reuse an existing workspace of this name")
    new.set_defaults(func=cmd_new)

    ls = sub.add_parser("ls", aliases=["list", "status"], help="show every workspace and agent state")
    ls.add_argument("--json", action="store_true", help="machine-readable output")
    ls.add_argument("--no-color", action="store_true")
    ls.set_defaults(func=cmd_ls)

    att = sub.add_parser("attach", help="jump to a workspace's tmux window")
    att.add_argument("name")
    att.set_defaults(func=cmd_attach)

    rm = sub.add_parser("rm", aliases=["remove"], help="tear a workspace down")
    rm.add_argument("name")
    rm.add_argument("-f", "--force", action="store_true", help="discard uncommitted or unpushed work")
    rm.add_argument("--keep-branch", action="store_true", help="leave the branch in place")
    rm.set_defaults(func=cmd_rm)

    hook = sub.add_parser("hook", help="internal: consume a Claude Code hook payload")
    hook.add_argument("event", nargs="?", help="hook event name")
    hook.set_defaults(func=cmd_hook)

    status = sub.add_parser("tmux-status", help="internal: one-line summary for the tmux status bar")
    status.set_defaults(func=cmd_status)

    nxt = sub.add_parser("tmux-next-waiting", help="internal: focus the next agent that needs you")
    nxt.set_defaults(func=cmd_next_waiting)

    install = sub.add_parser("install-hooks", help="wire the Claude Code hooks into this repo")
    install.add_argument("--write", action="store_true", help="apply instead of printing")
    install.add_argument("--shared", action="store_true", help="use .claude/settings.json (committed)")
    install.set_defaults(func=cmd_install_hooks)

    doctor = sub.add_parser("doctor", help="check the local setup")
    doctor.set_defaults(func=cmd_doctor)

    return parser


def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        return args.func(args) or 0
    except AgentmuxError as exc:
        # Hooks must never break the agent they are reporting on.
        if args.command == "hook":
            return 0
        print("agentmux: %s" % exc, file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
