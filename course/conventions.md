# Writing conventions

Applies to every lesson file in `modules/`.

## Voice

Short sentences. Say the thing, then say why it matters to a gym. No filler
intros, no "in today's lesson we will be exploring". Talk to an owner who is
tired, has 20 minutes, and has been sold software before.

Banned words: premier, elite, unleash, step into, start your journey, unlock,
game changer, revolutionise, supercharge, effortless, seamless.

**Never use an em dash.** Comma, period or colon instead.

## Lesson file shape

Every lesson uses this order. Skip a section only when it genuinely has no
content, and then delete the heading too.

```
# <nn.n> <Title>

**Module:** <nn> <Module name>
**Video:** ~<n> min
**Needs first:** <lesson refs, or "nothing">
**You finish with:** <one concrete thing that exists afterwards>

## Why this matters
## What you are building
## Steps
## <Asset section, where one exists: the prompt, the field list, the tags>
## Test it
## When it goes wrong
## Checklist
## Shot list
## Video script
## Verify on screen
```

## Steps

Numbered. One action per step. Name the exact control in bold, and the exact
value in backticks.

> 3. Open **Settings > Phone Numbers > LC Phone** and click the
>    **A2P Compliance** tab.
> 4. In **Legal Company Name**, type the business name exactly as it appears on
>    the EIN letter. Not the trading name. `Nashville MMA LLC`, not
>    `Nashville MMA`.

## Screenshot placeholders

Inline, on their own line, immediately after the step they illustrate:

```
[SHOT 01.2-03]
```

Numbering is `<lesson>-<sequence>`, sequence restarting at 01 per lesson.
Every placeholder must have a matching row in that lesson's shot list.

## Shot list format

| Shot | Screen | Capture | Highlight | Blur |
|------|--------|---------|-----------|------|

- **Screen** is the nav path, so the person capturing does not have to guess.
- **Highlight** is what Scribe boxes or arrows.
- **Blur** is anything account-specific: phone numbers, member names, revenue,
  API keys. Default to blurring rather than reshooting later.

## Video script format

Three parts, always.

- **Hook**, 10 to 15 seconds. The cost of not doing this thing.
- **Beats**, the steps in camera order, with what is on screen for each.
- **Go do**, one instruction they act on before the next lesson.

## Verify on screen

A short list of labels or behaviours in that lesson that were written from
documentation rather than from a live screen. Whoever runs the Scribe pass
confirms each one and corrects the lesson in the same sitting. Then delete the
section from that lesson.

## Cross references

By lesson number, never "the previous lesson", because lessons get reordered.
Write `see 02.3` and link the file.
