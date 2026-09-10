# 13.4 Making it not look generated

**Module:** 13 Website
**Video:** ~11 min
**Needs first:** 13.3
**You finish with:** a site a stranger would not guess was AI built

## Why this matters

This is the lesson that decides whether the module was worth doing.

**The one test: would a stranger guess this was generated?** If yes, nothing
else you did counts. Not the page structure, not the SEO, not the copy.

AI builders produce the same site every time unless you stop them. Once you
know the tells, you cannot unsee them, and neither can your visitors.

This is the same standard we build client sites to.

## The tells, and the fixes

Go through your site and look for each of these.

### 1. A uniform grid of soft rounded cards with thin outlines

**The single biggest tell.** Identical rectangles, evenly spaced, each with a
hairline border, a title and two lines of grey text. It reads as a component
library, not a gym.

**Fix:** break the grid. Make one card larger than the others. Use photos as
the card backgrounds instead of outlines. Vary the heights. Or drop the cards
entirely and use full width bands with alternating image sides.

[SHOT 13.4-01]

### 2. Rounding everything

Most brands have a radius rule already. Rounding every panel erases the one
bit of geometric personality the brand owned.

**Fix:** square panels. Rounded corners on buttons only.

### 3. Even spacing everywhere

Every section the same height, same rhythm, no hierarchy.

**Fix:** vary it deliberately. A tall cinematic section, then a tight one,
then a wide one. Sections are punctuation, and a page of identical sections
reads as a page with no sentences.

### 4. Centred hero, centred subhead, centred button pair, over a faded photo

The most recognisable generated layout there is.

**Fix:** go asymmetric. Photo on one half, text left aligned on the other.
Or a full bleed photo with the headline sitting low left. Anything but
centre-stacked over 40% opacity.

### 5. Three column icon, heading, paragraph grids

**Fix:** delete them. Whatever they said can be said in a band with a real
photo.

### 6. Decorative statistics

"500+ members. 15 years. 98% satisfaction." Round numbers nobody can source.

**Fix:** delete them, or replace with something true and specific. "Eleven
classes a week" is worth more than "500+ happy members", because it is
checkable and it is actually useful.

### 7. Everything on one page

Covered in 13.3. Real pages.

## What to aim for instead

### Dark and cinematic

Near-black grounds. One accent colour, used sparingly. Not clean and airy,
not white with light grey cards.

Gyms sell intensity. The site should feel like the room.

### Photography doing the work

Your photos are the design. Use them large.

A framed treatment reads more considered than edge to edge: the photo inset
inside a panel with a slightly lighter black around it. Try it, it is a small
change that lifts the whole page.

**Real photos of real members.** This is the single biggest advantage you have
over a template, and over most of your competitors, who use stock.

[SHOT 13.4-02]

### Big type

Bigger than the AI will give you. At every level.

Body copy at 15px will look thin and cheap on a dark ground. **17 to 19px**
reads right. Headlines large and confident.

When in doubt, go bigger.

### Confident copy

Gyms sell transformation and toughness. Timid copy undersells.

"Five stars, repeatedly" is better than "Our members love us". Cocky is fine.
Apologetic is not.

### Something quietly moving

A visitor should do a double-take, not get a light show. A slow drift on a
hero image, a subtle shimmer on the accent colour. Quiet.

**If you add motion, it must be JavaScript, not CSS animation.** CSS
animations get paused by browsers in low power mode, which means your moving
element sits frozen on some visitors' screens while looking fine on yours.

Ask AI Studio explicitly:

> `Drive any animation with requestAnimationFrame and transforms, not CSS
> animation or CSS transitions on a loop.`

This is worth being fussy about because you will never see the failure on your
own machine.

### No dead air inside components

If a panel is tall because its neighbour is tall, make its content fill it
rather than float in the middle. Wasted space inside a card reads as
unfinished.

## The claims rules

Two things that are not design decisions.

**Never invent facts about real people.** A coach's rank, record or
credential goes on the site only if it is true. Ask them.

**Never advertise a rating you do not have.** A five star row on your site
when you are at 4.6 is a false claim. If you are not at 5.0, do not show
stars, show the number or show a real review.

## The two tests before you publish

1. **Would a stranger guess this was generated?**
2. **Does it look like every other gym site in my city?**

Open your site next to the two best gym sites near you. If yours is the one
that looks like a template, go back to the tells list.

[SHOT 13.4-03]

## Checklist

- [ ] No uniform grid of rounded outlined cards
- [ ] Square panels, rounded buttons only
- [ ] Section heights and rhythms vary
- [ ] Hero is not centre-stacked over a faded photo
- [ ] No three column icon grids
- [ ] No invented statistics
- [ ] Dark grounds, one accent used sparingly
- [ ] Real photos, large, framed
- [ ] Body text 17 to 19px
- [ ] Copy is confident, not apologetic
- [ ] Any motion is JavaScript driven
- [ ] No dead space inside panels
- [ ] No invented credentials
- [ ] No star rating I have not earned
- [ ] Ran both tests

## When it goes wrong

**It still looks generic and I cannot say why.** Screenshot it and send it to
us. We will name the tell in one message. This is genuinely hard to see in
your own work.

**AI Studio keeps putting the cards back.** Be blunt and repeat it every time
you ask for a change. Generated defaults are persistent.

**My photos look bad on a dark background.** Usually they are underexposed.
Brighten them slightly, or use the framed treatment which gives them a border
to sit against.

## Shot list

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|
| 13.4-01 | A generated rounded card grid, then the same content rebuilt | Before and after | The difference | Nothing |
| 13.4-02 | A framed photo treatment on a dark ground | The section | The lighter surround | Faces without release |
| 13.4-03 | Three gym sites side by side, one obviously templated | Comparison | Nothing | Gym names |
| 13.4-04 | Body text at 15px and 18px on a dark ground | Comparison | The readability difference | Nothing |

## Video script

**Hook.** One test. Would a stranger guess this was made by AI? If the answer
is yes, nothing else you did on this site counts.

**Beats.**
1. On screen: a generated gym site, unedited. Point at each tell in turn as it
   appears. Do not rush, teaching people to see this is the whole lesson.
2. On screen: fix the biggest one live. Rounded card grid becomes full width
   bands with real photos. Before and after.
3. On screen: talk to camera. Dark and cinematic. Photography does the work.
   Big type. Show 15px next to 18px on black.
4. On screen: the motion rule. Say plainly that CSS animation freezes on some
   machines and you will never see it on yours.
5. On screen: talk to camera, serious. Never invent a coach's credential.
   Never show stars you have not earned.
6. On screen: three sites side by side. Ask the two tests out loud.

**Go do.** Open your site next to the two best gym sites in your city. Find
three tells from the list and fix them.

## Verify on screen

- Nothing platform-specific.
