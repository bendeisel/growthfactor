import * as React from "react"
import { ArrowRight, Menu, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Growth Factor landing page.
 *
 * COPY IS PLACEHOLDER — swap it for the real thing. Everything below is
 * structure; the words are yours to write.
 */

const NAV_LINKS = [
  { href: "#work", label: "Work" },
  { href: "#process", label: "Process" },
  { href: "#contact", label: "Contact" },
] as const

function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-6 py-4">
        {/* Three columns so the links sit centred without absolute positioning. */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <a href="#top" className="text-xl font-semibold text-white justify-self-start">
            Growth&nbsp;Factor
          </a>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-white/60 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-2 justify-self-end md:flex">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
              Sign in
            </Button>
            <Button variant="default" size="sm">
              Start a project
            </Button>
          </div>

          <button
            type="button"
            className="justify-self-end text-white md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="animate-slide-down border-t border-white/10 bg-black/95 backdrop-blur-md md:hidden"
        >
          <div className="flex flex-col gap-4 px-6 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="py-2 text-sm text-white/60 transition-colors hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
                Sign in
              </Button>
              <Button variant="default" size="sm">
                Start a project
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function Hero({ className }: { className?: string }) {
  return (
    <section
      id="top"
      className={cn(
        "animate-fade-in-up relative flex min-h-screen flex-col items-center justify-start px-6 py-24 md:py-28",
        className
      )}
    >
      <p className="mb-8 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur-sm">
        <span className="text-center text-xs whitespace-nowrap text-neutral-400">
          Nashville MMA Training Camp is live
        </span>
        <a
          href="#work"
          className="flex items-center gap-1 text-xs whitespace-nowrap text-neutral-400 transition-all hover:text-white active:scale-95"
        >
          See the work
          <ArrowRight className="size-3" />
        </a>
      </p>

      <h1 className="mb-6 max-w-3xl bg-linear-to-b from-white via-white to-white/60 bg-clip-text px-6 text-center text-4xl leading-tight font-medium tracking-[-0.05em] text-balance text-transparent md:text-5xl lg:text-6xl">
        Give your big idea
        <br />
        the website it deserves
      </h1>

      <p className="mb-10 max-w-2xl px-6 text-center text-sm text-neutral-400 md:text-base">
        Custom static sites for local businesses. Fast by default, owned by you,
        and designed around your brand — never a template.
      </p>

      <div className="relative z-10 mb-16">
        <Button variant="gradient" size="lg" className="rounded-lg">
          Start a project
        </Button>
      </div>

      <div className="relative w-full max-w-5xl pb-20">
        {/* Glow, drawn in CSS rather than loaded as an image. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[30%] left-1/2 z-0 h-[75%] w-[115%] -translate-x-1/2 rounded-[50%] blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.55) 0%, rgba(168,186,255,0.32) 38%, rgba(120,140,220,0.12) 60%, transparent 76%)",
          }}
        />
        <div className="relative z-10 overflow-hidden rounded-lg border border-white/10 shadow-2xl">
          <img
            src="/work-nashvillemma.jpg"
            alt="Nashville MMA Training Camp homepage, built by Growth Factor"
            width={1440}
            height={900}
            className="h-auto w-full"
            loading="eager"
          />
        </div>
      </div>
    </section>
  )
}

export default function SaasTemplate() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navigation />
      <Hero />
    </main>
  )
}
