#!/usr/bin/env bash
# Resolve a Python interpreter across Linux/macOS/Windows-Git-Bash.
for candidate in python3 python py; do
  if command -v "$candidate" >/dev/null 2>&1; then
    exec "$candidate" "$@"
  fi
done
# No Python available: stay silent rather than blocking the tool call.
exit 0
