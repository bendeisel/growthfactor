"use client";

/* The obsidian, rolling.
 *
 * The rings are ellipses inside one SVG rather than three divs each carrying a
 * 3D rotateX. The div version painted a white plane outline around every ring
 * box in Chromium, and an ellipse gives the same tilted-orbit read with nothing
 * to go wrong: a flatter ry is a steeper tilt, and spinning it around the
 * centre is the roll. */
const RINGS = [
  { rx: 88, ry: 30, tilt: -12, dur: "9s", width: 1, opacity: 0.55, dash: "4 10" },
  { rx: 66, ry: 58, tilt: 24, dur: "14s", width: 1.5, opacity: 0.4, dash: undefined, reverse: true },
  { rx: 94, ry: 18, tilt: 16, dur: "22s", width: 1, opacity: 0.3, dash: "2 14" },
];

export function Orb({ working }: { working: boolean }) {
  return (
    <div
      className="core relative h-[200px] shrink-0 border-b border-line-soft"
      data-state={working ? "working" : "idle"}
    >
      <div className="absolute inset-0 grid place-items-center">
        <span className="orb-glow absolute left-1/2 top-1/2 -ml-[88px] -mt-[88px] h-[176px] w-[176px] rounded-full" />

        <svg viewBox="0 0 200 200" className="absolute h-[196px] w-[196px]" aria-hidden>
          {RINGS.map((r, i) => (
            <ellipse
              key={i}
              className={`ak-ring${r.reverse ? " ak-ring-rev" : ""}`}
              cx="100"
              cy="100"
              rx={r.rx}
              ry={r.ry}
              fill="none"
              stroke="var(--hue)"
              strokeWidth={r.width}
              strokeOpacity={r.opacity}
              strokeDasharray={r.dash}
              style={{ ["--tilt" as string]: `${r.tilt}deg`, ["--dur" as string]: r.dur }}
            />
          ))}
        </svg>

        <span className="orb absolute left-1/2 top-1/2 -ml-[29px] -mt-[29px] h-[58px] w-[58px] rounded-full" />
      </div>
    </div>
  );
}
