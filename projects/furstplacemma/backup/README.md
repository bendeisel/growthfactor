# Drop the Furst Place backups here

Three files. Skip `-plugins.zip` (41 MB) and `-others.zip` — WordPress machinery,
nothing we are keeping.

| File | Size | Why |
| --- | --- | --- |
| `backup_...Furst_Place_MMA_...-db.gz` | 354 KB | all page copy, image filenames, redirect map |
| `backup_...Furst_Place_MMA_...-uploads.zip` | 6.8 MB | the photographs |
| `backup_...Furst_Place_MMA_...-themes.zip` | 14 MB | CSS — the brand kernel |

~21 MB total. Every file is under GitHub's 25 MB browser-upload limit and well
under the 100 MB repo limit.

## Easiest: drag and drop in the browser, no command line

1. Open <https://github.com/bendeisel/growthfactor/tree/claude/furstplacemma-site-rebuild-9vzjfb/projects/furstplacemma/backup>
2. **Add file → Upload files**
3. Drag the three files in, then **Commit changes** (commit straight to the
   `claude/furstplacemma-site-rebuild-9vzjfb` branch).

## Or from a terminal

```bash
git checkout claude/furstplacemma-site-rebuild-9vzjfb
cp ~/Downloads/backup_*Furst_Place_MMA*-{db.gz,uploads.zip,themes.zip} \
   projects/furstplacemma/backup/
git add projects/furstplacemma/backup
git commit -m "Add Furst Place MMA site backup for kernel extraction"
git push -u origin claude/furstplacemma-site-rebuild-9vzjfb
```

## Why not Drive, Dropbox, or the live site

All three were tested in-session and all three fail, for different reasons:

- **`furstplacemma.com`** — blocked outright by the organization egress policy.
  The live site cannot be scraped for photos or copy.
- **Google Drive** — the connector returns file bytes as base64 *inline in the
  tool result*, not to disk. The 6.8 MB uploads zip becomes ~9 MB of text that
  would then have to be retyped to land on disk. `drive.google.com` is separately
  blocked at the proxy, so there is no direct download either. Drive remains the
  right tool for *finding* the files and for reading Docs — just not for moving
  binaries.
- **Dropbox** — blocked at the proxy.
- **GitHub web/release downloads** (`codeload`, comment attachments) — 403.

**Git protocol over HTTPS to github.com is allowed and proven** — the branch
pushed from this session. That is why the repo is the drop point: files committed
here arrive on disk directly, at zero context cost.

These are extraction inputs, not build artifacts. Once the kernel is extracted and
the photos are moved into `src/`, this folder can be cleared from the repo.
