/**
 * Render a house-style design artboard to a portfolio screenshot.
 *
 *   node scripts/shot-artboard.mjs ../projects/nashvillemma/design/Homepage.dc.html work-nashvillemma
 *
 * The artboards are authored for the Claude Design canvas, which supplies a
 * runtime this script does not: asset paths resolve flat rather than into
 * img/, and the lead-capture popup opens with nothing to close it. Both are
 * corrected in-page before the shot.
 */
import { chromium } from "playwright"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const [input, name = "artboard"] = process.argv.slice(2)
if (!input) {
  console.error("usage: node scripts/shot-artboard.mjs <artboard.dc.html> [output-name]")
  process.exit(1)
}

const browser = await chromium.launch({
  // Use the preinstalled browser when one is present (CI images, sandboxes).
  ...(process.env.PLAYWRIGHT_BROWSERS_PATH ? { executablePath: "/opt/pw-browsers/chromium" } : {}),
})
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
})

await page.goto(pathToFileURL(resolve(input)).href, { waitUntil: "load" })
await page.waitForTimeout(1000)

await page.evaluate(() => {
  const norm = (s) => "img/" + s.replace(/^\.\//, "").replace(/^img\//, "")
  const isExternal = (s) => /^(https?:|data:)/.test(s)

  document.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src")
    if (src && !isExternal(src) && !src.startsWith("img/")) img.setAttribute("src", norm(src))
  })

  document.querySelectorAll("*").forEach((el) => {
    const bg = el.style?.backgroundImage
    if (bg?.includes("url(")) {
      const m = bg.match(/url\(["']?([^"')]+)["']?\)/)
      if (m && !isExternal(m[1]) && !m[1].startsWith("img/")) {
        el.style.backgroundImage = `url("${norm(m[1])}")`
      }
    }
    const s = getComputedStyle(el)
    const tall = el.getBoundingClientRect().height > 300
    if ((s.position === "fixed" || s.position === "absolute") && parseInt(s.zIndex || "0") >= 80 && tall) {
      el.style.display = "none"
    }
  })
})

await page
  .waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 15000 })
  .catch(() => console.warn("warning: some images did not finish loading"))
await page.waitForTimeout(1000)

const broken = await page.evaluate(() =>
  [...document.images].filter((i) => i.naturalWidth === 0).map((i) => i.getAttribute("src"))
)
if (broken.length) console.warn(`warning: ${broken.length} image(s) failed:`, broken.slice(0, 5))

const out = `public/${name}.jpg`
await page.screenshot({ path: out, type: "jpeg", quality: 88, clip: { x: 0, y: 0, width: 1440, height: 900 } })
console.log(`wrote ${out}`)
await browser.close()
