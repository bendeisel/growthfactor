#!/usr/bin/env python3
"""Step 3: rewrite every beat in our voice, without moving the cursor.

    rewrite.py <slug> [--force] [--batch 25] [--tolerance 0.15]

Reads  video/jobs/<slug>/work/segments.json
Writes video/jobs/<slug>/work/scripts.json
       video/jobs/<slug>/review.md   (the human read-through)

Beats go up in batches rather than one at a time, so the model can see the
shape of the whole lesson and avoid re-introducing itself every thirty
seconds. Batching also means one cached system prompt instead of forty.

Two checks run on everything that comes back, because a rewrite that reads
beautifully and names the wrong menu is worse than no rewrite at all:

  locked terms  every interface name, action and number the model carried
                through must actually be in its script, verbatim
  word budget   within --tolerance of the seconds of footage the beat covers

Failures go back once with the specific problem named. Anything still failing
after that is written out with `needs_human: true` rather than quietly shipped,
and review.md lists it at the top.
"""

import argparse
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (  # noqa: E402
    Manifest, SKILL, cfg, cfg_float, cfg_int, die, log, read_json, write_json,
)

SCHEMA = {
    "type": "object",
    "properties": {
        "lines": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "i": {"type": "integer"},
                    "locked": {"type": "array", "items": {"type": "string"}},
                    "script": {"type": "string"},
                },
                "required": ["i", "locked", "script"],
                "additionalProperties": False,
            },
        },
    },
    "required": ["lines"],
    "additionalProperties": False,
}


def load_template():
    path = os.path.join(SKILL, "templates", "rewrite-prompt.md")
    with open(path, encoding="utf-8") as fh:
        return fh.read()


def build_system():
    tpl = load_template()
    replacements = {
        "{{PRESENTER}}": cfg("GF_PRESENTER", "the presenter"),
        "{{COMPANY}}": cfg("GF_COMPANY", "Growth Factor"),
        "{{PRODUCT}}": cfg("GF_PRODUCT_NAME", required=True),
        "{{EXTRA_VOICE}}": cfg("GF_EXTRA_VOICE", ""),
    }
    for key, val in replacements.items():
        tpl = tpl.replace(key, val)
    return tpl


def render_beats(beats):
    lines = []
    for b in beats:
        note = ""
        if b.get("long"):
            note = ("  (long stretch of screen action with little narration "
                    "under it: fill the time)")
        lines.append(
            "### beat %d\n"
            "footage: %.1f seconds\n"
            "word budget: %d%s\n"
            "original: %s"
            % (b["i"], b["clip_duration"], b["word_budget"], note, b["orig_text"])
        )
    return "\n\n".join(lines)


def normalise(text):
    """Lowercase, strip punctuation that varies between a term and its use in
    a sentence, and squash whitespace. Keeps the check from failing on a
    trailing comma."""
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s%$.]+", " ", text.lower())).strip()


def check(line, beat, tolerance):
    """Return a list of human-readable problems, empty if the line is good."""
    problems = []
    script = line.get("script", "").strip()
    if not script:
        return ["the script is empty"]

    haystack = normalise(script)
    missing = []
    for term in line.get("locked") or []:
        needle = normalise(term)
        if not needle:
            continue
        if not re.search(r"(?<!\w)%s(?!\w)" % re.escape(needle), haystack):
            missing.append(term)
    if missing:
        problems.append(
            "these locked terms are not in the script verbatim: %s"
            % ", ".join(repr(m) for m in missing))

    words = len(script.split())
    budget = beat["word_budget"]
    low = int(budget * (1 - tolerance))
    high = int(round(budget * (1 + tolerance)))
    if words < low:
        problems.append(
            "%d words is short for %.1f seconds of footage, budget is %d "
            "(acceptable range %d to %d)" % (words, beat["clip_duration"], budget, low, high))
    elif words > high:
        problems.append(
            "%d words will overrun %.1f seconds of footage, budget is %d "
            "(acceptable range %d to %d)" % (words, beat["clip_duration"], budget, low, high))

    # Written as escapes on purpose: the repo rule is that no em dash exists
    # in any file, including the code that detects them.
    if "\u2014" in script or "\u2013" in script:
        problems.append("contains a dash character that the presenter cannot say out loud")
    if re.search(r"^\s*[-*#]|\[|\]", script):
        problems.append("contains markup or stage directions, it must be plain spoken words")
    return problems


def call_model(client, system, user, max_tokens, model, effort):
    """One structured request. Streamed because adaptive thinking plus a full
    batch of rewrites can run long enough to hit a non-streaming timeout."""
    import anthropic

    try:
        with client.messages.stream(
            model=model,
            max_tokens=max_tokens,
            thinking={"type": "adaptive"},
            output_config={
                "effort": effort,
                "format": {"type": "json_schema", "schema": SCHEMA},
            },
            system=[{
                "type": "text",
                "text": system,
                "cache_control": {"type": "ephemeral"},
            }],
            messages=[{"role": "user", "content": user}],
        ) as stream:
            message = stream.get_final_message()
    except anthropic.BadRequestError as exc:
        die("the API rejected the request: %s" % exc.message)
    except anthropic.AuthenticationError:
        die("ANTHROPIC_API_KEY is missing or invalid.")
    except anthropic.RateLimitError as exc:
        retry = exc.response.headers.get("retry-after", "60")
        die("rate limited. Retry after %s seconds." % retry)
    except anthropic.APIStatusError as exc:
        die("API error %s: %s" % (exc.status_code, exc.message))
    except anthropic.APIConnectionError:
        die("could not reach the API. Check the network and try again.")

    if message.stop_reason == "refusal":
        die("the model declined this batch. Check the source narration for "
            "anything that reads as a credential or private data.")
    if message.stop_reason == "max_tokens":
        die("the response hit max_tokens. Lower --batch and run again.")

    text = next((b.text for b in message.content if b.type == "text"), None)
    if not text:
        die("no text block came back from the model")
    return json.loads(text)["lines"], message.usage


def rewrite_batch(client, system, beats, tolerance, model, effort, max_tokens):
    user = ("Rewrite these %d beats.\n\n%s" % (len(beats), render_beats(beats)))
    lines, usage = call_model(client, system, user, max_tokens, model, effort)
    by_i = {ln["i"]: ln for ln in lines}
    beats_by_i = {b["i"]: b for b in beats}

    failures = {}
    for b in beats:
        ln = by_i.get(b["i"])
        if ln is None:
            failures[b["i"]] = ["the model skipped this beat"]
            continue
        problems = check(ln, b, tolerance)
        if problems:
            failures[b["i"]] = problems

    if failures:
        log("  %d of %d beats failed the check, sending them back once"
            % (len(failures), len(beats)))
        retry_beats = [beats_by_i[i] for i in sorted(failures) if i in beats_by_i]
        detail = "\n\n".join(
            "### beat %d\nyour script: %s\nproblems:\n%s"
            % (i, (by_i.get(i) or {}).get("script", "(missing)"),
               "\n".join("- " + p for p in failures[i]))
            for i in sorted(failures)
        )
        retry_user = (
            "These beats did not pass the check. Fix exactly the problems "
            "listed and return only these beats.\n\n%s\n\nThe originals "
            "again, for reference:\n\n%s" % (detail, render_beats(retry_beats))
        )
        fixed, _ = call_model(client, system, retry_user, max_tokens, model, effort)
        for ln in fixed:
            if ln["i"] in failures:
                by_i[ln["i"]] = ln

    out = []
    for b in beats:
        ln = by_i.get(b["i"]) or {"i": b["i"], "locked": [], "script": ""}
        problems = check(ln, b, tolerance)
        out.append({
            "i": b["i"],
            "script": ln.get("script", "").strip(),
            "locked": ln.get("locked") or [],
            "words": len(ln.get("script", "").split()),
            "word_budget": b["word_budget"],
            "clip_duration": b["clip_duration"],
            "orig_text": b["orig_text"],
            "needs_human": bool(problems),
            "problems": problems,
        })
    return out, usage


def write_review(path, rows, slug):
    flagged = [r for r in rows if r["needs_human"]]
    lines = [
        "# Review: %s" % slug,
        "",
        "Read every line out loud against the screen recording before you "
        "render. One wrong menu name costs more than the whole pipeline saves.",
        "",
    ]
    if flagged:
        lines += ["## Fix these first", ""]
        for r in flagged:
            lines.append("- **beat %d** (%.1fs): %s"
                         % (r["i"], r["clip_duration"], "; ".join(r["problems"])))
        lines.append("")
    lines += ["## Full script", ""]
    for r in rows:
        flag = "  **CHECK**" if r["needs_human"] else ""
        lines.append("### beat %d  %.1fs  %d/%d words%s"
                     % (r["i"], r["clip_duration"], r["words"], r["word_budget"], flag))
        lines.append("")
        lines.append(r["script"] or "_(empty)_")
        lines.append("")
        lines.append("> original: %s" % r["orig_text"])
        lines.append("")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write("\n".join(lines))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("slug")
    ap.add_argument("--batch", type=int, default=None, help="beats per request")
    ap.add_argument("--tolerance", type=float, default=None,
                    help="allowed drift from the word budget, 0.15 is 15 percent")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    try:
        import anthropic
    except ImportError:
        die("the anthropic SDK is not installed.\n  pip install anthropic")

    man = Manifest(args.slug)
    spath = os.path.join(man.dir, "work", "segments.json")
    if not os.path.exists(spath):
        die("no segments yet. Run segment.py %s first." % args.slug)

    out_path = os.path.join(man.dir, "work", "scripts.json")
    if man.done("rewrite") and os.path.exists(out_path) and not args.force:
        log("scripts already present, skipping. --force to redo.")
        return

    beats = read_json(spath)["beats"]
    batch = args.batch or cfg_int("GF_REWRITE_BATCH", 25)
    tolerance = args.tolerance if args.tolerance is not None else cfg_float(
        "GF_BUDGET_TOLERANCE", 0.15)
    model = cfg("GF_REWRITE_MODEL", "claude-opus-5")
    effort = cfg("GF_REWRITE_EFFORT", "high")
    max_tokens = cfg_int("GF_REWRITE_MAX_TOKENS", 32000)

    client = anthropic.Anthropic()
    system = build_system()

    rows, tokens_in, tokens_out = [], 0, 0
    for start in range(0, len(beats), batch):
        chunk = beats[start:start + batch]
        log("rewriting beats %d to %d" % (chunk[0]["i"], chunk[-1]["i"]))
        got, usage = rewrite_batch(client, system, chunk, tolerance, model,
                                   effort, max_tokens)
        rows.extend(got)
        tokens_in += usage.input_tokens
        tokens_out += usage.output_tokens

    write_json(out_path, {"model": model, "tolerance": tolerance, "lines": rows})
    review = os.path.join(man.dir, "review.md")
    write_review(review, rows, args.slug)

    flagged = [r["i"] for r in rows if r["needs_human"]]
    man.mark("rewrite", model=model, lines=len(rows), flagged=flagged,
             input_tokens=tokens_in, output_tokens=tokens_out)

    log("wrote %d lines. %d in, %d out tokens." % (len(rows), tokens_in, tokens_out))
    if flagged:
        log("beats %s still fail the check and are marked needs_human. "
            "Fix them in work/scripts.json before rendering."
            % ", ".join(str(i) for i in flagged))
    log("read %s before you spend a cent on renders." % os.path.join(args.slug, "review.md"))


if __name__ == "__main__":
    main()
