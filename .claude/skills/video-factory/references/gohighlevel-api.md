# GoHighLevel, the parts this pipeline uses

Base URL `https://services.leadconnectorhq.com`. Every call takes
`Authorization: Bearer <token>` and `Version: 2021-07-28`. The Version header
is not optional and a missing one fails in a way that does not mention it.

Shapes below were read from HighLevel's published OpenAPI specs in the
`GoHighLevel/highlevel-api-docs` repository, not from memory. Their hosted
docs at `marketplace.gohighlevel.com/docs` are the readable version of the
same thing.

## The token

A **Private Integration token from the sub-account**, not the agency. The
course lands in a location, so the token has to belong to that location.
Scopes needed: `medias.write` and `courses.write`.

`publish.py probe` checks the token against the location before anything is
uploaded. Run it first; a 401 forty videos into a batch is an expensive way
to find out.

## Media upload

```
POST /medias/upload-file
multipart/form-data
  file      the bytes             (required unless hosted)
  hosted    "true"                (optional)
  fileUrl   public URL            (required when hosted is true)
  name      display name          (optional)
  parentId  media folder id       (optional)

-> {"fileId": "...", "url": "https://..."}
```

Size: the spec text says 25 MB, and their documentation carves out 500 MB for
video. A ten minute 1080p build lands in the low hundreds of megabytes, so it
fits, but not by a huge margin. If a video is close to the limit, either
raise `GF_OUT_CRF` a little or use the hosted path.

**The hosted path is usually better for video.** `--hosted <url>` sends a
small request and HighLevel fetches the file itself, which is faster and far
less likely to time out than pushing hundreds of megabytes from a laptop. The
URL has to be publicly reachable. Growth Factor's own preview host already
serves files that way.

## Course import

```
POST /courses/courses-exporter/public/import

{
  "locationId": "...",
  "userId": "...",                       optional
  "products": [{
    "title": "...",
    "description": "...",
    "imageUrl": "...",                   optional
    "instructorDetails": {"name": "...", "description": "..."},   optional
    "categories": [{
      "title": "...",
      "visibility": "published" | "draft",
      "thumbnailUrl": "...",             optional
      "posts": [{
        "title": "...",
        "visibility": "published" | "draft",
        "contentType": "video" | "assignment" | "quiz",
        "description": "...",
        "thumbnailUrl": "...",           optional
        "bucketVideoUrl": "...",         optional
        "postMaterials": [{"title", "type", "url"}]               optional
      }]
    }]
  }]
}

-> 201
```

One product, one category per module, one post per video. `bucketVideoUrl` is
the `url` the media upload returned.

Optional fields are **omitted** rather than sent as null. A null
`thumbnailUrl` is not the same as no key, and the schema treats it that way.

## Things worth knowing before relying on this

- **The Courses API is thin.** Import is well specified; a lot of the rest of
  the course surface is either missing from the public docs or missing
  entirely. There is no update-a-lesson endpoint worth building on, so treat
  the import as create-only and fix mistakes in the GHL interface.
- **Import twice and you get two courses.** There is no idempotency key.
  `publish.py course` is therefore something you run once per course, which
  is why it defaults to a dry run.
- **Import as draft, then look.** `--visibility published` exists but the
  default is `draft` for a reason: the first import of a forty video course
  is exactly when you want to check the module order before students see it.
