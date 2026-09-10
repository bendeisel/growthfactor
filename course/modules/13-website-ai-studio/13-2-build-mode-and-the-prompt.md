# 13.2 Build mode and the prompt

**Module:** 13 Website
**Video:** ~10 min
**Needs first:** 13.1
**You finish with:** a first version of your site generated

## Why this matters

Google AI Studio's Build mode generates a working web app from a description.
It is free to start, it runs in the browser, and it will produce a site in
minutes.

The quality of what comes out is decided almost entirely by what you type in.
A vague prompt produces the generic site that 13.4 exists to prevent.

## Before you start, gather this

Do not open AI Studio until you have these. The prompt needs them and going
back to add them later means regenerating.

- **Your photos.** 15 to 30 real photos of your gym, your classes, your
  members and your coaches. Phone photos are fine. Real matters more than
  sharp.
- **Your colours.** The exact hex codes from your logo. Not "sort of red",
  the actual codes. If you do not know them, open your logo in any image tool
  and use the colour picker.
- **Your typefaces**, if your brand has them.
- **Your class schedule**, complete.
- **Your programme list**, with a description of each.
- **Your coaches**, with real credentials you can point at.
- **Your copy**, if you have any you like.

The photos and the colours are the two that decide whether it looks like your
gym or like a template.

## Steps

1. Open Google AI Studio and go to **Build**.

   [SHOT 13.2-01]

2. Type your prompt. Use the structure below.

3. It generates the codebase: a front end, and the wiring between the parts.

   [SHOT 13.2-02]

4. Refine through the chat panel. Ask for changes in plain language.

5. Iterate until it is close, then move to 13.3 and 13.4.

## The prompt

Do not type "build me a gym website". Use this structure and fill in your
details.

```
Build a multi-page website for [GYM NAME], a [TYPE] gym in [CITY].

PAGES, each a real separate page, not sections of one long scrolling page:
Home, Programs (with a separate page per program), Schedule, Coaches,
Pricing, About, Contact.

LOOK AND FEEL:
Dark and cinematic. Near-black backgrounds, not white, not light grey.
One accent colour: [YOUR HEX]. Use it sparingly, for emphasis only.
Photography carries the design. Large images, framed inside panels with a
slightly lighter dark surround, not edge to edge bleed.
Big type. Headlines large and confident. Body text 17 to 19px, never smaller.
Square panels. Rounded corners on buttons only, nothing else.
Asymmetric layouts. Vary section heights and rhythm. Do not make every
section the same height.

DO NOT:
Do not use a uniform grid of rounded cards with thin outlines.
Do not use three column icon-plus-heading-plus-paragraph blocks.
Do not centre the hero headline, subhead and buttons over a faded photo.
Do not invent statistics.
Do not put everything on one long scrolling page.
Do not use stock photography placeholders, leave image slots for my photos.

CONTENT:
[PASTE YOUR PROGRAM LIST, SCHEDULE, COACH LIST]

The class schedule must be stored in a single data file, and every page that
shows class times must read from that one file.

Every page needs a clear enquiry action.
```

[SHOT 13.2-03]

## Why the prompt is shaped like that

Two halves, and the second half matters more.

The **do not** list is not decoration. Left to itself, an AI builder produces
the same site every time: rounded card grid, three column features, centred
hero, even spacing. Every tell in that list is something a stranger recognises
as generated. See 13.4.

The **single schedule data file** instruction saves you real pain. Without it
your class times get duplicated into every programme page, and changing the
Tuesday boxing time means editing it in five places and missing two.

## Refining

Use the chat panel. Be specific, the same way you would be with an agent
prompt in 09.9.

Bad: `make it look better`

Good: `Make the hero image full bleed on the left half and put the headline
on the right, left aligned, not centred. Increase the headline to about 64px
on desktop.`

## What it will get wrong first time

Expect all of these, they are normal:

- Placeholder text that reads like marketing filler
- Some rounded cards despite the instruction
- Body text too small
- Everything a bit too evenly spaced
- Stock-looking image placeholders

Fix them in 13.4. Do not keep regenerating from scratch hoping for a better
roll.

## Checklist

- [ ] Photos, hex codes, schedule, programmes and coaches gathered first
- [ ] Used the full prompt structure, including the do-not list
- [ ] Included the single schedule data file instruction
- [ ] Got a first version generated
- [ ] Refined with specific instructions, not "make it better"

## When it goes wrong

**It built one long page.** The instruction was not explicit enough. Ask
directly: `Split this into separate pages with real navigation between them.`

**It ignored the accent colour.** Give the hex again and say where to use it.

**It keeps producing rounded cards.** Say it again, specifically:
`Remove all border radius from panels and cards. Square corners. Rounded
corners only on buttons.`

**It looks nothing like a gym.** Your photos are not in yet. Judge it after
13.4, not now.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 13.2-01 | Google AI Studio, Build mode | The interface | The prompt box | Nothing |
| 13.2-02 | Generation in progress | The build | The generated structure | Nothing |
| 13.2-03 | The full prompt typed out | The prompt | The do-not list | Nothing |
| 13.2-04 | First generated result | The site | Nothing | Nothing |

## Video script

**Hook.** You can generate a working gym website in about ten minutes. What
decides whether it is any good is entirely what you type into one box.

**Beats.**
1. On screen: talk to camera. Gather the seven things first. Hold up a phone
   with photos on it.
2. On screen: AI Studio, Build mode.
3. On screen: type the prompt. Read the do-not list out loud, slowly. Explain
   that without it you get the same site as everybody else.
4. On screen: it generates. Let it run.
5. On screen: refine. Type "make it look better", show the weak result. Then
   type the specific version. Same lesson as 09.9.
6. On screen: talk to camera. The five things it always gets wrong. Set the
   expectation so they do not regenerate in frustration.

**Go do.** Gather your photos and your hex codes before you open AI Studio.
Then run the full prompt.

## Verify on screen

- Current Build mode interface and where the chat panel sits.
- Whether Build mode still generates multi-page structures.
- Current free tier limits.
