#!/usr/bin/env python3
"""Run the whole library through the pipeline instead of one video at a time.

    batch.py intake <folder>      make a job for every video in a folder
    batch.py prep                 transcribe, segment and rewrite everything
    batch.py queue                what is waiting on a human, as one list
    batch.py render               render everything marked reviewed
    batch.py build                composite and caption everything rendered
    batch.py verify               QA every built video before handover
    batch.py publish [--confirm]  upload to GoHighLevel and import the course
    batch.py status               the whole library on one screen

Common flags: --only slug,slug   restrict to named jobs
              --dry-run          say what would run, run nothing
              --stop-on-error    default is to carry on and report at the end

Nothing here reimplements a step. Each command shells out to the same script
a single job would use, so there is exactly one copy of the logic and the
batch path cannot drift from the single-job path.

One video failing never stops the other thirty-nine. Failures are collected
and printed as a block at the end, because a failure scrolled past four
minutes ago is a failure nobody acts on.

## The gate

`render` only picks up jobs the registry marks `reviewed`. Nothing sets that
status automatically. A human reads review.md and runs:

    registry.py set <slug> --status reviewed --reviewer ben

That is deliberate. Renders cost money and unreviewed narration is the one
defect that makes a video worse than not shipping it.
"""

import argparse
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import registry  # noqa: E402
from common import (  # noqa: E402
    JOBS, Manifest, die, log, read_json, require_binary, run,
)

HERE = os.path.dirname(os.path.abspath(__file__))
VIDEO_EXT = (".mp4", ".mov", ".mkv", ".webm", ".m4v")


def script(name):
    return [sys.executable, os.path.join(HERE, name)]


def rows(only=None, status=None):
    out = registry.load()
    if only:
        wanted = {s.strip() for s in only.split(",") if s.strip()}
        missing = wanted - {r["slug"] for r in out}
        if missing:
            die("not in the registry: %s" % ", ".join(sorted(missing)))
        out = [r for r in out if r["slug"] in wanted]
    if status:
        out = [r for r in out if r["status"] in status]
    return out


def run_step(slug, argv, dry_run, stream=False):
    """Returns None on success, or the failure text.

    Output is normally captured so forty successful videos do not bury the
    failures. `stream` turns that off for steps whose whole purpose is to show
    you what they would do, such as a publish dry run.
    """
    if dry_run:
        log("  would run: %s" % " ".join(argv[1:]))
        return None
    proc = subprocess.run(argv, stdout=None,
                          stderr=None if stream else subprocess.PIPE, text=True)
    if proc.returncode != 0:
        tail = "\n".join((proc.stderr or "").strip().splitlines()[-6:])
        return tail or "exit %d" % proc.returncode
    return None


def report(failures, verb):
    if not failures:
        log("\nall %s cleanly" % verb)
        return 0
    log("\n%d failed:" % len(failures))
    for slug, why in failures:
        log("\n  %s" % slug)
        for line in why.splitlines():
            log("    %s" % line)
    return 1


def cmd_intake(args):
    folder = args.folder
    if not os.path.isdir(folder):
        die("not a folder: %s" % folder)
    found = sorted(f for f in os.listdir(folder)
                   if f.lower().endswith(VIDEO_EXT))
    if not found:
        die("no video files in %s" % folder)

    existing = {r["slug"] for r in registry.load()}
    added, skipped = [], []
    for name in found:
        slug = registry.slugify(os.path.splitext(name)[0])
        if slug in existing:
            skipped.append(slug)
            continue
        if args.dry_run:
            added.append(slug)
            continue
        dest = os.path.join(JOBS, slug)
        for sub in ("work/avatar", "work/clips", "out", "assets"):
            os.makedirs(os.path.join(dest, sub), exist_ok=True)
        src = os.path.join(folder, name)
        target = os.path.join(dest, "source.mp4")
        if not os.path.exists(target):
            if name.lower().endswith(".mp4"):
                import shutil
                shutil.copy2(src, target)
            else:
                # Everything downstream opens source.mp4, so anything else is
                # remuxed rather than special cased in five other scripts.
                require_binary("ffmpeg")
                run(["ffmpeg", "-y", "-i", src, "-c", "copy", target])
        subprocess.run(script("registry.py") + [
            "add", "--slug", slug, "--title", os.path.splitext(name)[0],
            "--source", name], stdout=subprocess.DEVNULL)
        added.append(slug)
        existing.add(slug)

    log("added %d job%s" % (len(added), "" if len(added) == 1 else "s"))
    for slug in added:
        log("  %s" % slug)
    if skipped:
        log("already in the registry, left alone: %s" % ", ".join(skipped))
    return 0


def cmd_prep(args):
    todo = rows(args.only, {"intake", "transcribed"})
    if not todo:
        log("nothing waiting for prep")
        return 0
    log("prepping %d job%s" % (len(todo), "" if len(todo) == 1 else "s"))
    failures = []
    for r in todo:
        slug = r["slug"]
        log("\n=== %s ===" % slug)
        why = None
        for step in ("transcribe.py", "segment.py", "rewrite.py"):
            why = run_step(slug, script(step) + [slug], args.dry_run)
            if why:
                failures.append((slug, "%s: %s" % (step, why)))
                break
            if args.stop_on_error and why:
                break
        if why:
            if args.stop_on_error:
                break
            continue
        if not args.dry_run:
            subprocess.run(script("registry.py") + ["set", slug, "--status", "written"],
                           stdout=subprocess.DEVNULL)
    code = report(failures, "prepped")
    if not args.dry_run:
        log("\nnext: batch.py queue")
    return code


def cmd_queue(args):
    """One list of what a human owes the pipeline, plus a file they can work
    through. Forty separate review.md files is not a queue."""
    waiting = rows(args.only, {"written"})
    lines = ["# Review queue", "",
             "Read each script against its source video. You are checking one",
             "thing above all: does the narration name the same control the",
             "cursor moves toward.", "",
             "Mark a video done with:", "",
             "    registry.py set <slug> --status reviewed --reviewer <you>", ""]
    if not waiting:
        log("nothing waiting for review")
        lines.append("_Nothing waiting._")
    for r in waiting:
        slug = r["slug"]
        man = Manifest(slug)
        flagged = (man.data.get("steps", {}).get("rewrite") or {}).get("flagged") or []
        beats = (man.data.get("steps", {}).get("segment") or {}).get("beats", "?")
        mins = (man.get("source_duration") or 0) / 60
        note = "  %d beat%s NEED FIXING" % (len(flagged), "" if len(flagged) == 1 else "s") if flagged else ""
        log("  %-28s %5.1f min  %s beats%s" % (slug, mins, beats, note))
        lines.append("- [ ] **%s** (%.1f min, %s beats)%s  `video/jobs/%s/review.md`"
                     % (slug, mins, beats, note, slug))
        if flagged:
            lines.append("      beats to fix first: %s"
                         % ", ".join(str(i) for i in flagged))
    path = os.path.join(os.path.dirname(JOBS), "REVIEW-QUEUE.md")
    if not args.dry_run:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write("\n".join(lines) + "\n")
        log("\nwrote video/REVIEW-QUEUE.md")
    return 0


def cmd_render(args):
    todo = rows(args.only, {"reviewed"})
    if not todo:
        log("nothing marked reviewed. Run batch.py queue to see what is waiting.")
        return 0
    log("rendering %d job%s" % (len(todo), "" if len(todo) == 1 else "s"))
    failures = []
    for r in todo:
        slug = r["slug"]
        log("\n=== %s ===" % slug)
        argv = script("heygen.py") + ["render", slug]
        if args.dry_run:
            argv.append("--dry-run")
            subprocess.run(argv)
            continue
        why = run_step(slug, argv, False)
        if why:
            failures.append((slug, why))
            if args.stop_on_error:
                break
            continue
        subprocess.run(script("registry.py") + ["set", slug, "--status", "rendered"],
                       stdout=subprocess.DEVNULL)
    return report(failures, "rendered")


def cmd_build(args):
    todo = rows(args.only, {"rendered"})
    if not todo:
        log("nothing waiting to be built")
        return 0
    log("building %d job%s" % (len(todo), "" if len(todo) == 1 else "s"))
    failures = []
    for r in todo:
        slug = r["slug"]
        log("\n=== %s ===" % slug)
        why = run_step(slug, script("composite.py") + [slug], args.dry_run)
        if why:
            failures.append((slug, "composite: %s" % why))
            if args.stop_on_error:
                break
            continue
        cap = script("captions.py") + [slug, "--force"]
        if args.precise_captions:
            cap.append("--precise")
        why = run_step(slug, cap, args.dry_run)
        if why:
            failures.append((slug, "captions: %s" % why))
            if args.stop_on_error:
                break
            continue
        why = run_step(slug, script("thumbnail.py") + [slug, "--force"], args.dry_run)
        if why:
            failures.append((slug, "thumbnail: %s" % why))
            if args.stop_on_error:
                break
            continue
        if not args.dry_run:
            man = Manifest(slug)
            dur = (man.data.get("steps", {}).get("composite") or {}).get("duration", 0)
            subprocess.run(script("registry.py") + [
                "set", slug, "--status", "built",
                "--output-minutes", "%.1f" % (float(dur) / 60)],
                stdout=subprocess.DEVNULL)
    code = report(failures, "built")
    if not args.dry_run:
        log("\nnext: batch.py verify")
    return code


def check_one(slug):
    """QA a built video. Returns a list of problems, empty if it is clean."""
    problems = []
    man = Manifest(slug)
    out = os.path.join(man.dir, "out", "final.mp4")
    if not os.path.exists(out):
        return ["out/final.mp4 is missing"]
    if os.path.getsize(out) < 10_000:
        problems.append("out/final.mp4 is suspiciously small (%d bytes)"
                        % os.path.getsize(out))

    from common import probe_duration
    actual = probe_duration(out)

    tpath = os.path.join(man.dir, "work", "timing.json")
    if os.path.exists(tpath):
        beats = read_json(tpath)["beats"]
        expected = sum(b["final"] for b in beats)
        for name in ("intro", "outro"):
            asset = os.path.join(man.dir, "assets", "%s.mp4" % name)
            if os.path.exists(asset):
                expected += probe_duration(asset)
        # A whole beat missing from the concat is the failure worth catching,
        # and that is seconds, not the tens of milliseconds a concat adds.
        if abs(actual - expected) > max(1.0, expected * 0.02):
            problems.append("runs %.1fs but the beats add up to %.1fs, so a "
                            "segment is probably missing" % (actual, expected))

    info = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a:0",
         "-show_entries", "stream=codec_name", "-of", "csv=p=0", out],
        capture_output=True, text=True)
    if not info.stdout.strip():
        problems.append("has no audio stream at all")
    else:
        vol = subprocess.run(
            ["ffmpeg", "-hide_banner", "-i", out, "-af", "volumedetect",
             "-f", "null", "-"], capture_output=True, text=True).stderr
        for line in vol.splitlines():
            if "mean_volume" in line:
                try:
                    mean = float(line.split(":")[-1].replace("dB", "").strip())
                except ValueError:
                    break
                if mean < -50:
                    problems.append("is effectively silent (mean volume %.1f dB)"
                                    % mean)
                break

    thumb = os.path.join(man.dir, "out", "thumbnail.jpg")
    if not os.path.exists(thumb):
        problems.append("has no thumbnail")
    elif os.path.getsize(thumb) < 5_000:
        problems.append("the thumbnail is suspiciously small (%d bytes)"
                        % os.path.getsize(thumb))

    vtt = os.path.join(man.dir, "out", "final.vtt")
    if not os.path.exists(vtt):
        problems.append("has no captions")
    else:
        import re
        times = re.findall(r"--> (\d\d):(\d\d):(\d\d\.\d\d\d)",
                           open(vtt, encoding="utf-8").read())
        if not times:
            problems.append("the caption file has no cues")
        else:
            h, m, s = times[-1]
            last = int(h) * 3600 + int(m) * 60 + float(s)
            if last > actual + 0.5:
                problems.append("captions run %.1fs past the end of the video"
                                % (last - actual))

    spath = os.path.join(man.dir, "work", "scripts.json")
    if os.path.exists(spath):
        flagged = [ln["i"] for ln in read_json(spath)["lines"]
                   if ln.get("needs_human")]
        if flagged:
            problems.append("was built with beats %s still unreviewed"
                            % ", ".join(str(i) for i in flagged))
    return problems


def cmd_verify(args):
    todo = rows(args.only, {"built", "published"})
    if not todo:
        log("nothing built to verify")
        return 0
    require_binary("ffprobe")
    require_binary("ffmpeg")
    bad = []
    for r in todo:
        slug = r["slug"]
        problems = check_one(slug)
        if problems:
            bad.append((slug, "\n".join(problems)))
            log("  FAIL  %s" % slug)
            for p in problems:
                log("        %s" % p)
        else:
            log("  ok    %s" % slug)
    if bad:
        log("\n%d of %d videos are not fit to hand over" % (len(bad), len(todo)))
        return 1
    log("\nall %d videos pass" % len(todo))
    return 0


def cmd_publish(args):
    """Upload every built video, then import them all as one course.

    Two phases on purpose. Uploads are per video and resumable; the course
    import is a single call describing the whole product, so it only makes
    sense once every video it references has a URL.
    """
    todo = rows(args.only, {"built"})
    if not todo:
        log("nothing built and waiting to publish")
        return 0
    if not args.confirm:
        log("DRY RUN. Nothing is sent. Add --confirm to publish for real.\n")

    failures = []
    for r in todo:
        slug = r["slug"]
        log("=== %s ===" % slug)
        argv = script("publish.py") + ["media", slug]
        if args.confirm:
            argv.append("--confirm")
        why = run_step(slug, argv, args.dry_run, stream=not args.confirm)
        if why:
            failures.append((slug, "media upload: %s" % why))
            if args.stop_on_error:
                break
    if failures:
        report(failures, "uploaded")
        log("\nnot importing the course while uploads are failing: the import "
            "references those URLs.")
        return 1

    log("\n=== course import ===")
    argv = script("publish.py") + ["course", "--visibility", args.visibility]
    if args.only:
        argv += ["--only", args.only]
    if args.confirm:
        argv.append("--confirm")
    why = run_step("course", argv, args.dry_run, stream=not args.confirm)
    if why:
        return report([("course import", why)], "imported")
    return 0


def cmd_status(args):
    todo = rows(args.only)
    if not todo:
        log("the registry is empty")
        return 0
    counts = {}
    for r in todo:
        counts[r["status"]] = counts.get(r["status"], 0) + 1
    print("%-28s %-12s %-7s %s" % ("slug", "status", "mins", "title"))
    for r in todo:
        print("%-28s %-12s %-7s %s" % (r["slug"], r["status"],
                                       r.get("output_minutes", ""), r.get("title", "")))
    print()
    print("  ".join("%s %d" % (k, v) for k, v in
                    sorted(counts.items(), key=lambda kv: registry.ORDER.index(kv[0])
                           if kv[0] in registry.ORDER else 99)))
    return 0


def add_common(parser, suppress):
    """The shared flags, on the main parser and on every subcommand.

    Subcommand copies default to SUPPRESS so they leave the attribute unset
    when absent, which is what lets the main parser's value survive. Without
    that, `batch.py --dry-run build` would have its flag quietly overwritten
    with False by the subparser's own default.
    """
    kw = {"default": argparse.SUPPRESS} if suppress else {}
    parser.add_argument("--only", help="comma separated slugs", **kw)
    parser.add_argument("--dry-run", action="store_true", **kw)
    parser.add_argument("--stop-on-error", action="store_true", **kw)
    parser.add_argument("--precise-captions", action="store_true",
                        help="time captions against the rendered audio (slower)",
                        **kw)
    parser.add_argument("--confirm", action="store_true",
                        help="actually write to GoHighLevel", **kw)
    parser.add_argument("--visibility", choices=["draft", "published"],
                        default=argparse.SUPPRESS if suppress else "draft",
                        help="how the imported course lands")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    add_common(ap, suppress=False)
    sub = ap.add_subparsers(dest="cmd", required=True)

    i = sub.add_parser("intake")
    i.add_argument("folder")
    add_common(i, suppress=True)
    i.set_defaults(func=cmd_intake)
    for name, fn in (("prep", cmd_prep), ("queue", cmd_queue), ("render", cmd_render),
                     ("build", cmd_build), ("verify", cmd_verify),
                     ("publish", cmd_publish), ("status", cmd_status)):
        p = sub.add_parser(name)
        add_common(p, suppress=True)
        p.set_defaults(func=fn)

    args = ap.parse_args()
    sys.exit(args.func(args) or 0)


if __name__ == "__main__":
    main()
