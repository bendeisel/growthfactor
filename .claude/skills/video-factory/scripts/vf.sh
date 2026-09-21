#!/usr/bin/env bash
# Growth Factor video factory. Rebuild a software walkthrough with our own
# presenter over the original screen recording.
#
#   ./vf.sh doctor                     check tools, keys and config
#   ./vf.sh new <slug> <source.mp4>    start a job
#   ./vf.sh prep <slug>                transcribe, segment, rewrite, then STOP
#   ./vf.sh render <slug>              HeyGen renders, after you have reviewed
#   ./vf.sh build <slug>               composite and concat
#   ./vf.sh status <slug>              where a job got to
#
# prep stops on purpose. The renders are the expensive half and a wrong menu
# name is the one mistake that makes the whole video worthless, so a human
# reads review.md before a cent is spent. There is no command that goes from
# a raw source file to a finished video without that stop.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL="$(cd "$HERE/.." && pwd)"
REPO="$(cd "$SKILL/../../.." && pwd)"
JOBS="$REPO/video/jobs"
PY="${PYTHON:-python3}"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }
note() { printf '%s\n' "$*" >&2; }
rule() { printf '\n%s\n' "------------------------------------------------------------" >&2; }

usage() { sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit "${1:-0}"; }

cmd_doctor() {
  local bad=0
  for bin in ffmpeg ffprobe "$PY"; do
    if command -v "$bin" >/dev/null 2>&1; then
      printf '  ok      %s\n' "$bin"
    else
      printf '  MISSING %s\n' "$bin"; bad=1
    fi
  done
  for mod in anthropic faster_whisper; do
    if "$PY" -c "import $mod" >/dev/null 2>&1; then
      printf '  ok      python module %s\n' "$mod"
    else
      printf '  MISSING python module %s (pip install %s)\n' "$mod" \
        "$([ "$mod" = faster_whisper ] && echo faster-whisper || echo "$mod")"
      [ "$mod" = anthropic ] && bad=1
    fi
  done
  if [ -f "$SKILL/config.env" ]; then
    printf '  ok      config.env\n'
    # shellcheck disable=SC1091
    . "$SKILL/config.env"
  else
    printf '  MISSING config.env (cp config.example.env config.env)\n'; bad=1
  fi
  for key in HEYGEN_API_KEY ANTHROPIC_API_KEY GF_HEYGEN_AVATAR_ID GF_HEYGEN_VOICE_ID GF_PRODUCT_NAME; do
    if [ -n "${!key:-}" ]; then
      printf '  ok      %s\n' "$key"
    else
      printf '  MISSING %s\n' "$key"; bad=1
    fi
  done
  [ "$bad" -eq 0 ] || die "fix the above before running a job"
  note "ready"
}

cmd_new() {
  local slug="${1:-}" src="${2:-}"
  [ -n "$slug" ] && [ -n "$src" ] || usage 1
  [ -f "$src" ] || die "no such file: $src"
  local dir="$JOBS/$slug"
  [ -e "$dir/source.mp4" ] && die "$slug already has a source video"
  mkdir -p "$dir/work/avatar" "$dir/work/clips" "$dir/out" "$dir/assets"
  cp "$src" "$dir/source.mp4"
  "$PY" "$HERE/registry.py" add --slug "$slug" --title "$slug" \
    --source "$(basename "$src")" 2>/dev/null || true
  note "job ready at video/jobs/$slug"
  note "next: ./vf.sh prep $slug"
}

cmd_prep() {
  local slug="${1:-}"; shift || true
  [ -n "$slug" ] || usage 1
  rule; note "1/3 transcribing"
  "$PY" "$HERE/transcribe.py" "$slug" "$@"
  rule; note "2/3 segmenting and budgeting"
  "$PY" "$HERE/segment.py" "$slug" "$@"
  rule; note "3/3 rewriting"
  "$PY" "$HERE/rewrite.py" "$slug" "$@"
  "$PY" "$HERE/registry.py" set "$slug" --status written 2>/dev/null || true
  rule
  note "STOP HERE. Read video/jobs/$slug/review.md against the source video."
  note "Fix anything wrong in video/jobs/$slug/work/scripts.json."
  note "Then: ./vf.sh render $slug"
}

cmd_render() {
  local slug="${1:-}"; shift || true
  [ -n "$slug" ] || usage 1
  "$PY" "$HERE/heygen.py" render "$slug" "$@"
  "$PY" "$HERE/registry.py" set "$slug" --status rendered 2>/dev/null || true
  note "next: ./vf.sh build $slug"
}

cmd_build() {
  local slug="${1:-}"; shift || true
  [ -n "$slug" ] || usage 1
  "$PY" "$HERE/composite.py" "$slug" "$@"
  "$PY" "$HERE/registry.py" set "$slug" --status built 2>/dev/null || true
  note "done: video/jobs/$slug/out/final.mp4"
}

cmd_status() {
  local slug="${1:-}"
  [ -n "$slug" ] || usage 1
  local man="$JOBS/$slug/manifest.json"
  [ -f "$man" ] || die "no job called $slug"
  "$PY" - "$man" <<'PYEOF'
import json, sys
d = json.load(open(sys.argv[1]))
print("slug          %s" % d.get("slug"))
print("source        %.1f minutes" % ((d.get("source_duration") or 0) / 60))
for step in ("transcribe", "segment", "rewrite", "render", "composite"):
    info = (d.get("steps") or {}).get(step)
    if not info:
        print("%-13s -" % step)
        continue
    extra = ", ".join("%s=%s" % (k, v) for k, v in sorted(info.items())
                      if k != "ok" and not isinstance(v, (dict, list)))
    print("%-13s done   %s" % (step, extra))
flagged = ((d.get("steps") or {}).get("rewrite") or {}).get("flagged") or []
if flagged:
    print("\nbeats still needing a human: %s" % ", ".join(str(i) for i in flagged))
PYEOF
}

case "${1:-}" in
  doctor) shift; cmd_doctor "$@" ;;
  new)    shift; cmd_new "$@" ;;
  prep)   shift; cmd_prep "$@" ;;
  render) shift; cmd_render "$@" ;;
  build)  shift; cmd_build "$@" ;;
  status) shift; cmd_status "$@" ;;
  ""|-h|--help|help) usage 0 ;;
  *) die "unknown command: $1" ;;
esac
