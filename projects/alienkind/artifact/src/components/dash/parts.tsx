import { kindColour, type Dir, type Kind, type Tile } from "./data";

export const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-3)]">{children}</span>
);

const dirColour: Record<Dir, string> = {
  up: "var(--good)", down: "var(--bad)", warn: "var(--warn)", flat: "var(--ink-3)",
};
const dirMark: Record<Dir, string> = { up: "▲", down: "▼", warn: "●", flat: "·" };

export function StatTile({ tile }: { tile: Tile }) {
  return (
    <div className="rounded-xl border border-line-soft bg-panel px-4 py-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="grid h-6.5 w-6.5 place-items-center rounded-lg px-1.5 py-1 font-mono text-[11px] font-bold"
              style={{ background: "var(--wash)", color: "var(--orange)" }}>
          {tile.name[0]}
        </span>
        <span className="font-mono text-[11px]" style={{ color: dirColour[tile.dir] }}>{dirMark[tile.dir]}</span>
      </div>
      <div className="text-[12.5px] text-[color:var(--ink-3)]">{tile.name}</div>
      <div className="num my-0.5 text-[25px] font-bold tracking-tight">{tile.value}</div>
      <div className="num text-[11.5px]" style={{ color: dirColour[tile.dir] }}>{tile.delta}</div>
    </div>
  );
}

export function Card({ title, note, children }: { title?: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line-soft bg-panel px-4 py-3.5">
      {(title || note) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <b className="text-sm font-semibold">{title}</b>}
          {note && <Label>{note}</Label>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Meter({ name, label, pct, colour }: { name: string; label: string; pct: number; colour: string }) {
  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <b className="text-[12.5px] font-medium">{name}</b>
        <span className="num text-[11.5px]" style={{ color: colour }}>{label}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-raised">
        <i className="block h-full rounded-full" style={{ width: `${pct}%`, background: colour }} />
      </div>
    </div>
  );
}

export function Row({ dot, title, sub, right, badge }: {
  dot?: Kind | string | null; title: string; sub?: string; right?: string; badge?: string;
}) {
  const colour = typeof dot === "string" && dot.startsWith("var(") ? dot : kindColour((dot as Kind) ?? null);
  return (
    <div className="flex gap-2.5 border-b border-line-soft py-2.5 last:border-b-0">
      <span className="mt-1.5 h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: colour }} />
      <span className="min-w-0 flex-1">
        <b className="block text-[13.5px] font-semibold">{title}</b>
        {sub && <span className="block truncate text-[12.5px] text-[color:var(--ink-3)]">{sub}</span>}
      </span>
      {badge && (
        <span className="self-center whitespace-nowrap rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--ink-3)]">
          {badge}
        </span>
      )}
      {right && <span className="num whitespace-nowrap text-[10.5px] text-[color:var(--ink-3)]">{right}</span>}
    </div>
  );
}

export function PaceChart({ rows }: { rows: { name: string; pct: number; kind: Kind }[] }) {
  return (
    <>
      <div className="grid grid-cols-4 items-end gap-3.5">
        {rows.map((r) => (
          <div key={r.name} className="text-center">
            <div className="num mb-1.5 text-[12.5px] font-bold" style={{ color: kindColour(r.kind) }}>
              {r.pct > 0 ? "+" : ""}{r.pct}%
            </div>
            <div className="relative h-[124px] overflow-hidden rounded bg-raised">
              <div className="absolute inset-x-0 bottom-0 rounded"
                   style={{ height: `${Math.max(10, Math.min(100, 55 + r.pct))}%`, background: kindColour(r.kind) }} />
              <div className="absolute inset-x-0 border-t border-dashed" style={{ bottom: "55%", borderColor: "var(--ink-3)" }} />
            </div>
            <div className="mt-1.5 text-xs text-[color:var(--ink-3)]">{r.name}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3.5 text-[11.5px] text-[color:var(--ink-3)]">
        {([["Ahead of pace", "good"], ["Slightly behind", "warn"], ["Behind, or moving the wrong way", "bad"]] as const).map(
          ([text, k]) => (
            <span key={text} className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-sm" style={{ background: kindColour(k) }} />
              {text}
            </span>
          )
        )}
        <span>dashed line = last month&apos;s pace</span>
      </div>
    </>
  );
}
