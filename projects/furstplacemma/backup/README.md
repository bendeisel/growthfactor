# Drop the Furst Place backups here

Put these three files in this folder and push. Nothing else is needed.

| File | Size | Why |
| --- | --- | --- |
| `backup_...Furst_Place_MMA_...-db.gz` | 354 KB | all page copy, image filenames, redirect map |
| `backup_...Furst_Place_MMA_...-uploads.zip` | 6.8 MB | the photographs |
| `backup_...Furst_Place_MMA_...-themes.zip` | 14 MB | CSS — the brand kernel |

Skip `-plugins.zip` (41 MB) and `-others.zip`. They are WordPress machinery and
contain nothing we are keeping.

Total ~21 MB, well inside GitHub's 100 MB per-file limit.

```bash
git checkout claude/furstplacemma-site-rebuild-9vzjfb
cp ~/Downloads/backup_*Furst_Place_MMA*-{db.gz,uploads.zip,themes.zip} \
   projects/furstplacemma/backup/
git add projects/furstplacemma/backup
git commit -m "Add Furst Place MMA site backup for kernel extraction"
git push -u origin claude/furstplacemma-site-rebuild-9vzjfb
```

These are extraction inputs, not build artifacts. Once the kernel is extracted and
the photos are moved into `src/`, this folder can be cleared from the repo.
