"""Tests for agentmux. Standard library only: python3 -m unittest discover tools/agentmux/tests"""

import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import agentmux  # noqa: E402


def git(args, cwd):
    subprocess.run(
        ["git", *args],
        cwd=str(cwd),
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name) / "repo"
        root.mkdir()
        git(["init", "-b", "main"], root)
        git(["config", "user.email", "test@example.com"], root)
        git(["config", "user.name", "test"], root)
        (root / "README.md").write_text("hello\n", encoding="utf-8")
        git(["add", "-A"], root)
        git(["commit", "-m", "init"], root)
        self.root = root.resolve()

        self._env = dict(os.environ)
        self._cwd = os.getcwd()
        # Deterministic, hermetic, and no real tmux or push notifications.
        os.environ.update(
            {
                "AGENTMUX_HOME": str(Path(self.tmp.name) / "state"),
                "AGENTMUX_WORKTREE_ROOT": str(Path(self.tmp.name) / "agents"),
                "AGENTMUX_NO_TMUX": "1",
            }
        )
        os.environ.pop("AGENTMUX_NTFY_TOPIC", None)
        os.environ.pop("AGENTMUX_BASE", None)
        os.chdir(self.root)

    def tearDown(self):
        os.chdir(self._cwd)
        os.environ.clear()
        os.environ.update(self._env)
        self.tmp.cleanup()

    def run_cli(self, *argv):
        buf = io.StringIO()
        with redirect_stdout(buf):
            code = agentmux.main(list(argv))
        return code, buf.getvalue()

    def make_workspace(self, name="fix-nav"):
        code, _ = self.run_cli("new", name, "--no-attach", "--no-agent")
        self.assertEqual(code, 0)
        return agentmux.load_config().root, name

    def fire(self, event, cwd, **payload):
        payload.update({"hook_event_name": event, "cwd": str(cwd)})
        proc = subprocess.run(
            [sys.executable, str(Path(agentmux.__file__)), "hook", event],
            input=json.dumps(payload),
            text=True,
            capture_output=True,
            env=os.environ,
            cwd=str(cwd),
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        return proc


class TestNaming(unittest.TestCase):
    def test_slugify_normalises(self):
        self.assertEqual(agentmux.slugify("Fix The Nav!"), "fix-the-nav")
        self.assertEqual(agentmux.slugify("  UPPER_case.1  "), "upper_case.1")
        self.assertEqual(agentmux.slugify("a///b"), "a-b")

    def test_slugify_rejects_empty(self):
        with self.assertRaises(agentmux.AgentmuxError):
            agentmux.slugify("---")

    def test_slugify_truncates(self):
        self.assertEqual(len(agentmux.slugify("x" * 200)), 48)

    def test_tmux_safe_strips_target_separators(self):
        self.assertEqual(agentmux.tmux_safe("a.b:c d"), "a-b-c-d")


class TestWorkspaces(Base):
    def test_new_creates_worktree_and_branch(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        path = Path(cfg.worktree_root) / "fix-nav"
        self.assertTrue((path / "README.md").is_file())
        self.assertTrue(agentmux.branch_exists(self.root, "agent/fix-nav"))
        record = agentmux.load_record(cfg, "fix-nav")
        self.assertEqual(record["branch"], "agent/fix-nav")

    def test_new_rejects_duplicate(self):
        self.make_workspace()
        with self.assertRaises(SystemExit):
            sys.exit(self.run_cli("new", "fix-nav", "--no-attach", "--no-agent")[0])

    def test_new_reuses_existing_branch(self):
        git(["branch", "agent/preexisting"], self.root)
        code, _ = self.run_cli("new", "preexisting", "--no-attach", "--no-agent")
        self.assertEqual(code, 0)
        cfg = agentmux.load_config()
        head = agentmux.git_out(
            ["rev-parse", "--abbrev-ref", "HEAD"], cwd=Path(cfg.worktree_root) / "preexisting"
        )
        self.assertEqual(head, "agent/preexisting")

    def test_ls_json_reports_state(self):
        self.make_workspace()
        code, out = self.run_cli("ls", "--json")
        self.assertEqual(code, 0)
        rows = json.loads(out)
        self.assertEqual(rows[0]["name"], "fix-nav")
        self.assertEqual(rows[0]["dirty"], "0")

    def test_ls_table_columns_line_up(self):
        self.make_workspace("ab")
        self.make_workspace("a-much-longer-workspace-name")
        lines = [l for l in self.run_cli("ls", "--no-color")[1].splitlines() if l.strip()]
        self.assertTrue(all(len(line) >= len(lines[0]) - 20 for line in lines))
        header, first = lines[0], lines[1]
        self.assertEqual(header.index("BRANCH"), first.index("agent/"))

    def test_ls_reports_dirty_files(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        (Path(cfg.worktree_root) / "fix-nav" / "scratch.txt").write_text("x", encoding="utf-8")
        rows = json.loads(self.run_cli("ls", "--json")[1])
        self.assertEqual(rows[0]["dirty"], "1")

    def test_new_marks_the_agent_as_working(self):
        code, _ = self.run_cli("new", "with-agent", "--no-attach")
        self.assertEqual(code, 0)
        cfg = agentmux.load_config()
        self.assertEqual(agentmux.load_record(cfg, "with-agent")["state"], agentmux.WORKING)

    def test_new_without_agent_stays_unknown(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        self.assertEqual(agentmux.load_record(cfg, "fix-nav")["state"], agentmux.UNKNOWN)

    def test_ahead_counts_commits_on_an_unpushed_branch(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        path = Path(cfg.worktree_root) / "fix-nav"
        (path / "nav.txt").write_text("nav\n", encoding="utf-8")
        git(["add", "-A"], path)
        git(["commit", "-m", "nav"], path)
        rows = json.loads(self.run_cli("ls", "--json")[1])
        self.assertEqual(rows[0]["ahead"], "+1")

    def test_rm_allows_removing_a_worktree_with_unpushed_commits(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        path = Path(cfg.worktree_root) / "fix-nav"
        (path / "nav.txt").write_text("nav\n", encoding="utf-8")
        git(["add", "-A"], path)
        git(["commit", "-m", "nav"], path)
        code, out = self.run_cli("rm", "fix-nav")
        self.assertEqual(code, 0)
        # The commits survive on the branch, so the branch must not be deleted.
        self.assertTrue(agentmux.branch_exists(self.root, "agent/fix-nav"))
        self.assertIn("kept branch", out)

    def test_repo_root_resolves_from_inside_worktree(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        inside = Path(cfg.worktree_root) / "fix-nav"
        self.assertEqual(agentmux.repo_root(inside), self.root)

    def test_rm_refuses_dirty_worktree(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        (Path(cfg.worktree_root) / "fix-nav" / "scratch.txt").write_text("x", encoding="utf-8")
        code, _ = self.run_cli("rm", "fix-nav")
        self.assertEqual(code, 1)
        self.assertIsNotNone(agentmux.load_record(cfg, "fix-nav"))

    def test_rm_force_removes_dirty_worktree(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        (Path(cfg.worktree_root) / "fix-nav" / "scratch.txt").write_text("x", encoding="utf-8")
        code, _ = self.run_cli("rm", "fix-nav", "--force")
        self.assertEqual(code, 0)
        self.assertIsNone(agentmux.load_record(cfg, "fix-nav"))
        self.assertFalse((Path(cfg.worktree_root) / "fix-nav").exists())
        self.assertFalse(agentmux.branch_exists(self.root, "agent/fix-nav"))

    def test_rm_keeps_branch_when_asked(self):
        self.make_workspace()
        code, _ = self.run_cli("rm", "fix-nav", "--keep-branch")
        self.assertEqual(code, 0)
        self.assertTrue(agentmux.branch_exists(self.root, "agent/fix-nav"))

    def test_rm_unknown_workspace_errors(self):
        code, _ = self.run_cli("rm", "nope")
        self.assertEqual(code, 1)


class TestHooks(Base):
    def test_notification_marks_waiting(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        path = Path(cfg.worktree_root) / "fix-nav"
        self.fire("Notification", path, notification_type="permission_prompt")
        record = agentmux.load_record(cfg, "fix-nav")
        self.assertEqual(record["state"], agentmux.WAITING)
        self.assertEqual(record["message"], "permission prompt")

    def test_stop_marks_idle_with_summary(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        path = Path(cfg.worktree_root) / "fix-nav"
        self.fire("Stop", path, last_assistant_message="  Done   with\nthe nav  ")
        record = agentmux.load_record(cfg, "fix-nav")
        self.assertEqual(record["state"], agentmux.IDLE)
        self.assertEqual(record["message"], "Done with the nav")

    def test_prompt_submit_marks_working(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        path = Path(cfg.worktree_root) / "fix-nav"
        self.fire("Stop", path)
        self.fire("UserPromptSubmit", path, user_prompt="go")
        self.assertEqual(agentmux.load_record(cfg, "fix-nav")["state"], agentmux.WORKING)

    def test_subagent_stop_does_not_idle_the_workspace(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        path = Path(cfg.worktree_root) / "fix-nav"
        self.fire("UserPromptSubmit", path, user_prompt="go")
        self.fire("Stop", path, agent_id="sub-1", agent_type="Explore")
        self.assertEqual(agentmux.load_record(cfg, "fix-nav")["state"], agentmux.WORKING)

    def test_hook_ignores_paths_outside_any_workspace(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        self.fire("Notification", self.root, notification_type="idle_prompt")
        self.assertEqual(agentmux.load_record(cfg, "fix-nav")["state"], agentmux.UNKNOWN)

    def test_hook_survives_malformed_payload(self):
        proc = subprocess.run(
            [sys.executable, str(Path(agentmux.__file__)), "hook", "Stop"],
            input="not json at all",
            text=True,
            capture_output=True,
            env=os.environ,
            cwd=str(self.root),
        )
        self.assertEqual(proc.returncode, 0)

    def test_hook_ignores_unknown_events(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        path = Path(cfg.worktree_root) / "fix-nav"
        self.fire("PreCompact", path)
        self.assertEqual(agentmux.load_record(cfg, "fix-nav")["state"], agentmux.UNKNOWN)

    def test_find_workspace_matches_nested_directory(self):
        self.make_workspace()
        cfg = agentmux.load_config()
        nested = Path(cfg.worktree_root) / "fix-nav" / "deep" / "dir"
        nested.mkdir(parents=True)
        found = agentmux.find_workspace_for_cwd(cfg, nested)
        self.assertIsNotNone(found)
        self.assertEqual(found["name"], "fix-nav")


class TestSetup(Base):
    def test_install_hooks_dry_run_writes_nothing(self):
        code, out = self.run_cli("install-hooks")
        self.assertEqual(code, 0)
        self.assertIn("would write", out)
        self.assertFalse((self.root / ".claude" / "settings.local.json").exists())

    def test_install_hooks_writes_every_event(self):
        code, _ = self.run_cli("install-hooks", "--write")
        self.assertEqual(code, 0)
        settings = json.loads(
            (self.root / ".claude" / "settings.local.json").read_text(encoding="utf-8")
        )
        self.assertEqual(set(settings["hooks"]), set(agentmux.HOOK_EVENTS))
        handler = settings["hooks"]["Stop"][0]["hooks"][0]
        self.assertEqual(handler["command"], agentmux.HOOK_COMMAND)
        self.assertEqual(handler["args"], ["Stop"])

    def test_install_hooks_is_idempotent(self):
        self.run_cli("install-hooks", "--write")
        self.run_cli("install-hooks", "--write")
        settings = json.loads(
            (self.root / ".claude" / "settings.local.json").read_text(encoding="utf-8")
        )
        self.assertEqual(len(settings["hooks"]["Stop"]), 1)

    def test_install_hooks_preserves_unrelated_settings(self):
        claude = self.root / ".claude"
        claude.mkdir()
        (claude / "settings.local.json").write_text(
            json.dumps({"env": {"FOO": "bar"}, "hooks": {"Stop": [{"hooks": [{"type": "command", "command": "echo other"}]}]}}),
            encoding="utf-8",
        )
        self.run_cli("install-hooks", "--write")
        settings = json.loads((claude / "settings.local.json").read_text(encoding="utf-8"))
        self.assertEqual(settings["env"], {"FOO": "bar"})
        self.assertEqual(len(settings["hooks"]["Stop"]), 2)

    def test_config_file_overrides_defaults(self):
        (self.root / ".agentmux.json").write_text(
            json.dumps({"branch_prefix": "wip/", "agent_cmd": "claude --model opus"}),
            encoding="utf-8",
        )
        cfg = agentmux.load_config()
        self.assertEqual(cfg.branch_prefix, "wip/")
        self.assertEqual(cfg.agent_cmd, "claude --model opus")

    def test_env_beats_config_file(self):
        (self.root / ".agentmux.json").write_text(
            json.dumps({"branch_prefix": "wip/"}), encoding="utf-8"
        )
        os.environ["AGENTMUX_BRANCH_PREFIX"] = "env/"
        try:
            self.assertEqual(agentmux.load_config().branch_prefix, "env/")
        finally:
            os.environ.pop("AGENTMUX_BRANCH_PREFIX")

    def test_malformed_config_file_is_reported(self):
        (self.root / ".agentmux.json").write_text("{oops", encoding="utf-8")
        with self.assertRaises(agentmux.AgentmuxError):
            agentmux.load_config()

    def test_default_base_prefers_current_head_without_remote(self):
        self.assertEqual(agentmux.default_base(self.root), "main")


if __name__ == "__main__":
    unittest.main()
