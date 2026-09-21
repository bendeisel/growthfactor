#!/usr/bin/env python3
"""Tests for the parts of the pipeline that are pure logic.

    python3 -m unittest discover -s .claude/skills/video-factory/tests -v

Stdlib only, no ffmpeg, no network, no API keys. Runs in well under a second.

What is covered is the arithmetic and the validation, because those are the
parts where a mistake is invisible: a video that desynchronises three minutes
in, or a script that reads well and names the wrong menu. The ffmpeg filter
graphs are not covered here; those are verified by building real footage and
measuring the output.
"""

import os
import random
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                os.pardir, "scripts"))

import captions      # noqa: E402
import composite     # noqa: E402
import registry      # noqa: E402
import rewrite       # noqa: E402
import segment       # noqa: E402

TOL = 1e-9   # fit() returns exact floats; rounding happens at format time


class TestFit(unittest.TestCase):
    """composite.fit decides how a beat's footage is stretched or frozen to
    meet its narration. Every one of these invariants failing is a video that
    drifts out of sync or cuts a word in half."""

    def check_invariants(self, footage, narration, speedup=1.25, slowdown=1.25):
        t = composite.fit(footage, narration, speedup, slowdown)
        self.assertGreaterEqual(
            t["final"], t["narration"] - TOL,
            "the beat is shorter than its narration, so audio would be cut")
        self.assertAlmostEqual(
            t["footage"] * t["scale"] + t["hold"], t["final"], delta=TOL,
            msg="footage plus freeze does not fill the beat")
        self.assertAlmostEqual(
            t["narration"] + t["pad"], t["final"], delta=TOL,
            msg="narration plus padding does not fill the beat")
        self.assertFalse(
            t["hold"] > TOL and t["pad"] > TOL,
            "footage and narration were both padded, which cannot be right")
        self.assertGreaterEqual(t["scale"], 1.0 / speedup - 1e-6,
                                "footage sped up past the cap")
        self.assertLessEqual(t["scale"], slowdown + 1e-6,
                             "footage slowed past the cap")
        self.assertGreaterEqual(t["hold"], 0.0)
        self.assertGreaterEqual(t["pad"], 0.0)
        return t

    def test_narration_longer_than_footage(self):
        t = self.check_invariants(6.0, 15.8)
        self.assertAlmostEqual(t["final"], 15.8, delta=TOL)
        self.assertAlmostEqual(t["scale"], 1.25, delta=TOL)
        self.assertGreater(t["hold"], 8.0, "should freeze the tail of the clip")

    def test_narration_slightly_shorter(self):
        t = self.check_invariants(11.0, 9.4)
        self.assertAlmostEqual(t["final"], 9.4, delta=TOL)
        self.assertLess(t["hold"], TOL)
        self.assertLess(t["pad"], TOL)

    def test_narration_much_shorter_pads_the_avatar(self):
        t = self.check_invariants(7.0, 4.0)
        self.assertAlmostEqual(t["final"], 5.6, delta=TOL)
        self.assertAlmostEqual(t["pad"], 1.6, delta=TOL)

    def test_exact_match_changes_nothing(self):
        t = self.check_invariants(10.0, 10.0)
        self.assertAlmostEqual(t["scale"], 1.0, delta=TOL)
        self.assertLess(t["hold"] + t["pad"], TOL)

    def test_fuzz(self):
        """Random footage and narration pairs, including absurd ones. No
        combination may break an invariant."""
        rng = random.Random(20260921)
        for _ in range(3000):
            footage = rng.uniform(0.3, 90.0)
            narration = rng.uniform(0.2, 90.0)
            self.check_invariants(footage, narration)

    def test_fuzz_with_other_caps(self):
        rng = random.Random(7)
        for _ in range(1000):
            self.check_invariants(rng.uniform(0.5, 40), rng.uniform(0.5, 40),
                                  speedup=rng.choice([1.1, 1.25, 1.5, 2.0]),
                                  slowdown=rng.choice([1.1, 1.25, 1.5, 2.0]))


class TestSegmenting(unittest.TestCase):

    @staticmethod
    def make_words(text, start, per=0.4, gap=0.05, big_gap_after=None):
        out, t = [], start
        for n, w in enumerate(text.split()):
            out.append({"start": round(t, 3), "end": round(t + per, 3), "word": w})
            t += per + (1.2 if n == big_gap_after else gap)
        return out, t

    def test_beats_tile_the_source_with_no_holes(self):
        """A hole here means screen action nobody narrates over."""
        segs = []
        for start, text in ((0.5, "Open the menu."), (12.0, "Click save."),
                            (30.0, "You are done.")):
            words, end = self.make_words(text, start)
            segs.append({"start": start, "end": end, "text": text, "words": words})
        beats = segment.build_beats(segs, 60.0, 2.5, 20.0)

        self.assertEqual(beats[0]["clip_start"], 0.0,
                         "the first beat must cover the opening frames")
        self.assertAlmostEqual(beats[-1]["clip_end"], 60.0, delta=TOL,
                               msg="the last beat must reach the end of the source")
        for a, b in zip(beats, beats[1:]):
            self.assertAlmostEqual(a["clip_end"], b["clip_start"], delta=TOL,
                                   msg="gap or overlap between beats")

    def test_budget_comes_from_footage_not_from_speech(self):
        """The subtle bug: budgeting from the original speech looks right and
        drifts a little further every beat."""
        words, end = self.make_words("Click save.", 0.0)
        segs = [{"start": 0.0, "end": end, "text": "Click save.", "words": words}]
        beats = segment.build_beats(segs, 40.0, 2.5, 20.0)
        self.assertAlmostEqual(beats[0]["clip_duration"], 40.0, delta=TOL)
        self.assertEqual(beats[0]["word_budget"], 100,
                         "40 seconds of footage at 2.5 wps is 100 words, "
                         "regardless of how few the original presenter used")

    def test_long_segment_splits_at_the_widest_pause(self):
        text = " ".join("w%d" % i for i in range(40))
        words, end = self.make_words(text, 0.0, big_gap_after=19)
        seg = {"start": 0.0, "end": end, "text": text, "words": words}
        parts = segment.split_long(seg, 8.0)
        self.assertGreater(len(parts), 1, "an over-long segment must split")
        boundaries = {p["text"].split()[-1] for p in parts[:-1]}
        self.assertIn("w19", boundaries,
                      "the widest pause should be one of the split points")

    def test_short_segments_merge(self):
        segs = [
            {"start": 0.0, "end": 1.0, "text": "Ok.", "words": []},
            {"start": 1.0, "end": 2.0, "text": "Right.", "words": []},
            {"start": 2.0, "end": 12.0, "text": "Now open the settings menu.",
             "words": []},
        ]
        merged = segment.merge_short(segs, 6.0, 20.0)
        self.assertEqual(len(merged), 1, "two runts should fold into the real beat")
        self.assertIn("settings", merged[0]["text"])

    def test_trailing_runt_folds_backwards(self):
        segs = [
            {"start": 0.0, "end": 10.0, "text": "A long enough opening line.",
             "words": []},
            {"start": 10.0, "end": 11.0, "text": "Done.", "words": []},
        ]
        merged = segment.merge_short(segs, 6.0, 20.0)
        self.assertEqual(len(merged), 1)
        self.assertTrue(merged[0]["text"].endswith("Done."))


class TestRewriteChecks(unittest.TestCase):
    """The validator is what stops a beautiful line naming the wrong button."""

    BEAT = {"word_budget": 20, "clip_duration": 8.0}

    def problems(self, script, locked=(), beat=None):
        return rewrite.check({"script": script, "locked": list(locked)},
                             beat or self.BEAT, 0.15)

    def test_clean_line_passes(self):
        line = ("Open Settings, then pick Integrations from the list on the "
                "left before you add any new connection to this account.")
        self.assertEqual(self.problems(line, ["Settings", "Integrations"]), [])

    def test_renamed_control_is_caught(self):
        line = ("Open the configuration area, then pick the connections panel "
                "on the left before anything else here.")
        found = self.problems(line, ["Settings"])
        self.assertTrue(any("Settings" in p for p in found),
                        "a locked term missing from the script must be reported")

    def test_trailing_punctuation_does_not_false_positive(self):
        line = ("Open Settings. Then choose Integrations, and wait for the "
                "list on that page to finish loading before you carry on.")
        self.assertEqual(self.problems(line, ["Settings", "Integrations"]), [])

    def test_partial_word_does_not_count_as_a_match(self):
        line = ("Open the Settingsxyz panel and wait for it to load before "
                "clicking anything at all here.")
        self.assertTrue(any("Settings" in p for p in self.problems(line, ["Settings"])),
                        "a substring inside another word is not a match")

    def test_overrun_is_caught(self):
        long_line = " ".join(["word"] * 40)
        self.assertTrue(any("overrun" in p for p in self.problems(long_line)))

    def test_short_line_is_caught(self):
        self.assertTrue(any("short" in p for p in self.problems("Click save.")))

    def test_empty_script_is_caught(self):
        self.assertTrue(self.problems(""))

    def test_em_dash_is_caught(self):
        line = ("Open Settings " + chr(0x2014) + " then choose Integrations "
                "and wait for the page to load.")
        self.assertTrue(any("dash" in p for p in self.problems(line)))

    def test_markup_is_caught(self):
        line = ("- Open Settings, then choose Integrations and wait for the "
                "page to finish loading here.")
        self.assertTrue(any("markup" in p for p in self.problems(line)))


class TestCaptions(unittest.TestCase):

    def test_words_fill_exactly_the_narration(self):
        timed = captions.word_times_proportional("one two three four".split(), 5.0, 4.0)
        self.assertAlmostEqual(timed[0][1], 5.0, delta=TOL)
        self.assertAlmostEqual(timed[-1][2], 9.0, delta=TOL,
                               msg="words must not run past the narration")

    def test_cues_stay_within_two_lines(self):
        text = ("Open Settings from the left menu and then choose Integrations "
                "before you add any new connection to this account today.")
        timed = captions.word_times_proportional(text.split(), 0.0, 12.0)
        for start, end, body in captions.cues_for_beat(timed, 74, 6.0, 1.0):
            wrapped = captions.wrap(body, 38)
            self.assertLessEqual(len(wrapped.split("\n")), 2,
                                 "a cue spilled past two lines: %r" % body)
            for line in wrapped.split("\n"):
                self.assertLessEqual(len(line), 42,
                                     "a caption line is too wide: %r" % line)

    def test_cues_do_not_overlap_and_move_forward(self):
        text = " ".join("word%d" % i for i in range(60))
        timed = captions.word_times_proportional(text.split(), 0.0, 30.0)
        cues = captions.cues_for_beat(timed, 74, 6.0, 1.0)
        for a, b in zip(cues, cues[1:]):
            self.assertLessEqual(a[0], a[1], "a cue ends before it starts")
            self.assertLessEqual(a[1], b[1] + TOL)

    def test_every_word_survives(self):
        text = ("Open Settings then choose Integrations and add the connection "
                "you need for this client before moving on to the next step.")
        timed = captions.word_times_proportional(text.split(), 0.0, 14.0)
        joined = " ".join(c[2] for c in captions.cues_for_beat(timed, 74, 6.0, 1.0))
        self.assertEqual(joined.split(), text.split(),
                         "captions must not drop or reorder a single word")

    def test_timestamp_formats(self):
        self.assertEqual(captions.fmt_vtt(3671.5), "01:01:11.500")
        self.assertEqual(captions.fmt_srt(3671.5), "01:01:11,500")


class TestRegistry(unittest.TestCase):

    def test_slugify(self):
        self.assertEqual(registry.slugify("Calendars & Booking"), "calendars-booking")
        self.assertEqual(registry.slugify("Pipelines 101"), "pipelines-101")
        self.assertEqual(registry.slugify("  Spaced  Out  "), "spaced-out")

    def test_statuses_only_move_forward(self):
        self.assertLess(registry.ORDER.index("written"),
                        registry.ORDER.index("reviewed"))
        self.assertLess(registry.ORDER.index("reviewed"),
                        registry.ORDER.index("rendered"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
