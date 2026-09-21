# HeyGen, the parts that matter here

Base URL `https://api.heygen.com`. Auth is the header `X-Api-Key`, not a
bearer token. The key is per account, not per avatar.

## Endpoints used

| Call | Endpoint |
|---|---|
| List avatars | `GET /v2/avatars` |
| List voices | `GET /v2/voices` |
| Start a render | `POST /v2/video/generate` |
| Poll a render | `GET /v1/video_status.get?video_id=<id>` |

Note the version mismatch on the status call. It is `v1` while generate is
`v2`. That is HeyGen's, not a typo here.

## Generate

```json
{
  "video_inputs": [{
    "character": {"type": "avatar", "avatar_id": "...", "avatar_style": "normal"},
    "voice": {"type": "text", "input_text": "...", "voice_id": "...", "speed": 1.0},
    "background": {"type": "color", "value": "#101114"}
  }],
  "dimension": {"width": 720, "height": 720}
}
```

Returns `{"error": null, "data": {"video_id": "..."}}`. A non-null `error` can
arrive with a 200, so check the body, not just the status code.

## Poll

`data.status` moves through `pending`, `processing`, then `completed` or
`failed`. On completion `data.video_url` holds the download.

**That URL expires.** Download it in the same run, which is what `heygen.py`
does, rather than storing the URL and fetching later.

## Things that cost money or time

- **Renders are billed per generation, not per successful use.** A re-run that
  re-renders everything is a real bill, which is why finished renders are
  recorded in the manifest and skipped. Only `--force` re-renders.
- **Concurrency is plan dependent.** `GF_HEYGEN_CONCURRENCY` defaults to 2.
  Raising it past the plan limit does not go faster, it queues or errors.
- **A talking-photo avatar and a studio avatar have different id fields**
  (`talking_photo_id` vs `avatar_id`). `heygen.py avatars` lists both; whichever
  you pick goes in `GF_HEYGEN_AVATAR_ID`.

## Backgrounds and the alpha question

This pipeline renders the avatar on a flat colour and handles the cutout
locally, which works on every plan. If the account has transparent background
output (webm with real alpha), that is cleaner than chroma keying: the edges
around hair are where `colorkey` shows its limits.

To switch to it, have `submit()` request the transparent output, download the
webm, and set `GF_PIP_STYLE=cutout` with the `colorkey` filter removed from
`composite.py`. Everything downstream, the timing arithmetic included, is
unchanged.

Until then: in `disc` mode the background colour is what shows inside the
circle, so make it a brand colour. In `cutout` mode it is what gets keyed out,
so make it a colour that appears nowhere on the presenter or their clothing.

## Voice cloning

The cloned voice is created in the HeyGen UI, not the API. Once it exists it
is just another `voice_id` from `heygen.py voices`.

`GF_HEYGEN_VOICE_SPEED` changes how fast it speaks, which changes the words
per second the whole pipeline budgets against. Change one, re-measure the
other.
