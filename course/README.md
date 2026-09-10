# Agents, Not Employees

The Growth Factor coaching course for gym and martial arts owners. Teaches an
owner to run their gym on HighLevel, and to edit the six agents we hand them.

## Where it lives

GoHighLevel, Memberships tab, in the Growth Factor agency.

- **Courses** carries the modules. One category per module, one lesson per file
  in `modules/`.
- **Community** carries the room: questions, wins, accountability, and the
  place we post platform changes when HighLevel ships something.
- Members are given a sub-account under the Growth Factor agency, with the six
  agents already installed via snapshot before they ever log in.

## Repo layout

```
course/
  README.md            this file
  module-map.md        the approved curriculum, 15 modules
  conventions.md       how every lesson is written, shot lists, placeholders
  ui-verify.md         every UI label that needs confirming on the first pass
  assets/              templates and prompts members and staff actually use
    tag-dictionary.md          the tags the agents listen for
    custom-fields.md           the field spec
    pipeline-spec.md           the gym pipeline
    kb-gym.md                  knowledge base template, general gym
    kb-martial-arts.md         knowledge base template, martial arts
    kb-intake-30-questions.md  the intake we send before an agent goes live
    agent-prompts/             the six agent prompts, paste-ready
  modules/<nn>-<slug>/
    README.md          module overview, order, outcome
    <nn>-<n>-<slug>.md one file per lesson, pastes straight into a GHL lesson
```

## How a lesson gets produced

1. The written lesson in `modules/` is the source of truth. It is written to
   stand alone, so a member who never watches a video can still do the thing.
2. The **shot list** at the bottom of each lesson tells whoever runs Scribe
   which screens to capture and what to highlight. One pass per module fills
   every `[SHOT nn.n-nn]` placeholder in it.
3. The **video script** at the bottom of each lesson is the same content
   restructured for camera. Record against it, do not improvise the steps.
4. The **checklist** is the printable one-pager for that lesson.

## Order of build

Modules 00 through 06 build the objects the agents need: tags, calendars,
pipelines, payments, workflows. Module 07 and 08 set up the AI and its
knowledge. Module 09 is the agents themselves. Modules 10 through 14 are what
you do once it runs.

Do not reorder. The agents fire off tags and forms that do not exist yet if a
member jumps to module 09 first, and that is the number one way this course
generates support tickets.

## Before publishing to members

Read `ui-verify.md`. HighLevel's help portal was blocked from the environment
this was written in, so button and menu labels came from search summaries and
secondary sources rather than the docs. Every label that needs eyes on a live
screen is listed there. Confirm them during the Scribe pass, since the Scribe
pass walks the same screens anyway.
