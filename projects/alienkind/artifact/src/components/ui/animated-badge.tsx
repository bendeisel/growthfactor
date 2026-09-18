import { ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { useId } from "react";

type AnimatedBadgeProps = {
  text?: string;
  color?: string;
  href?: string;
  /* The trace light rides in from above the badge, so it needs clear space
     overhead. In a tight slot it reads as a stray mark instead, and this turns
     it off without touching the ping or the chevron. */
  trace?: boolean;
};

function hexToRgba(hexColor: string, alpha: number): string {
  const hex = hexColor.replace("#", "");
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hexColor;
}

const TRACE =
  "M 69 49.8 h -30 q -3 0 -3 -3 v -13 q 0 -3 -3 -3 h -23 q -3 0 -3 -3 v -13 q 0 -3 -3 -3 h -30";

export const AnimatedBadge = ({
  text = "Standing by",
  color = "#e8751f",
  href,
  trace = true,
}: AnimatedBadgeProps) => {
  /* One badge can appear more than once on a page, and a duplicated mask id
     makes every copy after the first render empty. */
  const uid = useId().replace(/:/g, "");
  const maskId = `ml-mask-${uid}`;
  const gradId = `ml-grad-${uid}`;

  const content = (
    <motion.div
      initial={false}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
      viewport={{ once: true }}
      className="group relative flex max-w-fit items-center justify-center gap-3 rounded-full border border-line bg-raised px-4 py-1.5 text-[color:var(--ink-2)] transition-colors"
    >
      {trace && (
        <div className="pointer-events-none absolute inset-x-0 bottom-full h-20 w-[165px]">
          <svg className="h-full w-full" width="100%" height="100%" viewBox="0 0 50 50" fill="none">
            <g mask={`url(#${maskId})`}>
              <circle
                className="ml-light"
                cx="0"
                cy="0"
                r="20"
                fill={`url(#${gradId})`}
                style={{ offsetPath: `path("${TRACE}")` }}
              />
            </g>
            <defs>
              <mask id={maskId}>
                <path d={TRACE} strokeWidth="0.6" stroke="white" />
              </mask>
              <radialGradient id={gradId} fx="1">
                <stop offset="0%" stopColor={color} />
                <stop offset="20%" stopColor={color} />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      )}

      <div
        className="relative flex h-1 w-1 items-center justify-center rounded-full"
        style={{ backgroundColor: hexToRgba(color, 0.4) }}
      >
        <div
          className="flex h-2 w-2 animate-ping items-center justify-center rounded-full"
          style={{ backgroundColor: color }}
        />
        <div
          className="absolute left-1/2 top-1/2 flex h-1 w-1 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full"
          style={{ backgroundColor: hexToRgba(color, 0.8) }}
        />
      </div>

      <div className="mx-2 h-4 w-px bg-line" />
      <span className="bg-clip-text text-xs font-medium">{text}</span>
      <ChevronRight className="ml-1 h-3.5 w-3.5 text-[color:var(--ink-3)] transition-transform duration-200 group-hover:translate-x-0.5" />
    </motion.div>
  );

  return href ? (
    <a href={href} className="inline-block">
      {content}
    </a>
  ) : (
    content
  );
};
