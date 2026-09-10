#!/usr/bin/env python3
"""Keep the Hostinger token out of the transcript.

.claude/skills/site-factory/config.env holds HOSTINGER_API_TOKEN, which can
delete live client websites. This hook blocks the tool calls that would put
its contents into the conversation, or overwrite it by accident.

Running the deploy scripts is untouched: hostinger.sh sources config.env
itself, and that never crosses into the transcript.
"""

import json
import os
import re
import sys

PROTECTED_BASENAMES = ("config.env", ".env", ".env.local", ".env.production")

# Commands that would echo a protected file back into the conversation.
PRINTERS = r"\b(cat|bat|less|more|head|tail|grep|rg|awk|sed|cut|xxd|od|strings|type)\b"


def deny(reason):
    sys.stderr.write(reason + "\n")
    sys.exit(2)


def protected(path):
    return os.path.basename(os.path.normpath(path)) in PROTECTED_BASENAMES


def check_file_tool(tool_name, tool_input):
    path = tool_input.get("file_path") or ""
    if path and protected(path):
        deny(
            "Blocked: %s targets %s, which holds live API credentials.\n"
            "Read or edit it outside Claude. If you need a key name rather "
            "than a value, look at config.example.env instead."
            % (tool_name, os.path.basename(path))
        )


def check_bash(tool_input):
    command = tool_input.get("command") or ""
    if not any(name in command for name in PROTECTED_BASENAMES):
        return
    if re.search(PRINTERS, command):
        deny(
            "Blocked: this command would print a credentials file into the "
            "transcript. The Hostinger token can delete client websites.\n"
            "Run the deploy scripts directly instead, they source config.env "
            "on their own."
        )
    if re.search(r"(^|[;&|]\s*)(rm|mv|truncate)\b", command):
        deny("Blocked: this command would destroy a credentials file.")


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return
    tool_name = payload.get("tool_name") or ""
    tool_input = payload.get("tool_input") or {}
    if tool_name == "Bash":
        check_bash(tool_input)
    else:
        check_file_tool(tool_name, tool_input)


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        sys.exit(0)
