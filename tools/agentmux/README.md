# agentmux

Run several Claude Code agents at once, each in its own git worktree and its own
tmux window, with a marker in the status line when one needs you and a push
notification on your phone.

This exists because [cmux](https://github.com/manaflow-ai/cmux) — the nicest
tool for this job — is a native Swift + AppKit app and is **macOS only**. It is
not portable and not forkable in any practical sense: it wraps `libghostty`
through AppKit, and Ghostty itself has no Windows build. So agentmux does not
try to be cmux. It reproduces the part of cmux that actually changes how you
work, on top of tools that already run on Windows, Linux and macOS.

| cmux | agentmux |
|---|---|
| GPU-accelerated native terminal | your existing terminal + tmux |
| Vertical tab sidebar per workspace | tmux window list with state markers |
| Notification ring when an agent needs input | `!` marker, tmux message, desktop toast, phone push |
| Worktree per agent | worktree per agent |
| `cmux claude-teams` splits | tmux panes (agents spawn them themselves) |
| macOS only | WSL2 / Linux / macOS |

What you give up: the native rendering, the in-app browser, screenshots, and the
polish. What you keep: the workflow.

## Requirements

- `git` 2.5+ (worktrees), `python3` 3.8+, `bash`
- `tmux` 3.0+ — optional, but without it you get worktree management only
- `claude` on your PATH

## Install on Windows

Claude Code runs natively on Windows, but tmux does not. Use WSL2 — it is the
only setup here that gives you the full experience.

```powershell
wsl --install -d Ubuntu     # then reboot if prompted
```

Inside the Ubuntu shell:

```bash
sudo apt update && sudo apt install -y git tmux python3
npm install -g @anthropic-ai/claude-code    # or your preferred install method

git clone <this-repo> ~/growthfactor
mkdir -p ~/.local/bin
ln -sf ~/growthfactor/tools/agentmux/agentmux ~/.local/bin/agentmux
export PATH="$HOME/.local/bin:$PATH"        # add this line to ~/.bashrc

cd ~/growthfactor
agentmux install-hooks --write
agentmux doctor
```

Keep your repositories on the Linux filesystem (`~/code/...`), **not** under
`/mnt/c/`. Cross-filesystem I/O in WSL is slow enough that agents feel broken.

`doctor` should come back all-PASS apart from the ntfy warning, which the next
section fixes.

## Notifications on your phone

Agents block on you constantly — permission prompts, questions, finished turns.
The point of the notification layer is that you can walk away.

1. Install [ntfy](https://ntfy.sh) on Android (Play Store or F-Droid).
2. Pick a topic name that nobody will guess. **A public ntfy topic is readable
   by anyone who knows its name**, and agentmux sends the workspace name and the
   first line of the agent's last message. Generate a random one:

   ```bash
   echo "agentmux-$(head -c 12 /dev/urandom | base64 | tr -dc 'a-z0-9')"
   ```

3. Subscribe to that topic in the app, then add it to `~/.bashrc`:

   ```bash
   export AGENTMUX_NTFY_TOPIC=agentmux-xxxxxxxxxxxx
   ```

If the message text is sensitive, self-host ntfy and point
`AGENTMUX_NTFY_SERVER` at it. Setting no topic at all is fine — you simply get
no phone push.

On the Windows desktop you also get a toast, sent through `powershell.exe` from
WSL (`hooks/toast.ps1`). If your machine has an unusual PowerShell registration
and toasts do not appear, set `AGENTMUX_TOAST_APPID` to an AppID that is
registered, or ignore it and rely on ntfy.

## Daily use

```bash
cd ~/code/your-repo

agentmux new fix-nav -p "the mobile nav overlaps the logo under 400px"
agentmux new hero-copy --no-attach -p "rewrite the hero section copy"

agentmux ls
#   WORKSPACE  BRANCH           DIRTY  AHEAD  AGENT
# ! fix-nav    agent/fix-nav        2     +0  waiting - permission prompt
# * hero-copy  agent/hero-copy      0     +1  working

agentmux attach fix-nav       # jump to that agent
agentmux rm fix-nav           # tear the workspace down when the PR is merged
```

Markers: `*` working · `!` waiting on you · `-` idle, turn finished · `.` session
ended · `?` state unknown.

Each workspace is a real git worktree on its own branch, so agents never fight
over one checkout, and you review each one as an ordinary diff. `rm` refuses to
delete a worktree with uncommitted changes unless you pass `--force`, and never
deletes a branch that still holds unmerged commits.

### tmux layer

```bash
echo "source-file ~/growthfactor/tools/agentmux/tmux/agentmux.conf" >> ~/.tmux.conf
```

Adds state markers to the window list, a `2! 1*` summary on the right, and:

| Binding | Does |
|---|---|
| `prefix a` | jump to the next agent that is waiting on you |
| `prefix A` | create a new workspace by name |
| `prefix L` | workspace list in a popup |

The config sets `mouse on` and `renumber-windows on`. If you already have a tmux
setup you care about, copy the `window-status-format` lines instead of sourcing
the whole file.

## On Android

There is no way to run Claude Code on an Android device itself. Two things do
work:

- **[claude.ai/code](https://claude.ai/code) in the browser or the Claude app.**
  This is the same agent, running in an Anthropic-managed cloud container rather
  than on your PC. Good for kicking off work while away from the desk. The
  container is ephemeral, so anything worth keeping has to be pushed.
- **ntfy push**, above, so you know when a desk-side agent is blocked.

If you want to drive your own WSL machine from the phone, that is an SSH problem
(Tailscale + `tmux attach`), not something agentmux solves.

## Native Windows, without WSL

`agentmux` runs under Git Bash and manages worktrees, but there is no tmux, so
there are no windows to attach to and the hooks cannot set status markers:

```
agentmux new fix-nav --no-attach
# tmux not available - worktree only. Start the agent with:
#   cd C:/code/your-repo-agents/fix-nav && claude
```

You then open each agent in its own Windows Terminal tab by hand. `ls` still
tracks branch, dirty count and commits ahead. ntfy push still works. It is a
usable fallback, not the intended setup.

## Configuration

Every setting can go in `.agentmux.json` at the repo root or in the environment.
Environment wins.

| `.agentmux.json` | Environment | Default | Meaning |
|---|---|---|---|
| `worktree_root` | `AGENTMUX_WORKTREE_ROOT` | `../<repo>-agents` | where worktrees are created |
| `branch_prefix` | `AGENTMUX_BRANCH_PREFIX` | `agent/` | prefix for generated branch names |
| `base` | `AGENTMUX_BASE` | origin's default branch | what new branches fork from |
| `agent_cmd` | `AGENTMUX_AGENT_CMD` | `claude` | command started in each window |
| `session` | `AGENTMUX_SESSION` | `agentmux-<repo>` | tmux session name |
| `ntfy_topic` | `AGENTMUX_NTFY_TOPIC` | unset | phone push topic |
| `ntfy_server` | `AGENTMUX_NTFY_SERVER` | `https://ntfy.sh` | ntfy instance |
| `notify_events` | `AGENTMUX_NOTIFY_EVENTS` | `Notification,Stop,StopFailure` | which hook events notify |
| — | `AGENTMUX_HOME` | `~/.local/state/agentmux` | where workspace state lives |
| — | `AGENTMUX_NO_TMUX` | unset | force worktree-only mode |

Do not put `ntfy_topic` in a committed `.agentmux.json` if the repo is shared —
anyone with the topic name can read your agents' notifications.

## How the state tracking works

`install-hooks` registers one command hook on five Claude Code events in
`.claude/settings.local.json` (use `--shared` to write `.claude/settings.json`
instead, which commits the config for the whole team):

| Event | State |
|---|---|
| `SessionStart`, `UserPromptSubmit` | working |
| `Notification` | **waiting** — permission prompt or idle prompt |
| `Stop` | idle, with the first line of the agent's reply |
| `SessionEnd` | done |

Each hook fires `hooks/agentmux-hook`, which reads the payload on stdin, matches
`cwd` against the deepest known worktree, writes state to
`$AGENTMUX_HOME/repos/<repo>/workspaces/<name>.json`, sets `@agentmux_state` on
the tmux window, and notifies. A `Stop` carrying an `agent_id` is a subagent
finishing, not the session, so it never marks the workspace idle.

The hook always exits 0 and swallows its own errors. A broken notifier must
never block the agent it is reporting on.

## Tests

```bash
python3 -m unittest discover -s tools/agentmux/tests -v
```

35 tests, no dependencies, no network, no tmux required — they run with
`AGENTMUX_NO_TMUX=1` against throwaway git repositories.

The tmux paths are verified by hand (window creation, state options, status
line, next-waiting binding). `hooks/toast.ps1` is the one component with no
coverage at all: it needs a real Windows desktop to run. If toasts misbehave,
ntfy is the reliable channel.
