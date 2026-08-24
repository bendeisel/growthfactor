# Markets

Your targets, and how each one is expressed in config.

| Market | Counties | How it narrows |
|---|---|---|
| `davidson` | Davidson (47037) | whole county |
| `williamson` | Williamson (47187) | whole county |
| `old-hickory-waterfront` | Davidson, Sumner, Wilson, Trousdale, Smith | within 1000 ft of the lake |
| `pegram` | Cheatham (47021) | city match or within 5 miles of town |
| `kingston-springs` | Cheatham (47021) | city match or within 5 miles of town |
| `fairview` | Williamson (47187) | city match or within 6 miles of town |
| `spring-hill` | Williamson, Maury (47119) | city match or within 6 miles of town |
| `all` | all eight target counties | nothing, the full set |

```bash
npm run gf -- markets                          # list them
npm run gf -- markets old-hickory-waterfront   # show the notes for one
npm run gf -- leads --market pegram
npm run gf -- export --market spring-hill
```

## Why an area is a radius, not a city name

"The Pegram area" is not the same as the Pegram city limits. Most of what you would
call the Pegram area is unincorporated Cheatham County, and the assessor labels
those parcels with whatever mailing town applies, often Ashland City or Nashville.
Filtering on the city name alone would throw away most of the market.

So each area market ORs two tests together: the city name matches, or the parcel
sits within the radius of the town centre. Either one is enough, and both are ANDed
with the county list.

The coordinates in `config/markets.json` are approximate town centres. Widen or
tighten `radiusMiles` once you see what comes back. Five miles is a conservative
reading of "area"; ten will pull in a lot more.

## Spring Hill straddles a county line

Spring Hill sits on the Williamson and Maury boundary, so the market lists both
counties and lets the radius keep the set tight. Two parcel pulls feed it:
`tn-parcels-williamson` covers the north side, `tn-parcels-spring-hill` covers the
Maury side.

## Old Hickory Lake, on the water

This is the one market that cannot be expressed with county and city fields,
because waterfront is not an attribute any assessor publishes. It has to be
computed from geometry.

Every parcel already carries a coordinate, derived from the parcel polygon during
ingest. The missing input is the shoreline, which is fetched once from USGS NHD and
cached. After that, distance to water is a local calculation that costs nothing and
can be re-run whenever you like.

```bash
# once, to cache the shoreline
npm run gf -- waterbody:fetch old-hickory-lake

# after any parcel pull, to measure distances
npm run gf -- geo --waterbody old-hickory-lake

# then work the list
npm run gf -- leads --market old-hickory-waterfront
npm run gf -- leads --sort water --max-water-ft 300
```

### Why 1000 feet and not deeded frontage

The Corps of Engineers owns a shoreline strip around most of Old Hickory Lake. A
large share of what sells as lakefront on this lake is not deeded to the water at
all: it is adjacent to Corps land with dock rights. Testing whether a parcel
boundary touches the water would miss those properties, which are most of the
market.

So the filter is distance based. Adjust it to taste:

| Threshold | Reads as |
|---|---|
| 300 ft | genuinely on the water |
| 1000 ft | on the water or one lot back, the default |
| 2640 ft | half mile lake access band |

`gf show` labels each lead as "on the water" under a quarter mile, "walk to the
water" under a mile, and "inland" beyond that.

### If the fetch cannot find the lake

NHD's layer numbering was not verifiable when this was built, so nothing depends on
knowing it. The fetch walks a list of candidate layers, queries each by bounding box
rather than by field name, and filters the results on any attribute mentioning the
lake. When it finds nothing it prints the names it did see:

```bash
npm run gf -- waterbody:fetch old-hickory-lake
#   ...
#   No matching polygon found.
#   Names present in the search area:
#     Cumberland River
#     Old Hickory Lake
#   Re-run with --accept-name "<one of the above>"

npm run gf -- waterbody:fetch old-hickory-lake --accept-name "Old Hickory Lake"
```

If no features come back at all, the service or the layer ids are wrong:

```bash
npm run gf -- waterbody:layers https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer
```

Then put the right layer id into the `candidates` list in
`config/waterbodies/old-hickory-lake.source.json`.

### Adding another lake

Copy the source config, change the name, the match string and the bounding box:

```bash
cp config/waterbodies/old-hickory-lake.source.json config/waterbodies/percy-priest.source.json
# edit name, match, bbox
npm run gf -- waterbody:fetch percy-priest
npm run gf -- geo --waterbody percy-priest
```

Then add a market referencing it. Note that `gf geo` stores one distance per
parcel, so running it for a second waterbody overwrites the first for any parcel in
range of both. Keep separate lakes to separate parcel pulls, or re-run `gf geo` for
whichever lake you are working that day.

## Getting the parcel data

All seven markets are fed by one layer. Tennessee publishes statewide parcel
boundaries for 86 counties through the Comptroller's Division of Property
Assessments, served on TNMap, which beats wiring up seven county GIS servers with
seven different schemas.

`config/sources/tn-parcels.json` has one source per target area, all disabled until
you set the URL. Find it with:

```bash
npm run gf -- find "tennessee property boundaries"
```

Paste the layer URL into each source, then:

```bash
npm run gf -- discover tn-parcels-davidson
npm run gf -- pull tn-parcels-cheatham
```

### Bounding boxes instead of a county field

Each source is scoped by a bounding box rather than a `COUNTY = 'X'` where clause.
A where clause needs the county column name, which differs between layers. A
bounding box needs no schema knowledge, is applied server side so the pull stays
small, and is deliberately a little over inclusive. The market filters do the
precise work afterwards, so the extra parcels cost a little bandwidth and nothing
else.

Every box in that file is approximate. Widen one if a pull looks short.
