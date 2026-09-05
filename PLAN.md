# 200-City Prebuilt World Plan

## Outcome

Build and publish 200 versioned, downloadable city packages before runtime. The browser never generates a city from scratch: it streams immutable OGC 3D Tiles 1.1/glTF packages from the CDN, with a low-detail global layer beneath them. Each city contains a metro shell, detailed urban core, pedestrian hero zones, recognizable landmarks, terrain, shorelines/water, roads, rail, bridges, vegetation, collision, day/night materials, and attribution.

The plan strongly prefers an existing official or permissively licensed 3D city model. Procedural reconstruction is a fallback for gaps, not the first choice. A city is not complete when “some buildings render”; it is complete only when its data provenance, geographic coverage, visual fidelity, collision, streaming, and frame pacing all pass automated release gates.

## Non-negotiable rules

- Do not extract, cache, trace, or redistribute Google/Apple/Bing 3D meshes or imagery unless a written license explicitly permits the exact use. API access is not redistribution permission.
- Acquire models in this order: official municipal/national digital twin or CityGML/CityJSON/OBJ/3MX/I3S/3D Tiles; licensed survey/photogrammetry/LiDAR; individually licensed landmark models; Overture/OSM footprints and attributes; procedural fallback.
- Record source URL, publisher, author, license/SPDX identifier, attribution text, acquisition date, source version, original CRS/vertical datum, allowed uses, redistribution status, and SHA-256 before processing any asset.
- Reject assets with unclear ownership, “editorial only,” non-redistributable, no-derivatives, or incompatible share-alike terms. Keep ODbL-derived databases and required notices separable from permissively licensed art.
- Preserve the source archive in private cold storage when permitted; publish only derived runtime artifacts the source license allows.
- Treat waterways, terrain, bridges, vegetation, transit infrastructure, boroughs/districts, and islands as first-class city content.
- Never certify performance on SwiftShader/software WebGL. Software rendering is only a correctness smoke test.

## Reusable authoritative data leads

Use these as starting points, then re-check their current terms during each city phase:

- [NYC official 3-D Building Model](https://data.cityofnewyork.us/City-Government/3-D-Building-Model/tnru-abg2) provides downloadable CityGML, Multipatch, and DGN massing.
- [Toronto 3D Massing](https://open.toronto.ca/dataset/3d-massing/) provides citywide massing/height data under Toronto's open-data terms.
- [Montréal textured LoD2 buildings](https://donnees.montreal.ca/en/dataset?tags=3D) are available in CityGML/3DM for covered boroughs.
- [Berlin 3D download portal](https://www.businesslocationcenter.de/downloadportal/) publishes a current textured OBJ mesh; [Berlin Open Data](https://daten.berlin.de/artikel/berlin-3d-stadtmodell-als-open-data) also identifies LoD2 CityGML.
- [Helsinki 3D](https://www.hel.fi/en/decision-making/information-on-helsinki/maps-and-geospatial-data/helsinki-3d) provides CC BY 4.0 textured OBJ/3MX and CityGML LoD1/LoD2.
- [Vienna geodata](https://www.wien.gv.at/stadtplanung/geodaten) exposes terrain, surface, LoD1, roof, city-model, and orthophoto downloads.
- [Rotterdam 3D](https://www.rotterdam.nl/rotterdam-in-3d) offers a detailed city model; the national catalog identifies its CityGML data as public domain.
- [Poland Geoportal 3D buildings](https://www.geoportal.gov.pl/en/data/other-data/3d-models-of-building/) offers downloadable LoD1/LoD2 data, including Warsaw.
- [France BD TOPO](https://www.data.gouv.fr/datasets/bd-topo-r) supplies metric 3D building/topographic data, heights, hydrography, transport, and terrain under Licence Ouverte 2.0.
- [USGS 3DEP](https://www.usgs.gov/3d-elevation-program) supplies unrestricted US elevation/LiDAR; [USGS/USDA NAIP](https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer) supplies mostly 0.6 m public-domain US orthophotography.
- [Cape Town Open Data](https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/239) exposes LiDAR-derived building footprints and related municipal layers; verify redistribution terms per layer.
- [Overture Buildings](https://docs.overturemaps.org/guides/buildings/) supplies downloadable global footprints, parts, heights, floors, stable IDs, and per-feature source metadata.
- [OpenStreetMap](https://www.openstreetmap.org/copyright) supplies global roads, buildings, water, transit, and points of interest under ODbL with attribution/share-alike obligations.
- [OpenAerialMap](https://openaerialmap.org/legal/) supplies downloadable CC BY 4.0 imagery where coverage exists.
- Copernicus DEM/land products provide a global terrain/land-cover fallback; preserve the required “Contains modified Copernicus Service information” notice.

CityGML is the semantic interchange format; runtime delivery uses vendor-neutral [OGC 3D Tiles](https://www.ogc.org/standards/3dtiles/). glTF payloads use mesh compression and [KTX2/Basis Universal](https://www.khronos.org/news/press/khronos-ktx-2-0-textures-enable-compact-visually-rich-gltf-3d-assets) textures.

## Program foundation (required before Phase 1; not an additional city phase)

Create these repository capabilities once and reuse them for all 200 phases:

1. `cities/catalog.json`: exactly 200 records with phase number, slug, display name, country, WGS84 bounds, spawn points, metro/core/hero polygons, expected districts, landmarks, water bodies, bridges, airports, and transit modes.
2. `cities/<slug>/sources.json`: schema-validated source ledger with license and checksum fields; CI rejects missing terms or forbidden redistribution.
3. `cities/<slug>/recipe.yml`: declarative downloads, CRS/datum conversions, clipping, conflation priority, geometry repair, material generation, tiling, and LOD rules. Downloads are checksum-pinned and resumable.
4. `tools/city-pipeline`: container-pinned GDAL, PDAL, Blender, CityJSON/CityGML, glTF Transform, KTX, meshoptimizer, and 3D Tiles steps. Identical inputs must produce identical manifest/content hashes.
5. `cities/<slug>/city.manifest.json`: output inventory with feature counts, source lineage, bounding volumes, geometric errors, byte/GPU budgets, collision hashes, landmark IDs, screenshots, and attribution.
6. CDN layout `cities/<slug>/<release-hash>/tileset.json`; releases are immutable, Brotli-enabled, range-request compatible, cacheable for one year, and switched through an atomic catalog pointer.
7. Runtime city handoff: predictive prefetch, global-to-city cross-fade, exactly one visual/collision authority, cancellation, retries, offline/error UI, and bounded LRU eviction.
8. `pnpm city:discover --city <slug>` generates a source report but never downloads an unapproved asset; `city:fetch`, `city:build`, `city:verify`, and `city:publish` require successively stronger evidence.

### Mandatory per-city build contract

Every numbered phase executes all of C1–C8:

- **C1 — Acquire:** search municipal/national portals and the OGC open-model lists first. Approve a source only after automated URL, checksum, license, attribution, CRS, vertical datum, date, coverage, and redistribution checks. Record rejected candidates and why.
- **C2 — Cover:** build a 30–80 km metro LoD0/1 shell, a 10–20 km LoD2 core, and at least two 1–4 km² pedestrian hero zones. Model administrative districts, terrain, bathymetric shoreline skirts, waterways, parks, roads, rail, stations, bridges, ports, and airports present inside the declared area.
- **C3 — Detail:** import rather than remodel every suitably licensed landmark. Fill gaps with survey-derived or hand-authored LoD3 models. Add roof forms, facade material classes, windows/doors at hero distance, street furniture, trees, emissive night materials, navigable surfaces, simplified collision, landing pads, and water traffic routes. Never bake transient people/cars into authored textures.
- **C4 — Conflate:** use source priority per feature, stable IDs, topology repair, duplicate removal, ground/roof height sanity checks, datum correction, and manually reviewed landmark alignment. Maintain an exceptions file; do not silently average conflicting geometry.
- **C5 — Optimize:** emit spatially subdivided 3D Tiles 1.1 with three or more LODs, glTF/GLB payloads, meshopt/Draco where measured beneficial, KTX2 mipmapped textures, atlases/instancing, occlusion metadata, and separate low-poly collision. Avoid monolithic city meshes.
- **C6 — Validate data:** schema, license, checksum, CRS, bounds, watertightness, normals, UVs, texture dimensions, mip levels, feature counts, coverage samples, building-ground gaps, bridge clearance, road slope, water seams, collision holes, and landmark geodesic/height tolerances must pass.
- **C7 — Validate experience:** deterministic Playwright flights/walks/landings cover every named zone, bridge, waterfront, and landmark; 4K reference images cover noon/night, ground/rooftop/approach views, and LOD transitions. No blank tiles, obvious block artifacts, z-fighting, floating/sunken buildings, holes, attribution loss, or duplicate authority.
- **C8 — Publish:** generate SBOM/source notices, signed manifest, visual/performance evidence, rollback pointer, and changelog. Publish only after two-person visual/license review and all automated gates pass.

### Assertions run by every phase

`pnpm city:verify --city <slug> --profile release` must programmatically assert:

- Catalog count is exactly 200; phase numbers and slugs are unique and contiguous from 1–200.
- 100% of published files have lineage and compatible redistribution status; every byte matches its content hash; no Google/Apple mesh or unapproved source occurs in lineage.
- Terrain, buildings, roads, water, vegetation, and collision cover at least 99.5% of declared core sample points; expected districts and water bodies are present; no unintended hole exceeds 20 m² in a hero zone or 400 m² in the core.
- At least 95% of source buildings are represented; ≥90% use measured height/roof data where the approved source provides it. Landmark checklist coverage is 100%, position error ≤3 m and height error ≤5% against the approved reference.
- Hero-zone ground imagery is ≤0.30 m GSD when legally available, core ≤0.75 m, metro ≤2.5 m; poorer coverage must be explicitly waived and surfaced in UI. Textures have mipmaps, valid color space, anisotropy ≥8, no dimension >8192, and no unintended effective texel density below 256 px/m for LoD3 landmarks or 64 px/m for hero facades.
- Golden images at fixed camera/time/weather render at ≥0.95 resolution scale on High and native device pixel ratio up to 2. SSIM ≥0.97 against approved baselines, blank-pixel ratio <0.5%, missing-texture magenta pixels = 0, edge sharpness ≥the calibrated baseline floor, and 8×8 blockiness ≤the calibrated ceiling. A deliberately blurred, blank, missing-texture, and block-compressed fixture must each fail.
- On the release GPU at 2560×1440 High: median ≥60 FPS, p95 frame ≤18.2 ms, p99 ≤33.3 ms, 1% low ≥50 FPS, frames >50 ms <0.1%, no three consecutive frames >33.3 ms, and camera-motion RMS jerk within the fixed-step baseline. On the mid-tier GPU at 1920×1080 Medium: median ≥45 FPS, p95 ≤24 ms, 1% low ≥40 FPS, >50 ms frames <0.5%.
- Warm city switch shows first useful city pixels ≤1.0 s and reaches hero-ready ≤3.0 s; cold broadband switch ≤3.0/8.0 s. Directional prefetch hit rate ≥90%; visible LOD pop changes <2% of frame pixels; no lower LOD replaces a loaded higher LOD.
- High-profile steady-state decoded GPU memory ≤1.5 GiB per city, CPU heap ≤1.0 GiB, visible triangles ≤8 M, draw calls ≤2,000, long tasks >50 ms ≤2/min, and 30-minute walk/flight memory drift ≤5%. Network concurrency, retries, and cache remain bounded.
- Walk collision has no penetration >5 cm, step jitter >2 cm RMS, or authoritative gaps; all scripted landings settle within 0.25 m of the approved surface. Water is non-walkable except declared structures; bridges/tunnels preserve clearance.
- Hardware renderer name, driver, browser, viewport, DPR, thermal state, build hash, and raw trace are stored with evidence. Software/headless results cannot set `performanceCertified: true`.

## The 200 city phases

Each phase below runs C1–C8 and the full assertion suite. “Source lead” is a discovery priority, not advance legal approval.

## Phase 1 — New York City, United States (`new-york-city`)

- [ ] Acquire the official NYC 3-D Building Model first, then current NYC Open Data/USGS 3DEP/NAIP and Overture/OSM deltas; cover all five boroughs, the Hudson/East/Harlem rivers, Upper Bay, Governors/Roosevelt islands, and JFK/LGA/Newark approaches.
- [ ] Detail Financial District, Midtown/Times Square, Central Park, Brooklyn Heights/DUMBO, Long Island City, Yankee Stadium, St. George; include Statue of Liberty, Empire State, Chrysler, One WTC, Brooklyn/Manhattan/Queensboro/Verrazzano bridges, ferries, subway/rail portals, piers, and airports.
- [ ] Build borough LoD shells, detailed Manhattan plus named outer-borough centers, two hero walks (Times Square–Bryant Park and Battery–Brooklyn Bridge), navigable waterfronts/collision, day/night facade sets, and harbor/ferry routes.
- [ ] Assert five-borough/shoreline coverage, all named landmarks/routes, official-model conflation, and release visual/performance budgets with `pnpm city:verify --city new-york-city --profile release`.

## Phase 2 — Chicago, United States (`chicago`)

- [ ] Acquire Chicago building footprints/municipal GIS, USGS 3DEP, NAIP, and licensed landmark models; cover the city and near suburbs, Lake Michigan shoreline, Chicago River, Midway, and O’Hare approaches.
- [ ] Detail Loop, River North, Magnificent Mile, Streeterville, Hyde Park, Wrigleyville; include Willis Tower, 875 N Michigan, Tribune Tower, Wrigley Building, Cloud Gate, Navy Pier, museums, movable bridges, L tracks, Metra stations, and lakefront harbors.
- [ ] Build Loop/Riverwalk and Millennium Park hero zones, accurate canyon materials/rooflines, lake/river traffic, rail structures, parks, collision, and night skyline.
- [ ] Assert shoreline/river topology, bridge clearances, L-track continuity, landmark silhouette accuracy, and `city:verify --city chicago`.

## Phase 3 — Los Angeles, United States (`los-angeles`)

- [ ] Acquire LA County/city GIS, USGS 3DEP LiDAR, NAIP, Overture/OSM, and licensed models; cover the basin from Downtown to Santa Monica, Hollywood, San Pedro/Long Beach ports, LAX and Burbank.
- [ ] Detail Downtown, Hollywood, Beverly Hills, Century City, Venice/Santa Monica, Griffith Park; include City Hall, US Bank Tower, Wilshire Grand, Hollywood Sign, Griffith Observatory, Capitol Records, Getty, piers, freeway interchanges, studios, and port cranes.
- [ ] Build Downtown and Hollywood/Griffith hero zones, mountain terrain, beaches/ocean skirts, freeway/rail geometry, palms/vegetation, collision, haze-safe materials, and night lighting.
- [ ] Assert basin terrain/shoreline, freeway and airport corridors, landmark visibility distances, and `city:verify --city los-angeles`.

## Phase 4 — San Francisco, United States (`san-francisco`)

- [ ] Acquire SF open 3D/building/LiDAR data, USGS 3DEP, NAIP, Overture/OSM, and licensed models; cover the peninsula, Treasure/Yerba Buena/Alcatraz islands, bay shoreline, Oakland edge, and SFO approaches.
- [ ] Detail Downtown/SoMa, Embarcadero, Chinatown, North Beach, Presidio, Mission, Golden Gate Park; include Golden Gate/Bay bridges, Transamerica Pyramid, Salesforce Tower, Coit Tower, Ferry Building, Palace of Fine Arts, cable cars, piers, and Alcatraz.
- [ ] Build steep-street and Embarcadero–Chinatown hero zones, high-resolution terrain/road grading, fog-compatible materials, bridge collision, cable-car routes, water traffic, and night skyline.
- [ ] Assert hill grades, bridge spans/clearance, island/water seams, street-level parallax, and `city:verify --city san-francisco`.

## Phase 5 — Miami, United States (`miami`)

- [ ] Acquire Miami-Dade GIS/LiDAR, USGS 3DEP, NAIP, Overture/OSM, and licensed models; cover Downtown/Brickell, Miami Beach, Biscayne Bay, PortMiami, barrier islands, MIA, and coastal approaches.
- [ ] Detail Brickell, Downtown, South Beach/Art Deco District, Wynwood, Coconut Grove, Key Biscayne; include Freedom Tower, Kaseya Center, Vizcaya, Ocean Drive, causeways, cruise terminals, marinas, lifeguard towers, and palms.
- [ ] Build Brickell/Bayfront and South Beach hero zones, transparent/coastal water, seawalls, bridges, boats/cruise routes, beach materials, tropical vegetation, collision, and emissive towers.
- [ ] Assert islands/causeways, water edge continuity, Art Deco facade coverage, port/airport approaches, and `city:verify --city miami`.

## Phase 6 — Boston, United States (`boston`)

- [ ] Acquire Boston/BPDA/MassGIS building, terrain, orthophoto and LiDAR data plus Overture/OSM; cover Boston/Cambridge, harbor islands near core, Charles River, Logan, and inner metro.
- [ ] Detail Downtown, Back Bay, Beacon Hill, Seaport, Fenway, Harvard/MIT; include State House, Faneuil Hall, Custom House, Prudential/Hancock towers, Fenway Park, Zakim Bridge, USS Constitution, and MBTA portals.
- [ ] Build Freedom Trail–waterfront and Back Bay–Common hero zones, brick/brownstone facades, harbor/river, bridges, rail/transit, parks, collision, and night waterfront.
- [ ] Assert historic street fabric, Charles/harbor topology, Logan approach and landmark set with `city:verify --city boston`.

## Phase 7 — Washington, D.C., United States (`washington-dc`)

- [ ] Acquire DC open building/LiDAR/orthophoto data, USGS 3DEP, Overture/OSM, and public-domain federal assets; cover the District, Arlington/Alexandria core, Potomac/Anacostia, and DCA approaches.
- [ ] Detail National Mall, Capitol Hill, Downtown, Georgetown, Arlington; include Capitol, White House, Washington Monument, Lincoln/Jefferson memorials, Smithsonian buildings, Pentagon exterior, Union Station, Key/Arlington Memorial bridges, and Metro portals.
- [ ] Build Mall–Tidal Basin and Georgetown waterfront hero zones, monuments at survey scale, tree/park coverage, river traffic, bridges, collision, and restrained night materials.
- [ ] Assert height-limit skyline, protected-area exclusions, monuments and axial alignments, shoreline, and `city:verify --city washington-dc`.

## Phase 8 — Philadelphia, United States (`philadelphia`)

- [ ] Acquire Philadelphia open GIS/LiDAR/orthophotos, USGS 3DEP, Overture/OSM, and licensed models; cover Center City, university districts, Delaware/Schuylkill rivers, stadium complex, and PHL approaches.
- [ ] Detail Old City, Center City, Parkway, University City, South Philadelphia; include Independence Hall, Liberty Bell pavilion, City Hall, Comcast towers, Art Museum steps, Reading Terminal, Ben Franklin/Walt Whitman bridges, and 30th Street Station.
- [ ] Build Independence–Society Hill and Parkway–Rittenhouse hero zones, rowhouse facades, river/rail infrastructure, parks, collision, and night skyline.
- [ ] Assert historic core block scale, bridge/river continuity, landmark completeness, and `city:verify --city philadelphia`.

## Phase 9 — Seattle, United States (`seattle`)

- [ ] Acquire Seattle/King County 3D/LiDAR/orthophoto data, USGS 3DEP, Overture/OSM, and licensed models; cover Elliott Bay, Lake Union/Washington edges, Downtown, port, SEA approaches, and visible Cascade/Olympic terrain.
- [ ] Detail Downtown, Pike Place, Seattle Center, Pioneer Square, Capitol Hill, waterfront; include Space Needle, Pike Place sign/buildings, Columbia Center, stadiums, ferries, Great Wheel, floating bridges, monorail, cranes, and seaplanes.
- [ ] Build Pike Place–waterfront and Seattle Center hero zones, steep terrain, water/shorelines, ferries/seaplane routes, bridges, evergreen vegetation, collision, and wet/night material variants.
- [ ] Assert terrain silhouette, ferry terminals/routes, floating bridge placement, landmark completeness, and `city:verify --city seattle`.

## Phase 10 — Houston, United States (`houston`)

- [ ] Acquire Houston/Harris County GIS, USGS 3DEP, NAIP, Overture/OSM, and licensed models; cover Downtown, Uptown, Medical Center, ship channel edge, IAH/Hobby approaches, and bayou network.
- [ ] Detail Downtown, Museum District, Texas Medical Center, Uptown/Galleria, NASA visitor area where extent permits; include JPMorgan Chase Tower, Williams Tower, stadiums, City Hall, major freeway stacks, bayou parks, and rail.
- [ ] Build Downtown/bayou and Museum–Medical Center hero zones, floodplain terrain, bayous, freeway/rail/airport corridors, trees, collision, heat/haze and night materials.
- [ ] Assert bayou continuity, freeway stack clearances, multiple skyline centers, and `city:verify --city houston`.

## Phase 11 — Dallas–Fort Worth, United States (`dallas-fort-worth`)

- [ ] Acquire Dallas/Fort Worth/Arlington GIS, USGS 3DEP, NAIP, Overture/OSM, and licensed models; cover both downtowns, Arlington stadiums, DFW/Love Field approaches, Trinity River, and core freeway corridors.
- [ ] Detail Dallas Arts District/Deep Ellum/Reunion, Fort Worth Sundance/Stockyards, Arlington; include Bank of America Plaza, Reunion Tower, Fountain Place, museums, AT&T Stadium, Globe Life Field, T&P, and Stockyards.
- [ ] Build Dallas Arts/Dealey and Fort Worth Stockyards hero zones, two skylines, Trinity floodplain, rail/freeway/airport networks, collision, and night lighting.
- [ ] Assert dual-core coverage, stadium and airport geometry, landmark sets, and `city:verify --city dallas-fort-worth`.

## Phase 12 — Atlanta, United States (`atlanta`)

- [ ] Acquire Atlanta/Fulton GIS/LiDAR/orthophoto data, USGS 3DEP, Overture/OSM, and licensed models; cover Downtown, Midtown, Buckhead, Hartsfield approaches, BeltLine, and major freeway/rail corridors.
- [ ] Detail Downtown, Centennial Park, Midtown, Buckhead, Sweet Auburn; include Bank of America Plaza, Peachtree Plaza, Georgia Capitol, stadiums, aquarium/CNN complex, Fox Theatre, MLK historic area, and MARTA stations.
- [ ] Build Centennial–Downtown and Midtown/BeltLine hero zones, rolling terrain, dense tree canopy, freeway stacks, rail, collision, and night skyline.
- [ ] Assert three skyline clusters, airport approach, tree canopy/road visibility balance, and `city:verify --city atlanta`.

## Phase 13 — Las Vegas, United States (`las-vegas`)

- [ ] Acquire Clark County/city GIS, USGS 3DEP, NAIP, Overture/OSM, and separately licensed resort exteriors; cover Strip, Downtown, airport, valley terrain, and nearby Red Rock silhouette.
- [ ] Detail Strip and Fremont; include Welcome sign, Sphere, Stratosphere, major resort masses/facades where licensed, Allegiant Stadium, T-Mobile Arena, convention center, monorail, fountains, and airport.
- [ ] Build Strip and Fremont hero zones, high-density emissive/signage system without trademark misuse, desert terrain, road/monorail, crowd-safe collision, fountain animation hooks, and night-first materials.
- [ ] Assert night luminance/exposure, signage resolution, resort silhouette permissions, airport proximity, and `city:verify --city las-vegas`.

## Phase 14 — New Orleans, United States (`new-orleans`)

- [ ] Acquire city/Orleans GIS and LiDAR, USGS 3DEP, NAIP, Overture/OSM, and licensed models; cover French Quarter, CBD, Garden District, Mississippi bends, Lake Pontchartrain edge, port, and MSY approach.
- [ ] Detail French Quarter, Jackson Square, Bourbon/Royal streets, Warehouse District, Garden District; include St. Louis Cathedral, Superdome, riverboats, streetcars, cemeteries, Crescent City Connection, levees, and port cranes.
- [ ] Build French Quarter–riverfront and Garden District hero zones, balconies/courtyards, subsidence-aware terrain, river/levee geometry, streetcars, vegetation, collision, and wet/night variants.
- [ ] Assert river curvature/elevation, balcony/collision clearance, streetcar continuity, landmarks, and `city:verify --city new-orleans`.

## Phase 15 — Honolulu, United States (`honolulu`)

- [ ] Acquire Honolulu/Hawaii GIS, USGS 3DEP, orthoimagery, Overture/OSM, and licensed models; cover Waikiki, Downtown, Pearl Harbor public exterior, HNL approach, Diamond Head, and Koʻolau terrain.
- [ ] Detail Waikiki, Downtown/Iolani, Ala Moana, harbor; include Diamond Head, Iolani Palace, Aloha Tower, hotel skyline, USS Arizona memorial exterior where permitted, marinas, beaches, and airport.
- [ ] Build Waikiki beach and Downtown–Iolani hero zones, volcanic terrain, reefs/ocean/shoreline, palms, boats, collision, humid atmosphere, and night materials.
- [ ] Assert terrain/coast alignment, reef/water seams, culturally sensitive asset review, and `city:verify --city honolulu`.

## Phase 16 — Denver, United States (`denver`)

- [ ] Acquire Denver regional GIS/LiDAR/orthophotos, USGS 3DEP, Overture/OSM, and licensed models; cover Downtown, Capitol Hill, Union Station, airport corridor, and Rocky Mountain horizon terrain.
- [ ] Detail LoDo, Civic Center, RiNo, sports district; include State Capitol, Union Station, cash-register building, convention center bear exterior, stadiums, Daniels & Fisher Tower, rail, and DEN terminal/tents.
- [ ] Build LoDo–Civic Center and RiNo hero zones, accurate elevation/foothill horizon, rail/transit, parks, collision, snow-capable and night materials.
- [ ] Assert mile-high datum, mountain skyline reference views, airport/rail continuity, and `city:verify --city denver`.

## Phase 17 — San Diego, United States (`san-diego`)

- [ ] Acquire San Diego regional GIS/LiDAR/orthophoto data, USGS 3DEP, Overture/OSM, and licensed models; cover Downtown, Coronado, harbor, Balboa Park, La Jolla coast, SAN approach, and border-facing terrain without overextending the package.
- [ ] Detail Gaslamp, Embarcadero, Balboa Park, Coronado; include USS Midway exterior, convention center, Cabrillo Bridge, California Tower, Hotel del Coronado, stadium, harbor vessels, piers, and airport.
- [ ] Build Gaslamp–Embarcadero and Balboa Park hero zones, coastal cliffs/beaches, bridge/ferry routes, palms, rail/trolley, collision, and night waterfront.
- [ ] Assert Coronado bridge/harbor clearance, airport low approach, park architecture, and `city:verify --city san-diego`.

## Phase 18 — Austin, United States (`austin`)

- [ ] Acquire Austin/Travis GIS/LiDAR/orthophotos, USGS 3DEP, Overture/OSM, and licensed models; cover Downtown, UT, South Congress, Lady Bird Lake, airport approach, and Hill Country terrain edge.
- [ ] Detail Downtown, Capitol/UT, Sixth Street, South Congress; include Texas Capitol, UT Tower, Frost Bank, Independent, Congress Avenue Bridge, music venues, stadium, trails, and bat-viewing bridge context.
- [ ] Build Capitol–Sixth and South Congress/lake hero zones, river/trails, hills, bridges, rail, live-music facade/night materials, vegetation, and collision.
- [ ] Assert Capitol view corridors, lake/bridge alignment, skyline growth-date metadata, and `city:verify --city austin`.

## Phase 19 — Portland, Oregon, United States (`portland-oregon`)

- [ ] Acquire Portland/Metro GIS/LiDAR/orthophotos, USGS 3DEP, Overture/OSM, and licensed models; cover Downtown, Pearl, eastside, Willamette/Columbia edges, PDX approach, and Mount Hood horizon terrain.
- [ ] Detail Downtown, Pearl District, Old Town, Washington Park, central eastside; include US Bancorp Tower, Big Pink, Portland Building, Union Station, steel/lift bridges, aerial tram, stadium, and MAX lines.
- [ ] Build riverfront–Downtown and Pearl/Old Town hero zones, bridges with moving-clearance metadata, rivers, forest vegetation, rail/transit, collision, wet/night materials.
- [ ] Assert bridge typology/clearance, Mount Hood view, river seams, transit continuity, and `city:verify --city portland-oregon`.

## Phase 20 — Detroit, United States (`detroit`)

- [ ] Acquire Detroit/Wayne GIS/LiDAR/orthophoto data, USGS 3DEP, Overture/OSM, and licensed models; cover Downtown/Midtown, riverfront, Belle Isle, Windsor-facing shoreline as low-detail context, and DTW approach.
- [ ] Detail Downtown, Greektown, Midtown, Corktown, riverfront; include Renaissance Center, Guardian Building, Fisher Building, Michigan Central, stadiums, Ambassador Bridge exterior, Belle Isle bridge, People Mover, and factories.
- [ ] Build Campus Martius–riverfront and Corktown/Michigan Central hero zones, art-deco facades, river/bridge/rail, industrial materials, collision, and night skyline.
- [ ] Assert international-boundary source separation, river/bridge alignment, architectural landmarks, and `city:verify --city detroit`.

## Phase 21 — Toronto, Canada (`toronto`)

- [ ] Acquire official Toronto 3D Massing and open-data updates first, then municipal LiDAR/orthophotos and Overture/OSM; cover all city districts, harbor/islands, ravines, Pearson/Billy Bishop approaches, and Lake Ontario shoreline.
- [ ] Detail Financial/Entertainment districts, Yorkville, Distillery, Harbourfront, Scarborough center; include CN Tower, Rogers Centre, City Hall, Royal Ontario Museum, Casa Loma, Union Station, Prince Edward Viaduct, islands/ferries, and streetcars.
- [ ] Build CN/Harbourfront–Distillery and City Hall–Yorkville hero corridors, ravines, islands/water, rail/streetcar/ferry routes, collision, winter and night materials.
- [ ] Assert official massing coverage, CN height/silhouette, island/ferry topology, ravines, and `city:verify --city toronto`.

## Phase 22 — Montréal, Canada (`montreal`)

- [ ] Acquire Montréal’s textured LoD2 CityGML/3DM first and current municipal LiDAR/open data, then Overture/OSM; cover the island core, Mount Royal, St. Lawrence/Rivière des Prairies, port, and YUL approach.
- [ ] Detail Old Montréal, Downtown, Plateau, Mount Royal, Olympic district; include Notre-Dame Basilica, Habitat 67, Olympic Stadium/tower, Place Ville Marie, Jacques Cartier/Champlain bridges, Old Port, metro portals, and biosphere.
- [ ] Build Old Port–Downtown and Plateau/Mount Royal hero zones, stone facades, terrain, river/islands, bridges, collision, snow/wet and night materials.
- [ ] Assert LoD2 texture licensing/coverage, Mount Royal elevation, bridge/river topology, and `city:verify --city montreal`.

## Phase 23 — Vancouver, Canada (`vancouver`)

- [ ] Acquire Vancouver/Metro open 3D/LiDAR/orthophoto data and Overture/OSM; cover Downtown peninsula, False Creek, Stanley Park, North Shore context, YVR approach, and mountain terrain.
- [ ] Detail Downtown, Gastown, Coal Harbour, Granville Island, Stanley Park; include Canada Place, Harbour Centre, convention center, Lions Gate/Burrard bridges, Science World, stadiums, seaplanes, ferries, and Steam Clock streetscape.
- [ ] Build Gastown–Canada Place and False Creek/Granville hero zones, seawalls, mountain/water terrain, bridges, dense vegetation, transit/ferry routes, collision, and wet/night materials.
- [ ] Assert mountain/harbor sightlines, seawall continuity, bridge clearance, vegetation budgets, and `city:verify --city vancouver`.

## Phase 24 — Ottawa–Gatineau, Canada (`ottawa-gatineau`)

- [ ] Acquire Ottawa/Gatineau/NRC open models, LiDAR, orthophotos and Overture/OSM; cover both city centers, Ottawa/Rideau/Gatineau rivers, canal, airport approach, and greenbelt context.
- [ ] Detail Parliament Hill, ByWard Market, canal, Hull museums; include Centre Block, Peace Tower, Château Laurier, National Gallery, Museum of History, Alexandra/Portage bridges, locks, rail, and winter skating route.
- [ ] Build Parliament–ByWard/Canal and Gatineau waterfront hero zones, escarpment/river terrain, bridges/locks, bilingual signage assets, collision, seasonal and night materials.
- [ ] Assert cross-provincial datum/source handling, waterways/locks, landmark alignment, and `city:verify --city ottawa-gatineau`.

## Phase 25 — Calgary, Canada (`calgary`)

- [ ] Acquire Calgary open 3D/LiDAR/orthophoto data and Overture/OSM; cover Downtown/Beltline, Bow/Elbow rivers, airport approach, Olympic Park, and Rocky Mountain horizon.
- [ ] Detail Downtown, Beltline, East Village, Stampede; include Calgary Tower, Bow, Telus Sky, Peace Bridge, Saddledome, Central Library, City Hall, CTrain, and Stampede grounds.
- [ ] Build Stephen Avenue–East Village and Stampede/Beltline hero zones, river pathways, bridges, rail, winter materials, vegetation, collision, and night skyline.
- [ ] Assert river confluence/floodplain, mountain horizon, rail/bridge geometry, and `city:verify --city calgary`.

## Phase 26 — Edmonton, Canada (`edmonton`)

- [ ] Acquire Edmonton open 3D/LiDAR/orthophoto data and Overture/OSM; cover Downtown, North Saskatchewan River valley, university, airport approaches, and major ravines.
- [ ] Detail Downtown, Legislature, Ice District, Old Strathcona, university; include Legislature, Rogers Place, Muttart Conservatory, High Level Bridge/streetcar, Walterdale Bridge, convention center, and river parks.
- [ ] Build Legislature–river valley and Old Strathcona hero zones, deep terrain/ravines, bridges, LRT/streetcar, vegetation, collision, snow and night materials.
- [ ] Assert river-valley elevation, bridge clearance, winter texture variants, and `city:verify --city edmonton`.

## Phase 27 — Québec City, Canada (`quebec-city`)

- [ ] Acquire Québec municipal/provincial 3D/LiDAR/orthophoto data and Overture/OSM; cover Old Québec, Plains of Abraham, St. Lawrence, Lévis context, bridges, port, and airport approach.
- [ ] Detail Upper/Lower Town, Petit-Champlain, Parliament; include Château Frontenac, Citadelle, city walls/gates, Parliament, funicular, Basilica, Dufferin Terrace, bridges, ferries, and port.
- [ ] Build fortified Old City and Lower Town–waterfront hero zones, steep escarpment, walls, river/ferries, collision, snow and night materials.
- [ ] Assert fortification continuity, elevation transitions/funicular, heritage facade coverage, and `city:verify --city quebec-city`.

## Phase 28 — Mexico City, Mexico (`mexico-city`)

- [ ] Acquire CDMX/INEGI elevation, LiDAR/orthophoto/building data and Overture/OSM; cover the central basin, Centro, Reforma, Chapultepec, Santa Fe, airport approaches, and volcanic mountain horizon.
- [ ] Detail Centro Histórico, Reforma, Chapultepec, Polanco, Coyoacán, Santa Fe; include cathedral/Palacio Nacional exteriors, Palacio de Bellas Artes, Ángel, Torre Latinoamericana, Torre Reforma, castle, museums, stadium, Metro, and canals at Xochimilco where extent permits.
- [ ] Build Zócalo–Bellas Artes and Reforma–Chapultepec hero zones, basin terrain/subsidence metadata, dense facades, roads/transit, parks, collision, haze and night materials.
- [ ] Assert basin elevation/sightlines, historic core, monument/park continuity, and `city:verify --city mexico-city`.

## Phase 29 — Guadalajara, Mexico (`guadalajara`)

- [ ] Acquire Guadalajara/Jalisco/INEGI elevation, imagery, buildings and Overture/OSM; cover Centro, Zapopan, Tlaquepaque, airport approach, and ravine/volcanic terrain context.
- [ ] Detail Centro, Americana, Zapopan, Tlaquepaque; include cathedral, Hospicio Cabañas, Teatro Degollado, Minerva, Arcos, Expiatorio, Akron/Jalisco stadiums, light rail, markets, and plazas.
- [ ] Build Centro plazas and Americana–Minerva hero zones, colonial facades, terrain, rail/roads, vegetation, collision, and night materials.
- [ ] Assert plaza/arcade topology, landmark set, terrain datum, and `city:verify --city guadalajara`.

## Phase 30 — Monterrey, Mexico (`monterrey`)

- [ ] Acquire Monterrey/Nuevo León/INEGI terrain, imagery, building data and Overture/OSM; cover Centro, San Pedro, Santa Catarina valley, airport corridor, and surrounding Sierra terrain.
- [ ] Detail Macroplaza, Barrio Antiguo, Fundidora, San Pedro; include Faro del Comercio, Palacio de Gobierno, Santa Lucía canal, Pabellón M, Torre Obispado, museums, stadiums, and Cerro de la Silla skyline.
- [ ] Build Macroplaza–Santa Lucía/Fundidora and San Pedro hero zones, dramatic mountain terrain, canal, transit/roads, industrial heritage, collision, and night skyline.
- [ ] Assert mountain silhouettes, canal continuity, high-rise locations, and `city:verify --city monterrey`.

## Phase 31 — Cancún, Mexico (`cancun`)

- [ ] Acquire Quintana Roo/INEGI terrain, coast, imagery, buildings and Overture/OSM; cover Hotel Zone/barrier island, Downtown, lagoon, airport approach, reefs, and ferry terminals.
- [ ] Detail Hotel Zone, Punta Cancún, Downtown, Puerto Juárez; include resort masses where licensed, convention center, observation tower, beaches, piers, marinas, ferries, and airport.
- [ ] Build Hotel Zone beach/lagoon and Downtown market hero zones, transparent shallow water/reef classes, dunes, palms, boats/ferries, collision, and night materials.
- [ ] Assert coastline/lagoon/reef seams, beach elevation, airport/ferry routes, and `city:verify --city cancun`.

## Phase 32 — Havana, Cuba (`havana`)

- [ ] Acquire legally redistributable Cuban/municipal or global terrain/imagery/building sources and Overture/OSM; cover Habana Vieja, Centro, Vedado, Malecón, bay, port, and airport approach.
- [ ] Detail Old Havana, Malecón, Prado, Revolution Plaza, Vedado; include Capitolio, cathedral, Castillo del Morro, Gran Teatro, Hotel Nacional exterior, fortress walls, classic street fabric, port, and seawall.
- [ ] Build Old Havana/Prado and Malecón/Vedado hero zones, colonial facades, bay/fortifications, vegetation, road collision, weathered materials, and night lighting.
- [ ] Assert source/export legality, heritage block coverage, seawall/bay alignment, and `city:verify --city havana`.

## Phase 33 — San Juan, Puerto Rico (`san-juan`)

- [ ] Acquire Puerto Rico/municipal GIS, USGS 3DEP, public orthoimagery, Overture/OSM, and licensed models; cover Old San Juan, Condado, bay, airport approach, port, and lagoon.
- [ ] Detail walled Old San Juan, Puerta de Tierra, Condado, Santurce; include El Morro, San Cristóbal, Capitol, cathedral, La Fortaleza exterior, city walls/gates, cruise terminals, bridges, and forts.
- [ ] Build Old San Juan fortifications and Condado/lagoon hero zones, coastal terrain/water, colorful facades, palms, port/boat routes, collision, and night materials.
- [ ] Assert fort wall topology, Atlantic/bay shoreline, hurricane-damage date metadata, and `city:verify --city san-juan`.

## Phase 34 — Panama City, Panama (`panama-city`)

- [ ] Acquire Panama/municipal open terrain, imagery, building and Overture/OSM data; cover modern waterfront, Casco Viejo, canal Pacific entrance, Amador Causeway, port, and Tocumen approach.
- [ ] Detail Casco Viejo, Avenida Balboa, Punta Paitilla, canal/Miraflores public exterior; include cathedral/plazas, Biomuseo, F&F Tower, skyline, Bridge of the Americas, locks, causeway, ships, and ports.
- [ ] Build Casco Viejo and Balboa waterfront hero zones, tidal shore/mangrove/water, canal ship routes/locks, dense towers, collision, humid haze, and night materials.
- [ ] Assert canal/lock/ship-scale geometry, old/new skyline contrast, causeway/bridge, and `city:verify --city panama-city`.

## Phase 35 — San José, Costa Rica (`san-jose-costa-rica`)

- [ ] Acquire Costa Rican/municipal terrain, imagery, buildings and Overture/OSM; cover central San José, Escazú, airport corridor, valley floor, and surrounding volcanic terrain.
- [ ] Detail Centro, Barrio Amón, La Sabana, Escazú; include National Theatre, cathedral, museums, stadium, central market, railway stations, parks, and mountain/volcano skyline.
- [ ] Build Centro and La Sabana–Escazú hero zones, valley terrain, rail/roads, tropical vegetation, collision, wet-season and night materials.
- [ ] Assert terrain enclosure, heritage landmark set, airport corridor, and `city:verify --city san-jose-costa-rica`.

## Phase 36 — Guatemala City, Guatemala (`guatemala-city`)

- [ ] Acquire Guatemala/municipal terrain, imagery, building and Overture/OSM data; cover central zones, civic center, airport approach, ravines, and volcano horizon.
- [ ] Detail Zones 1, 4, 9/10, civic center; include National Palace, cathedral, civic buildings, Torre del Reformador, museums, stadium, airport, plazas, and relief-map context.
- [ ] Build historic center and Reforma/Zona Viva hero zones, ravines/bridges, volcanic terrain, roads, vegetation, collision, haze and night materials.
- [ ] Assert ravine topology, airport proximity, volcano skyline, and `city:verify --city guatemala-city`.

## Phase 37 — Santo Domingo, Dominican Republic (`santo-domingo`)

- [ ] Acquire Dominican/municipal terrain, imagery, buildings and Overture/OSM; cover Zona Colonial, Malecón, Ozama River, modern center, port, and airport approaches.
- [ ] Detail Zona Colonial, Gazcue, Piantini, waterfront; include cathedral, Alcázar de Colón, Ozama Fortress, Columbus Lighthouse, National Palace, towers, bridges, port, and plazas.
- [ ] Build Colonial Zone–river and Malecón/Piantini hero zones, coastal/river water, historic walls, tropical vegetation, collision, and night materials.
- [ ] Assert colonial monument completeness, river/sea seams, skyline centers, and `city:verify --city santo-domingo`.

## Phase 38 — Nassau, Bahamas (`nassau`)

- [ ] Acquire Bahamian/open terrain, bathymetry, imagery, buildings and Overture/OSM; cover Nassau/New Providence north shore, Paradise Island, harbor, port, and airport route.
- [ ] Detail Downtown, Paradise Island, Cable Beach; include Parliament Square, Queen’s Staircase, Fort Fincastle/Charlotte, lighthouse, bridges, cruise port, straw market, resort masses where licensed, beaches, and marinas.
- [ ] Build Downtown harbor and Paradise Island hero zones, shallow-water/bathymetric colors, reefs, bridges, boats/cruise routes, palms, collision, and night materials.
- [ ] Assert island/harbor topology, water clarity transitions, licensed resort handling, and `city:verify --city nassau`.

## Phase 39 — Kingston, Jamaica (`kingston-jamaica`)

- [ ] Acquire Jamaican/municipal terrain, imagery, building and Overture/OSM data; cover Downtown, New Kingston, harbor, Port Royal, airport approach, and Blue Mountain terrain.
- [ ] Detail Downtown, New Kingston, Devon House, waterfront, Port Royal; include National Gallery, Emancipation Park, stadium, historic forts, port cranes, airport, and mountain skyline.
- [ ] Build Downtown waterfront and New Kingston hero zones, steep mountain terrain, harbor/port, roads, tropical vegetation, collision, haze and night materials.
- [ ] Assert mountain-to-harbor profile, Port Royal/airport placement, landmark coverage, and `city:verify --city kingston-jamaica`.

## Phase 40 — Belize City, Belize (`belize-city`)

- [ ] Acquire Belizean/open low-relief terrain, imagery, buildings and Overture/OSM data; cover city core, Belize River/Haulover Creek, port, airport route, coast/cayes context.
- [ ] Detail Fort George, downtown, waterfront; include Swing Bridge, Government House, St. John’s Cathedral, Baron Bliss lighthouse, terminals, canals, port, and stilt/coastal building types.
- [ ] Build Fort George–Swing Bridge and waterfront hero zones, river/coastal water and flood-prone elevation, boats, tropical vegetation, collision, and night materials.
- [ ] Assert near-sea-level datum, bridge/river topology, flood-safe collision offsets, and `city:verify --city belize-city`.

## Phase 41 — London, United Kingdom (`london`)

- [ ] Acquire licensed Greater London/borough digital-twin, LiDAR and orthophoto sources, then Overture/OSM; cover all boroughs at metro LoD, central London at LoD2, Thames reaches, Heathrow/City approaches, Royal Parks, and Docklands.
- [ ] Detail Westminster, City, South Bank, Covent Garden, Camden, Greenwich, Canary Wharf; include Parliament/Big Ben, Buckingham Palace exterior, Tower/Tower Bridge, St Paul’s, Shard, London Eye, royal/rail terminals, bridges, Tube portals, cable car, docks, and Thames traffic.
- [ ] Build Westminster–South Bank and City–Tower Bridge hero corridors plus Greenwich/Canary detail, heritage/modern facade libraries, Thames/bridges, rail/transit, parks, collision, wet and night materials.
- [ ] Assert borough/core coverage, protected sightlines, every central Thames bridge and rail terminus, and `city:verify --city london`.

## Phase 42 — Paris, France (`paris`)

- [ ] Acquire IGN BD TOPO/LiDAR HD and Paris/APUR open data before Overture/OSM; cover all arrondissements, inner suburbs at metro LoD, Seine, Bois de Boulogne/Vincennes, and CDG/Orly approaches.
- [ ] Detail Île de la Cité, Louvre/Tuileries, Champs-Élysées, Montmartre, Latin Quarter, La Défense; include Eiffel Tower, Notre-Dame current-state metadata, Louvre, Arc de Triomphe, Sacré-Cœur, Panthéon, Opéra, Grand Palais, bridges, stations, Metro portals, and riverboats.
- [ ] Build Louvre–Eiffel/Seine and Île de la Cité–Latin Quarter hero corridors, mansard/Haussmann facades, roof forms, monuments, river/bridges, rail, collision, and night materials.
- [ ] Assert arrondissements, monument axis/silhouettes, all core Seine bridges, facade/roof quality, and `city:verify --city paris`.

## Phase 43 — Monaco (`monaco`)

- [ ] Acquire Principality/French regional official terrain, cadastral/building, orthophoto and licensed model sources before Overture/OSM; cover the entire country, near-shore bathymetry, port, heliport, and French terrain context.
- [ ] Detail Monaco-Ville, Monte Carlo, La Condamine, Larvotto, Fontvieille; include Prince’s Palace exterior, Casino/Hotel de Paris exteriors, cathedral, Oceanographic Museum, harbor, yacht club, tunnel/Grand Prix route, stadium, and high-rises.
- [ ] Build complete-country LoD2 with Monte Carlo/harbor and Monaco-Ville hero zones, extreme slopes/tunnels, seawalls, marinas/yachts, vegetation, collision, and night facade/signage materials.
- [ ] Assert national boundary/full coverage, elevation/road/tunnel continuity, harbor/land-reclamation, Grand Prix route, and `city:verify --city monaco`.

## Phase 44 — Berlin, Germany (`berlin`)

- [ ] Acquire the official current Berlin textured 3D mesh and LoD2 CityGML first, plus municipal terrain/trees/orthophotos and Overture/OSM deltas; cover all boroughs, Spree/Havel/lakes, rail rings, BER approach, and Potsdam context at low LoD.
- [ ] Detail Mitte, Museum Island, government quarter, Kreuzberg, Charlottenburg, Potsdamer Platz; include Brandenburg Gate, Reichstag, TV Tower, cathedral, museums, Victory Column, East Side Gallery, Hauptbahnhof, Tempelhof, bridges, U/S-Bahn, and BER.
- [ ] Build Brandenburg–Museum Island and Alexanderplatz–East Side hero corridors, preserve official phototextures where permitted, repair mesh artifacts, add semantic collision/transit/water, vegetation, and night materials.
- [ ] Assert official-mesh dates/license, borough/water coverage, 2025 skyline landmarks, rail/airport continuity, and `city:verify --city berlin`.

## Phase 45 — Rome, Italy (`rome`)

- [ ] Acquire Roma Capitale/national open 3D, LiDAR, terrain, orthophoto and archaeology-safe data before Overture/OSM; cover central Rome, Vatican exterior context, Tiber, EUR, parks, and Fiumicino/Ciampino approaches.
- [ ] Detail Ancient Rome, Centro Storico, Vatican approach, Trastevere, Villa Borghese, EUR; include Colosseum, Forum, Pantheon, Trevi Fountain, Spanish Steps, Castel Sant’Angelo, St Peter’s exterior, Vittoriano, aqueducts, bridges, stations, and Metro portals.
- [ ] Build Forum–Colosseum and Pantheon–Trevi–Spanish Steps hero zones, hand-review archaeological geometry, stone/roof facade library, Tiber/bridges, vegetation, collision, and restrained night materials.
- [ ] Assert heritage-source authorization, monument dimensions/alignment, Tiber/bridge topology, no modern massing over ruins, and `city:verify --city rome`.

## Phase 46 — Madrid, Spain (`madrid`)

- [ ] Acquire Madrid/Spanish national LiDAR, cadastral 3D, orthophoto and terrain sources before Overture/OSM; cover central municipality, business districts, Casa de Campo, airport approach, and Sierra horizon.
- [ ] Detail Centro, Retiro, Salamanca, Gran Vía, Madrid Río, Cuatro Torres; include Royal Palace exterior, Plaza Mayor, Puerta del Sol, Cibeles, Prado, Metropolis, Bernabéu, Atocha, towers, viaducts, Metro portals, and parks.
- [ ] Build Sol–Plaza Mayor–Palace and Prado–Retiro hero corridors, Spanish facade/roof sets, river renewal, rail/transit, dense trees, collision, heat and night materials.
- [ ] Assert plaza/axis topology, museum/landmark set, airport/rail and skyline towers, and `city:verify --city madrid`.

## Phase 47 — Barcelona, Spain (`barcelona`)

- [ ] Acquire Barcelona/Catalonia LiDAR, terrain, cadastral/building and orthophoto data before Overture/OSM; cover Eixample, old city, waterfront, Montjuïc/Tibidabo, port, and airport approach.
- [ ] Detail Gothic Quarter, Eixample, waterfront, Montjuïc, Gràcia; include Sagrada Família current construction state, Park Güell, Casa Batlló/Milà, cathedral, Arc de Triomf, Camp Nou current state, Olympic sites, towers, port, cable cars, and stations.
- [ ] Build Gothic–Ramblas/waterfront and Passeig de Gràcia–Sagrada hero corridors, Gaudí assets under suitable rights, Eixample blocks/courtyards, beaches/port, terrain, collision, and night materials.
- [ ] Assert Eixample chamfers, coast/port/terrain, landmark construction-version metadata, and `city:verify --city barcelona`.

## Phase 48 — Lisbon, Portugal (`lisbon`)

- [ ] Acquire Lisbon/Portuguese LiDAR, terrain, orthophoto and 3D/building sources before Overture/OSM; cover seven hills, Tagus waterfront, Belém, Parque das Nações, bridges, port, and airport approach.
- [ ] Detail Baixa, Alfama, Bairro Alto, Belém, Expo; include Belém Tower, Jerónimos, Praça do Comércio, São Jorge Castle, cathedral, Santa Justa lift, 25 de Abril/Vasco da Gama bridges, trams/funiculars, station, and MAAT exterior.
- [ ] Build Baixa–Alfama and Belém waterfront hero zones, steep streets/stairs, azulejo facade classes, Tagus/bridges, tram routes, vegetation, collision, and golden/night materials.
- [ ] Assert hill/grade and tram continuity, waterfront/bridge geometry, heritage silhouettes, and `city:verify --city lisbon`.

## Phase 49 — Amsterdam, Netherlands (`amsterdam`)

- [ ] Acquire Dutch 3DBAG/AHN/BGT and Amsterdam open 3D/orthophoto data first, then Overture/OSM; cover canal ring, IJ waterfront, outer districts, Schiphol approach, and polder terrain.
- [ ] Detail canal ring, Jordaan, Museumplein, De Pijp, Oost, IJ; include Rijksmuseum, Centraal, Royal Palace exterior, Westerkerk, Anne Frank House exterior context, NEMO, A’DAM, bridges, trams, ferries, and windmill assets.
- [ ] Build canal-ring/Jordaan and Museumplein–De Pijp hero zones, individual narrow-house facades/rooflines, canals/houseboats/bridges, bikes/trams, trees, collision, wet and night materials.
- [ ] Assert canal/water levels and bridge clearances, 3DBAG roof coverage, street/canal continuity, and `city:verify --city amsterdam`.

## Phase 50 — Brussels, Belgium (`brussels`)

- [ ] Acquire Brussels regional open 3D/LiDAR/orthophoto and Belgian national building data before Overture/OSM; cover central region, EU quarter, Atomium/Heysel, parks, rail, and airport approach.
- [ ] Detail Grand-Place, Lower/Upper Town, EU quarter, Sablon, Heysel; include Town Hall/guildhalls, Royal Palace exterior, Palace of Justice, Atomium, Cinquantenaire, EU institutions, comic-route facades, stations, trams, and tunnels.
- [ ] Build Grand-Place–Sablon and EU/Cinquantenaire hero zones, ornate facades/rooflines, bilingual signage, transit/tunnels, parks, collision, wet and night materials.
- [ ] Assert Grand-Place enclosure/facade fidelity, Atomium geometry, rail/transit and regional coverage, and `city:verify --city brussels`.

## Phase 51 — Vienna, Austria (`vienna`)

- [ ] Acquire official Vienna terrain, surface, LoD1/roof/city-model and orthophoto downloads first, plus Overture/OSM deltas; cover all districts, Danube/Donaukanal, Prater, hills, rail, and airport approach.
- [ ] Detail Innere Stadt, Ringstrasse, MuseumsQuartier, Belvedere, Schönbrunn, Prater; include Stephansdom, Hofburg, Rathaus, Parliament, State Opera, Karlskirche, palaces, Riesenrad, DC Tower, bridges, stations, and trams.
- [ ] Build cathedral–Hofburg/Ring and Schönbrunn hero zones, official roof geometry, imperial facades, river/canal, tram/rail, parks, collision, and night materials.
- [ ] Assert official-source coverage/CRS/datum, Ringstrasse landmarks, Danube bridges, and `city:verify --city vienna`.

## Phase 52 — Prague, Czechia (`prague`)

- [ ] Acquire Prague/Czech official 3D, LiDAR, terrain and orthophoto sources before Overture/OSM; cover historic basin, Vltava, castle ridge, outer centers, rail, and airport approach.
- [ ] Detail Old Town, Malá Strana, Castle, New Town, Žižkov; include Charles Bridge, astronomical clock/Týn, castle/cathedral, National Museum, Dancing House, Žižkov Tower, Petrin tower/funicular, stations, trams, and river islands.
- [ ] Build Old Town–Charles Bridge–Castle and Wenceslas/New Town hero corridors, roofscape/spires, steep lanes, Vltava/bridges, trams, collision, and night materials.
- [ ] Assert UNESCO roofline/spire silhouettes, bridge/statue placement, terrain/river, and `city:verify --city prague`.

## Phase 53 — Budapest, Hungary (`budapest`)

- [ ] Acquire Budapest/Hungarian official 3D/LiDAR/terrain/orthophoto data before Overture/OSM; cover Buda hills, Pest, Danube islands, rail, bridges, and airport approach.
- [ ] Detail Castle District, Parliament riverfront, Inner Pest, Heroes’ Square, Gellért Hill; include Parliament, Buda Castle, Fisherman’s Bastion, Matthias Church, Chain/Liberty/Margaret bridges, basilica, baths, Citadella, stations, trams, and funicular.
- [ ] Build Parliament–Chain Bridge–Castle and Inner Pest hero corridors, detailed roof/facades, hill terrain, Danube/bridges, transit, collision, thermal-bath exteriors, and night lighting.
- [ ] Assert Buda/Pest elevation contrast, Parliament/bridge night silhouette, river islands, and `city:verify --city budapest`.

## Phase 54 — Warsaw, Poland (`warsaw`)

- [ ] Acquire Poland Geoportal LoD2/LoD1 and Warsaw orthophoto/terrain/open data first, then Overture/OSM; cover all districts, Vistula, rail, airport approach, and Praga.
- [ ] Detail Old Town, Śródmieście, Royal Route, Praga, Wola; include Palace of Culture, Royal Castle, Old Town walls/market, POLIN exterior, Warsaw Spire/Varso, stadium, Łazienki, bridges, stations, and trams.
- [ ] Build Old Town–Royal Route and Palace/modern Wola hero zones, official roof models, riverbanks/bridges, rail/trams, parks, collision, seasonal and night materials.
- [ ] Assert national LoD source coverage, rebuilt-historic geometry, Vistula/bridge topology, and `city:verify --city warsaw`.

## Phase 55 — Copenhagen, Denmark (`copenhagen`)

- [ ] Acquire Danish national/city 3D, LiDAR, terrain and orthophoto sources before Overture/OSM; cover central Copenhagen, harbor, Amager, airport approach, Øresund bridge context, and Frederiksberg.
- [ ] Detail Indre By, Nyhavn, Christianshavn, waterfront, Tivoli; include Christiansborg, Amalienborg, Marble Church, Opera, Black Diamond, Little Mermaid, Rosenborg, towers, harbor baths, Metro, rail, bridges, and wind turbines.
- [ ] Build Nyhavn–royal waterfront and Tivoli/old town hero zones, brick/copper roofs, canals/harbor, cycling/transit, collision, wet and night materials.
- [ ] Assert harbor/canal/bridge topology, cycling route continuity, royal landmark set, and `city:verify --city copenhagen`.

## Phase 56 — Stockholm, Sweden (`stockholm`)

- [ ] Acquire Stockholm/Swedish official 3D/LiDAR/terrain/orthophoto sources before Overture/OSM; cover central archipelago islands, lake/sea water, rail, port, and airport approach corridor.
- [ ] Detail Gamla Stan, Norrmalm, Södermalm, Djurgården, City Hall waterfront; include Royal Palace exterior, City Hall, Riddarholmen Church, Vasa Museum exterior, Globe/Avicii Arena, Kaknäs, bridges, ferries, Metro/rail, and amusement landmarks.
- [ ] Build Gamla Stan–City Hall and Djurgården hero zones, island shorelines/bridges, historic facades/roofs, ferries, vegetation, collision, snow and night materials.
- [ ] Assert island/water topology and bridge clearances, heritage roofline, ferry routes, and `city:verify --city stockholm`.

## Phase 57 — Oslo, Norway (`oslo`)

- [ ] Acquire Oslo/Norwegian official 3D/LiDAR/terrain/orthophoto data before Overture/OSM; cover inner fjord/islands, central city, Holmenkollen, rail, port, and airport corridor.
- [ ] Detail Bjørvika, Kvadraturen, Royal/central, Frogner, Holmenkollen; include Opera House, Munch, Barcode, City Hall, Royal Palace exterior, Akershus, Vigeland park, ski jump, ferries, trams, and bridges.
- [ ] Build Opera/Bjørvika–Akershus and Frogner hero zones, fjord/terrain, waterfront roofs/walkability, ferries/trams, vegetation, collision, snow and night materials.
- [ ] Assert fjord/island/terrain transitions, Opera walkable roof, ski-jump silhouette, and `city:verify --city oslo`.

## Phase 58 — Helsinki, Finland (`helsinki`)

- [ ] Acquire Helsinki CC BY 4.0 textured OBJ/3MX and CityGML LoD1/LoD2 first, plus city terrain/trees/orthophoto and Overture/OSM deltas; cover municipality, islands, harbors, rail, and airport approach.
- [ ] Detail Senate Square, Market/South Harbor, Katajanokka, Töölö, Suomenlinna, Kalasatama; include cathedral, Uspenski, station, Finlandia, Oodi, Olympic stadium/tower, churches, ferries, trams, bridges, and sea fortress.
- [ ] Build Senate–harbor and Suomenlinna hero zones, choose semantic LoD2 over noisy mesh for walking and mesh for aerial where superior, island/sea/ferries, collision, snow and night materials.
- [ ] Assert official model 20 cm-class alignment where applicable, CityGML/mesh handoff, islands/ferries, and `city:verify --city helsinki`.

## Phase 59 — Dublin, Ireland (`dublin`)

- [ ] Acquire Dublin/Irish national open 3D/LiDAR/terrain/orthophoto data before Overture/OSM; cover central city, Liffey, Docklands, bay, port, airport approach, and coastal hills.
- [ ] Detail Georgian core, Temple Bar, Docklands, Trinity, Phoenix Park; include Custom House, GPO, Trinity campanile, Dublin Castle exterior, cathedrals, Convention Centre, Poolbeg chimneys, Samuel Beckett/Ha’penny bridges, rail/Luas, and port.
- [ ] Build Trinity–Temple Bar–Georgian and Docklands hero corridors, brick/Georgian facades, Liffey/bridges, trams/rail, parks, collision, wet and night materials.
- [ ] Assert Georgian block/facade pattern, river bridges, bay/port/rail coverage, and `city:verify --city dublin`.

## Phase 60 — Edinburgh, United Kingdom (`edinburgh`)

- [ ] Acquire Edinburgh/Scottish national LiDAR, terrain, orthophoto and 3D/building sources before Overture/OSM; cover Old/New Town, Arthur’s Seat, Leith, Forth shoreline, rail, and airport approach.
- [ ] Detail Royal Mile, Castle, New Town, Calton Hill, Holyrood, Leith; include castle complex, St Giles, Scott Monument, Balmoral, Parliament exterior, Palace exterior, Forth bridges context, tram, station, and port.
- [ ] Build Castle–Royal Mile–Holyrood and New Town/Calton hero corridors, volcanic terrain, stone facades/roofscape, steep closes, rail/tram, collision, wet and night materials.
- [ ] Assert castle/Arthur’s Seat elevations, UNESCO roofline, Forth/Leith context, and `city:verify --city edinburgh`.

## Phase 61 — Glasgow, United Kingdom (`glasgow`)

- [ ] Acquire Glasgow/Scottish LiDAR, terrain, orthophoto and building sources before Overture/OSM; cover center, West End, Clyde waterfront, shipyards, rail, and airport approach.
- [ ] Detail Merchant City, George Square, West End, Finnieston/Clyde; include City Chambers, cathedral, University, Kelvingrove, Riverside Museum, SEC Armadillo/Hydro, Finnieston Crane, bridges, subway/rail, and shipyard assets.
- [ ] Build George Square–Merchant City and West End/Clyde hero zones, sandstone facades, river/bridges, rail/subway, parks, collision, wet and night materials.
- [ ] Assert Clyde crossing/industrial assets, sandstone facade coverage, rail terminals, and `city:verify --city glasgow`.

## Phase 62 — Manchester, United Kingdom (`manchester`)

- [ ] Acquire Greater Manchester open LiDAR, terrain, orthophoto and building/digital-twin data before Overture/OSM; cover center, Salford/MediaCity, canals, rail, airport approach, and stadium districts.
- [ ] Detail civic/central, Castlefield, Northern Quarter, Deansgate, Salford Quays; include Town Hall current-state metadata, cathedral, Central Library, Beetham/Deansgate towers, Old Trafford/Etihad exteriors, viaducts, canals, stations, and trams.
- [ ] Build civic–Northern Quarter/Castlefield and MediaCity hero zones, red-brick/industrial materials, canals/viaducts, Metrolink/rail, collision, wet and night materials.
- [ ] Assert canal/rail/viaduct topology, construction dates, dual stadium/skyline coverage, and `city:verify --city manchester`.

## Phase 63 — Birmingham, United Kingdom (`birmingham-uk`)

- [ ] Acquire Birmingham/West Midlands LiDAR, terrain, orthophoto and building data before Overture/OSM; cover center, Jewellery Quarter, Digbeth, canals, rail, airport/NEC corridor.
- [ ] Detail Victoria/Chamberlain squares, Bullring, canals, Jewellery Quarter, Digbeth; include Council House, Library, Selfridges exterior, cathedral, Rotunda, station, canal junctions, rail viaducts, trams, and stadium context.
- [ ] Build civic/Bullring and Jewellery Quarter–canal hero zones, brick/industrial facades, waterways, rail/tram, collision, wet and night materials.
- [ ] Assert canal-level/bridge topology, New Street integration, facade landmarks, and `city:verify --city birmingham-uk`.

## Phase 64 — Munich, Germany (`munich`)

- [ ] Acquire Bavarian/Munich official LoD2, LiDAR, terrain and orthophoto data before Overture/OSM; cover center, English Garden, Olympic Park, rail, airport corridor, and Alpine horizon.
- [ ] Detail Altstadt, Maxvorstadt, English Garden, Olympic Park; include Frauenkirche, Neues Rathaus, Residenz, Hofbräuhaus exterior, Nymphenburg, BMW complex, Olympic stadium/tower, Allianz Arena exterior, station, U/S-Bahn, and Isar bridges.
- [ ] Build Marienplatz–Residenz and Olympic Park hero zones, roofscape/heritage facades, Isar, parks, transit, collision, seasonal and night materials.
- [ ] Assert cathedral/Alpine protected sightlines, official LoD coverage, Olympic cable geometry, and `city:verify --city munich`.

## Phase 65 — Frankfurt, Germany (`frankfurt`)

- [ ] Acquire Hesse/Frankfurt official LoD2, LiDAR, terrain and orthophotos before Overture/OSM; cover Innenstadt, banking district, Main river, airport, rail, and nearby urban shell.
- [ ] Detail Römer/old town, Bankenviertel, Museumsufer, station quarter; include cathedral, Römer, Main Tower, Commerzbank Tower, ECB, Messeturm, opera, bridges, Hauptbahnhof, trams, and FRA terminal/approaches.
- [ ] Build Römer–river and banking district hero zones, old/new facade contrast, Main/bridges, rail/trams, airport shell, collision, and night skyline.
- [ ] Assert tower height/silhouette, Main crossings, airport/rail complexity, and `city:verify --city frankfurt`.

## Phase 66 — Hamburg, Germany (`hamburg`)

- [ ] Acquire Hamburg official LoD2/3D, LiDAR, terrain, bathymetry and orthophoto sources before Overture/OSM; cover Elbe/Alster, port, Speicherstadt, rail, airport, and harbor approaches.
- [ ] Detail Altstadt, Speicherstadt/HafenCity, St Pauli, Alster; include Elbphilharmonie, Rathaus, St Michael’s, Chilehaus, Landungsbrücken, port cranes/terminals, Köhlbrand Bridge, tunnels, U/S-Bahn, ferries, and ships.
- [ ] Build Speicherstadt–Elbphilharmonie and Rathaus/Alster hero zones, brick warehouses/canals, tidal Elbe/port routes, bridges/tunnels, collision, wet and night materials.
- [ ] Assert port/water/bridge/tunnel topology, warehouse texture quality, ferry routes, and `city:verify --city hamburg`.

## Phase 67 — Zürich, Switzerland (`zurich`)

- [ ] Acquire Zürich/Swiss official swissBUILDINGS3D, LiDAR, terrain and orthophoto data before Overture/OSM; cover lake head, Limmat, center, Uetliberg, rail, and airport approach.
- [ ] Detail Altstadt, Bahnhofstrasse, university, lakefront, Zürich West; include Grossmünster, Fraumünster, Hauptbahnhof, opera, Kunsthaus exterior, Prime Tower, bridges, trams, boats, and Uetliberg rail.
- [ ] Build Altstadt–lakefront and university hillside hero zones, precise terrain/roof forms, river/lake/boats, trams/rail, collision, seasonal and night materials.
- [ ] Assert Swiss datum/roof accuracy, water levels, tram/bridge continuity, and `city:verify --city zurich`.

## Phase 68 — Geneva, Switzerland (`geneva`)

- [ ] Acquire Geneva/Swiss official 3D buildings, LiDAR, terrain and orthophotos before Overture/OSM; cover lake outlet, Rhône/Arve, international district, airport, and mountain horizon.
- [ ] Detail Old Town, lakefront, Nations, Plainpalais; include Jet d’Eau, St Pierre, Palace of Nations exterior, Broken Chair, flower clock, CERN visitor exterior where extent permits, bridges, trams, boats, and station.
- [ ] Build Old Town–lakefront and Nations hero zones, terrain/roof accuracy, lake/rivers, boats/trams, parks, collision, and night materials.
- [ ] Assert lake/rivers confluence, Jet d’Eau effect budget, Alpine/Jura sightlines, and `city:verify --city geneva`.

## Phase 69 — Milan, Italy (`milan`)

- [ ] Acquire Milan/Lombardy official 3D/LiDAR/terrain/orthophoto data before Overture/OSM; cover historic center, Porta Nuova, CityLife, canals, rail, and airport approaches.
- [ ] Detail Duomo/Galleria, Brera, Porta Nuova, Navigli, CityLife; include cathedral roof/spires, Galleria, castle, La Scala exterior, Bosco Verticale, UniCredit, stadium current state, Central Station, tram lines, and canal locks.
- [ ] Build Duomo–Brera/Castle and Navigli hero zones, ornate facade/roof assets, modern towers, trams/rail, canals, collision, and night materials.
- [ ] Assert Duomo silhouette/detail rights, skyline clusters, canal/transit continuity, and `city:verify --city milan`.

## Phase 70 — Venice, Italy (`venice`)

- [ ] Acquire Venice/Italian official LiDAR, bathymetry, terrain, orthophoto and 3D heritage data before Overture/OSM; cover lagoon islands, historic city, Giudecca, Murano, Lido, causeway, port, and airport approach.
- [ ] Detail San Marco, Rialto, Dorsoduro, Cannaregio, Arsenale; include basilica/campanile, Doge’s Palace, Rialto/Accademia/Constitution bridges, Santa Maria della Salute, station, canals, vaporetto stops, gondolas, and lagoon markers.
- [ ] Build San Marco–Rialto and Dorsoduro hero corridors, individual canals/bridges/facades, tidal water/steps, boat-only routes, collision, weathered/wet and night materials.
- [ ] Assert lagoon/canal network and water levels, pedestrian/boat separation, bridge clearances, heritage assets, and `city:verify --city venice`.

## Phase 71 — Florence, Italy (`florence`)

- [ ] Acquire Florence/Tuscany official LiDAR, terrain, orthophoto and 3D heritage sources before Overture/OSM; cover historic center, Arno, Oltrarno, hills, rail, and airport approach.
- [ ] Detail Duomo, Signoria/Uffizi, Santa Croce, Oltrarno, Piazzale Michelangelo; include cathedral/dome/campanile/baptistery, Palazzo Vecchio, Ponte Vecchio, Santa Maria Novella, Pitti Palace exterior, bridges, station, and gardens.
- [ ] Build Duomo–Signoria–Ponte Vecchio and Oltrarno hero corridors, precise Renaissance landmarks/roofscape, Arno/bridges, hills, collision, and warm/night materials.
- [ ] Assert dome/landmark dimensions, protected roofline/views, river/bridge geometry, and `city:verify --city florence`.

## Phase 72 — Naples, Italy (`naples`)

- [ ] Acquire Naples/Campania official LiDAR, terrain, bathymetry, orthophoto and building sources before Overture/OSM; cover historic center, bay, port, Vomero, Vesuvius/Pompeii context at terrain LoD, rail, and airport.
- [ ] Detail Centro Storico, waterfront, Spanish Quarters, Vomero; include Castel dell’Ovo/Nuovo, Royal Palace exterior, Galleria Umberto, cathedral, San Francesco di Paola, funiculars, station, port/ferries, and stadium context.
- [ ] Build Spaccanapoli and waterfront/castles hero zones, dense balconies/alleys, steep terrain, bay/port/ferry routes, collision, weathered and night materials.
- [ ] Assert Vesuvius/bay skyline, historic alley topology, port/ferry/funicular continuity, and `city:verify --city naples`.

## Phase 73 — Athens, Greece (`athens`)

- [ ] Acquire Greek/Athens terrain, LiDAR/photogrammetry, orthophoto, archaeology and building data before Overture/OSM; cover basin, Acropolis hills, Piraeus/sea, rail, airport corridor, and mountain horizon.
- [ ] Detail Acropolis/Plaka, Monastiraki, Syntagma, Lycabettus, Piraeus; include Parthenon/temples under suitable rights, Agora, stadium, Parliament exterior, National Library trilogy, Stavros Niarchos exterior, port, Metro, and funicular.
- [ ] Build Acropolis–Plaka/Agora and Syntagma–Monastiraki hero zones, archaeological-source review, white urban massing, hills, port/water, transit, collision, heat and night materials.
- [ ] Assert monument authorization/alignment, basin/Acropolis elevations, Piraeus routes, and `city:verify --city athens`.

## Phase 74 — Istanbul, Türkiye (`istanbul`)

- [ ] Acquire Istanbul/Turkish municipal terrain, imagery, 3D/building and bathymetric data before Overture/OSM; cover both continents, Bosphorus/Golden Horn, historic peninsula, airports at shell LoD, and Princes’ Islands context.
- [ ] Detail Sultanahmet, Eminönü, Galata/Beyoğlu, Beşiktaş, Kadıköy; include Hagia Sophia, Blue Mosque, Topkapı exterior, Grand Bazaar massing, Galata Tower, Dolmabahçe exterior, Maiden’s Tower, Bosphorus bridges, ferries, trams, and rail tunnels/portals.
- [ ] Build Sultanahmet–Eminönü and Galata/Beyoğlu hero corridors, domes/minarets/roofscape, steep streets, waterways/bridges/ferries, collision, and night materials.
- [ ] Assert Europe/Asia shore topology, mosque silhouette/heritage review, bridge/ferry/transit continuity, and `city:verify --city istanbul`.

## Phase 75 — Reykjavík, Iceland (`reykjavik`)

- [ ] Acquire Iceland/Reykjavík official 3D/LiDAR, volcanic terrain and orthophoto data before Overture/OSM; cover center, harbor, peninsula, airport, Esja horizon, and geothermal/coastal features.
- [ ] Detail Old Harbour, center, waterfront, Perlan; include Hallgrímskirkja, Harpa, Sun Voyager, Parliament, Perlan, Höfði exterior, lighthouse, pools, port, airport, and coastal paths.
- [ ] Build Hallgrímskirkja–Harpa/harbor and Perlan hero zones, colorful facades/roofs, volcanic terrain/coast, boats, collision, snow/wet and aurora-capable night materials.
- [ ] Assert terrain/coast datum, church skyline, harbor/airport and seasonal exposure, and `city:verify --city reykjavik`.

## Phase 76 — Tallinn, Estonia (`tallinn`)

- [ ] Acquire Tallinn/Estonian official 3D/LiDAR/terrain/orthophoto sources before Overture/OSM; cover walled Old Town, harbor, Kadriorg, Ülemiste/airport, rail, and coast.
- [ ] Detail Toompea/Old Town, Rotermann, waterfront, Kadriorg; include Town Hall, Alexander Nevsky, castle exterior, city walls/towers, St Olaf’s, Kumu exterior, TV Tower, ferry port, trams, and station.
- [ ] Build complete walled Old Town and harbor/Rotermann hero zones, medieval roofs/walls, coast/ferries, tram/rail, collision, snow and night materials.
- [ ] Assert wall/tower continuity, roofline, port/ferry/airport proximity, and `city:verify --city tallinn`.

## Phase 77 — Riga, Latvia (`riga`)

- [ ] Acquire Riga/Latvian official 3D/LiDAR/terrain/orthophoto sources before Overture/OSM; cover Old Town, Art Nouveau district, Daugava, rail, port, and airport approach.
- [ ] Detail Old Riga, Centrs/Alberta Street, Central Market, Ķīpsala; include House of Blackheads, cathedral, St Peter’s, Freedom Monument, National Library, TV Tower, market hangars, bridges, trams, station, and port.
- [ ] Build Old Town–Art Nouveau and river/market hero zones, ornate facades, Daugava/bridges, transit, collision, snow/wet and night materials.
- [ ] Assert Art Nouveau texture/geometry coverage, river/bridge skyline, market/rail continuity, and `city:verify --city riga`.

## Phase 78 — Vilnius, Lithuania (`vilnius`)

- [ ] Acquire Vilnius/Lithuanian official 3D/LiDAR/terrain/orthophoto sources before Overture/OSM; cover Old Town, Neris/Vilnia rivers, hills, modern center, rail, and airport approach.
- [ ] Detail Cathedral/Old Town, Užupis, Gediminas hill, new center; include Cathedral/bell tower, Gediminas Tower, Gates of Dawn, churches, Palace of Grand Dukes exterior, TV Tower, bridges, station, and parks.
- [ ] Build Cathedral–Old Town/Užupis and river/new center hero zones, Baroque facades/roofs, hill terrain, rivers/bridges, collision, snow and night materials.
- [ ] Assert hill/castle and Baroque skyline, river confluence, airport/rail, and `city:verify --city vilnius`.

## Phase 79 — Luxembourg City, Luxembourg (`luxembourg-city`)

- [ ] Acquire Luxembourg national/city official LoD/terrain/LiDAR/orthophoto data before Overture/OSM; cover old fortress, Alzette/Pétrusse valleys, Kirchberg, rail, and airport approach.
- [ ] Detail Ville Haute, Grund, Clausen, Kirchberg; include Grand Ducal Palace exterior, Notre-Dame, Adolphe Bridge, Bock casemates exterior/terrain, fortifications, Philharmonie, EU buildings, station, and funicular/tram.
- [ ] Build fortress–Grund and Kirchberg hero zones, deep valleys/viaducts, walls/bridges, tram/funicular, collision, vegetation, and night materials.
- [ ] Assert valley/bridge/casemate terrain, fortress continuity, transit and skyline, and `city:verify --city luxembourg-city`.

## Phase 80 — Rotterdam, Netherlands (`rotterdam`)

- [ ] Acquire official public-domain Rotterdam 3D CityGML, 3DBAG/AHN/BGT, orthophoto and street-object layers first; cover municipality, Nieuwe Maas, port approaches, rail, and airport.
- [ ] Detail Centrum, Kop van Zuid, Delfshaven, port edge; include Erasmus Bridge, Cube Houses, Markthal, De Rotterdam, Centraal, Euromast, City Hall, Hotel New York exterior, Willemsbrug, water taxis, cranes, and ships.
- [ ] Build Centrum–Erasmus/Kop van Zuid and Delfshaven hero zones, use semantic official buildings/terrain/trees/lights, river/port routes, collision, wet and night materials.
- [ ] Assert official-source/public-domain metadata, river/bridge/port clearance, street-object density, and `city:verify --city rotterdam`.

## Phase 81 — The Hague, Netherlands (`the-hague`)

- [ ] Acquire 3DBAG/AHN/BGT and Hague municipal 3D/orthophoto data first, then Overture/OSM; cover center, Scheveningen coast, international district, rail, and Rotterdam airport context.
- [ ] Detail Binnenhof, central government quarter, Peace Palace, Scheveningen; include Mauritshuis exterior, royal/work palaces exterior, Peace Palace, pier/ferris wheel, Kurhaus, station, trams, dunes, and harbor.
- [ ] Build Binnenhof–Noordeinde and Scheveningen hero zones, Dutch roof/facades, dunes/beach/sea, trams, vegetation, collision, wet and night materials.
- [ ] Assert government-complex current construction metadata, coast/dunes, tram and landmark coverage, and `city:verify --city the-hague`.

## Phase 82 — Antwerp, Belgium (`antwerp`)

- [ ] Acquire Antwerp/Flanders official 3D/LiDAR/terrain/orthophoto data before Overture/OSM; cover historic center, Scheldt, port shell, rail, and airport approach.
- [ ] Detail Grote Markt, cathedral/old center, Eilandje, Zuid, diamond district; include Cathedral of Our Lady, city hall/guildhalls, MAS, Port House, Centraal, Boerentoren current state, tunnels, trams, port cranes/ships, and bridges.
- [ ] Build Grote Markt–cathedral and Eilandje/MAS hero zones, ornate facades/roofs, river/port, rail/tram, collision, wet and night materials.
- [ ] Assert cathedral/market enclosure, Scheldt/port topology, station/Port House landmarks, and `city:verify --city antwerp`.

## Phase 83 — Lyon, France (`lyon`)

- [ ] Acquire IGN BD TOPO/LiDAR and Lyon Métropole open 3D/orthophoto data before Overture/OSM; cover Rhône/Saône confluence, Vieux Lyon/Fourvière, Part-Dieu, rail, and airport corridor.
- [ ] Detail Vieux Lyon, Presqu’île, Fourvière, Croix-Rousse, Confluence; include basilica, cathedral, Roman theatres, Hôtel de Ville, opera, Part-Dieu tower, Musée des Confluences, bridges, funicular, Metro/trams, and station.
- [ ] Build Vieux Lyon–Fourvière and Presqu’île/confluence hero zones, hill terrain/traboule exterior network, both rivers/bridges, transit, collision, and night materials.
- [ ] Assert river confluence, hill/funicular alignment, heritage roofscape and landmark set, and `city:verify --city lyon`.

## Phase 84 — Marseille, France (`marseille`)

- [ ] Acquire IGN BD TOPO/LiDAR and Marseille Métropole 3D/orthophoto/bathymetric data before Overture/OSM; cover Vieux-Port, coastal city, islands/Château d’If, port, Calanques terrain shell, rail, and airport approach.
- [ ] Detail Vieux-Port, Le Panier, Notre-Dame de la Garde, Joliette; include basilica, cathedral, Fort Saint-Jean, MuCEM, Palais Longchamp, Unité exterior where licensed, port cranes/ships, ferries, station, and stadium.
- [ ] Build Vieux-Port–Le Panier and basilica approach hero zones, steep limestone terrain/coast, harbor/islands/ferries, collision, sun-bleached and night materials.
- [ ] Assert coast/island/port topology, basilica hill silhouette, ferry routes and heritage core, and `city:verify --city marseille`.

## Phase 85 — Nice, France (`nice`)

- [ ] Acquire IGN BD TOPO/LiDAR and Nice Métropole open 3D/orthophoto/coast data before Overture/OSM; cover Baie des Anges, old city, hills, airport, port, and Monaco-facing coast shell.
- [ ] Detail Vieux Nice, Promenade des Anglais, Castle Hill, Cimiez, port; include Negresco exterior, cathedral, opera, Masséna, Russian cathedral, airport-on-sea, marinas, tram, station, and hillside villas.
- [ ] Build old city–Promenade and port/Castle Hill hero zones, pebble beach/coastal water, steep terrain, tram, palms, collision, bright and night materials.
- [ ] Assert bay curve/coast/airport, hill elevation, old-city facade color/detail, and `city:verify --city nice`.

## Phase 86 — Bordeaux, France (`bordeaux`)

- [ ] Acquire IGN BD TOPO/LiDAR and Bordeaux Métropole 3D/orthophoto data before Overture/OSM; cover historic center, Garonne crescent, rail, airport approach, and vineyard-edge terrain shell.
- [ ] Detail Golden Triangle, Saint-Pierre, Chartrons, riverfront, station district; include Place de la Bourse/water mirror, cathedral/Pey-Berland, Grand Théâtre, Cité du Vin, stone bridge, Chaban-Delmas bridge, trams, station, and quays.
- [ ] Build historic center–quays and Chartrons/Cité du Vin hero corridors, limestone facades/roofs, river/bridges, trams, collision, wet and night materials.
- [ ] Assert UNESCO facade continuity, Garonne/bridge topology, tram/rail, and `city:verify --city bordeaux`.

## Phase 87 — Seville, Spain (`seville`)

- [ ] Acquire Andalusian/Seville LiDAR, terrain, cadastral/building and orthophoto data before Overture/OSM; cover historic center, Guadalquivir, Triana, Expo/Cartuja, rail, and airport approach.
- [ ] Detail cathedral/Alcázar exterior, Santa Cruz, Plaza de España, Triana, Metropol Parasol; include Giralda, Torre del Oro, bullring exterior, bridges, station, trams, palace/garden exteriors, and riverfront.
- [ ] Build cathedral–Santa Cruz/Alcázar and Plaza de España hero zones, patios/tiles/orange trees, river/bridges, trams, collision, heat and night materials.
- [ ] Assert Giralda/heritage silhouette, shaded lane detail, river/bridge/transit, and `city:verify --city seville`.

## Phase 88 — Valencia, Spain (`valencia`)

- [ ] Acquire Valencia/Spanish LiDAR, terrain, cadastral/building and orthophoto data before Overture/OSM; cover old center, Turia gardens, City of Arts, port/beaches, rail, and airport approach.
- [ ] Detail Ciutat Vella, Turia, City of Arts and Sciences, Cabanyal/port; include cathedral/Micalet, Lonja, Central Market, Serranos towers, modern cultural complex, stadiums, bridges, trams, port, and station.
- [ ] Build old center–Turia and City of Arts hero zones, historic/modern asset sets, dry river park, coast/port, transit, collision, and night materials.
- [ ] Assert Turia continuity/bridges, modern-complex silhouette, coast/rail, and `city:verify --city valencia`.

## Phase 89 — Porto, Portugal (`porto`)

- [ ] Acquire Porto/Portuguese LiDAR, steep terrain, orthophoto and 3D/building data before Overture/OSM; cover Ribeira, Vila Nova de Gaia, Douro, Atlantic mouth, rail, and airport approach.
- [ ] Detail Ribeira, Sé, Clérigos, Aliados, Gaia; include Dom Luís I and Arrábida bridges, cathedral, Clérigos, São Bento, Palácio da Bolsa exterior, Casa da Música, wine lodges, funicular, trams, and boats.
- [ ] Build Ribeira–bridge/Gaia and Clérigos–Aliados hero zones, steep tiled facades/roofs, Douro/bridges/boats, rail/trams, collision, wet and night materials.
- [ ] Assert elevation/bridge deck levels, river/boat routes, tiled facade quality, and `city:verify --city porto`.

## Phase 90 — Dubrovnik, Croatia (`dubrovnik`)

- [ ] Acquire Croatian/Dubrovnik official LiDAR, terrain, orthophoto, bathymetry and heritage model data before Overture/OSM; cover walled city, Lapad/Gruž, nearby islands/coast, port, and airport approach.
- [ ] Detail complete Old Town/walls, Pile/Ploče, Lovrijenac, harbor; include city walls/towers/gates, Rector’s Palace exterior, cathedral, Sponza, Stradun, fortresses, cable car, island ferries, and port.
- [ ] Build entire walled city and Fort Lovrijenac/harbor hero zones, individual limestone roofs/facades, walls/walkways, sea/cliffs/boats, collision, and night materials.
- [ ] Assert wall circuit/gates and walkable ramparts, coast/fort heights, heritage asset review, and `city:verify --city dubrovnik`.

## Phase 91 — Split, Croatia (`split`)

- [ ] Acquire Croatian/Split official LiDAR, terrain, orthophoto and heritage/building data before Overture/OSM; cover old center, Marjan, harbor, coast/islands context, rail, and airport approach.
- [ ] Detail Diocletian’s Palace, Riva, Varoš, Marjan; include palace walls/cellars exterior topology, cathedral/campanile, gates, Gregory statue, stadium, ferries, port, station, and waterfront.
- [ ] Build palace/Old Town and Riva–Marjan hero zones, Roman/medieval fabric, steep alleys, sea/port/ferries, vegetation, collision, and night materials.
- [ ] Assert palace enclosure/gates, campanile silhouette, harbor/ferry routes, and `city:verify --city split`.

## Phase 92 — Ljubljana, Slovenia (`ljubljana`)

- [ ] Acquire Slovenian/Ljubljana official 3D/LiDAR/terrain/orthophoto data before Overture/OSM; cover center, castle hill, Ljubljanica, rail, airport corridor, and Alpine horizon.
- [ ] Detail old center, castle, riverbanks, Tivoli; include castle, Triple/Dragon bridges, cathedral, town hall, National Library exterior, Nebotičnik, market, funicular, station, and riverside architecture.
- [ ] Build castle–old center/river and Tivoli hero zones, hill terrain, bridges/river, Plečnik assets, vegetation, collision, and night materials.
- [ ] Assert castle/funicular elevation, bridge/river topology, architectural landmark set, and `city:verify --city ljubljana`.

## Phase 93 — Zagreb, Croatia (`zagreb`)

- [ ] Acquire Croatian/Zagreb official LiDAR, terrain, orthophoto and 3D/building data before Overture/OSM; cover Upper/Lower Town, Medvednica slope, Sava, rail, and airport approach.
- [ ] Detail Gradec/Kaptol, Lower Town, station parks, Novi Zagreb; include cathedral current-restoration state, St Mark’s, Lotrščak, Croatian National Theatre, Art Pavilion, Mirogoj arcades, funicular, trams, and bridges.
- [ ] Build Upper Town–cathedral and Lower Town green-horseshoe hero zones, hill/stair/funicular, Austro-Hungarian facades, trams, river, collision, and night materials.
- [ ] Assert restoration metadata, hill/rail/tram/river, roof-tile landmark fidelity, and `city:verify --city zagreb`.

## Phase 94 — Belgrade, Serbia (`belgrade`)

- [ ] Acquire Serbian/Belgrade terrain, LiDAR/orthophoto, building and 3D sources before Overture/OSM; cover Danube/Sava confluence, fortress, old/new Belgrade, rail, and airport approach.
- [ ] Detail Kalemegdan, Stari Grad, Skadarlija, New Belgrade, waterfront; include fortress/walls, St Sava, National Assembly, Hotel Moskva exterior, Genex Tower, Avala Tower context, Ada bridge, river islands, trams, and station.
- [ ] Build fortress–Knez Mihailova and Savamala/waterfront hero zones, confluence terrain/water, bridges/trams, mixed facade eras, collision, and night materials.
- [ ] Assert river confluence/islands, fortress walls, bridge/modern skyline, and `city:verify --city belgrade`.

## Phase 95 — Sarajevo, Bosnia and Herzegovina (`sarajevo`)

- [ ] Acquire Bosnian/Sarajevo terrain, LiDAR/orthophoto, building and heritage sources before Overture/OSM; cover valley, Baščaršija, center, hills, airport corridor, and Olympic mountain context.
- [ ] Detail Baščaršija, Austro-Hungarian center, river corridor; include Sebilj, City Hall, Latin Bridge, Sacred Heart cathedral, Gazi Husrev-beg mosque exterior, National Library, cable car, trams, stadium, and hillside neighborhoods.
- [ ] Build Baščaršija–Latin Bridge and central river hero zones, valley/hills, Ottoman/Austro-Hungarian facades, tram/river, collision, snow and night materials.
- [ ] Assert valley terrain/airport approach, bridge/river, multi-era heritage set, and `city:verify --city sarajevo`.

## Phase 96 — Sofia, Bulgaria (`sofia`)

- [ ] Acquire Bulgarian/Sofia official LiDAR, terrain, orthophoto and 3D/building data before Overture/OSM; cover center, Vitosha-facing basin, rail, airport approach, and parks.
- [ ] Detail Largo, cathedral/center, Serdica ruins context, National Palace district; include Alexander Nevsky, Parliament exterior, St George rotunda, National Theatre, Palace of Culture, Banya Bashi exterior, TV tower, Metro portals, trams, and station.
- [ ] Build cathedral–Largo/Serdica and NDK/Vitosha Boulevard hero zones, mountain horizon, archaeological layers, transit, vegetation, collision, and night materials.
- [ ] Assert Vitosha sightline, church/civic landmark set, Metro/tram and archaeological exclusions, and `city:verify --city sofia`.

## Phase 97 — Bucharest, Romania (`bucharest`)

- [ ] Acquire Romanian/Bucharest LiDAR, terrain, orthophoto and 3D/building sources before Overture/OSM; cover center, Dâmbovița, parks/lakes, rail, and airport approach.
- [ ] Detail Old Town, Civic Center, Victory Avenue, Revolution Square, Herăstrău; include Palace of Parliament, Athenaeum, CEC Palace, National Library exterior, Arcul de Triumf, university, station, Metro/trams, and fountains.
- [ ] Build Old Town–Victory and Parliament/Unirii hero zones, Belle Époque/communist-era facades, river, transit, parks, collision, and night materials.
- [ ] Assert Palace scale/view corridors, facade-era coverage, river/Metro/rail, and `city:verify --city bucharest`.

## Phase 98 — Kyiv, Ukraine (`kyiv`)

- [ ] Acquire only lawful, security-reviewed Ukrainian/Kyiv pre-conflict/current open sources and Overture/OSM; exclude sensitive real-time/infrastructure details, record capture date, and cover central districts, Dnipro, hills/islands, rail, and civilian airport shells only when appropriate.
- [ ] Detail Pechersk, Podil, Maidan/Khreshchatyk, Sophia district; include St Sophia, St Michael’s, Golden Gate, Mother Ukraine monument, Mariinsky exterior, Kyiv-Pechersk Lavra exterior where permitted, funicular, Metro bridges, river islands, and station.
- [ ] Build Maidan–historic core and Podil hero zones, hills/funicular, church roofs, Dnipro/islands, collision, seasonal/night materials, with cultural and operational security review.
- [ ] Assert source dates/safety exclusions, terrain/river and heritage alignment; block publication if review fails; run `city:verify --city kyiv`.

## Phase 99 — Saint Petersburg, Russia (`saint-petersburg`)

- [ ] Acquire legally usable, sanctions-compliant open terrain/imagery/building sources and Overture/OSM; cover historic center, Neva/delta/islands, port, rail, and civilian airport shell without sensitive infrastructure.
- [ ] Detail Palace Square, Nevsky, Admiralty, Peter and Paul Fortress, canals; include Hermitage/Winter Palace exterior, St Isaac’s, Church of Savior exterior, Kazan cathedral, Rostral columns, bridges, cruiser exterior only if lawful, Metro/rail, and fountains/parks.
- [ ] Build Palace–Admiralty and canal/fortress hero corridors, ornate facades/roofs, Neva/canals/drawbridges, transit, collision, snow and night materials.
- [ ] Assert sanctions/license compliance, delta/water/bridge topology, protected heritage silhouettes, and `city:verify --city saint-petersburg`.

## Phase 100 — Moscow, Russia (`moscow`)

- [ ] Acquire legally usable, sanctions-compliant open terrain/imagery/building sources and Overture/OSM; cover central Moscow, river, ring structure, rail termini, parks, and civilian airport corridors without sensitive infrastructure.
- [ ] Detail Red Square/Kremlin exterior perimeter, Kitay-gorod, Arbat, Zaryadye, Moscow City; include St Basil’s, GUM, Bolshoi, cathedral, Seven Sisters exemplars, Ostankino silhouette, modern towers, bridges, Metro entrances, stations, and parks.
- [ ] Build Red Square–Zaryadye/river and Arbat hero zones, landmark exteriors under lawful rights, river/bridges, Metro/rail, collision, snow and night materials.
- [ ] Assert sanctions/license/security review, ring/river geometry, heritage and modern skyline sets, and `city:verify --city moscow`.

## Phase 101 — Cape Town, South Africa (`cape-town`)

- [ ] Acquire City of Cape Town LiDAR-derived 3D/footprint layers and redistribution clearance first, then national elevation/orthophoto and Overture/OSM; cover City Bowl, Atlantic Seaboard, Cape Flats shell, Table Mountain peninsula terrain, harbor, and airport approach.
- [ ] Detail CBD/Company’s Garden, Bo-Kaap, V&A Waterfront, Camps Bay, Observatory/Woodstock; include Table Mountain cableway/stations, City Hall, Castle of Good Hope, stadium, Zeitz MOCAA exterior, colorful Bo-Kaap facades, Robben Island context, port cranes, ferries, and beaches.
- [ ] Build City Bowl–Bo-Kaap and V&A Waterfront hero zones, 10 pt/m²-class municipal LiDAR where approved, dramatic mountain/cliff terrain, ocean/harbor, cableway/ferry routes, fynbos, collision, and night materials.
- [ ] Assert Table Mountain/Lion’s Head silhouette, city-to-sea datum, port/shoreline, municipal-source terms, and `city:verify --city cape-town`.

## Phase 102 — Johannesburg, South Africa (`johannesburg`)

- [ ] Acquire Johannesburg/Gauteng municipal LiDAR, imagery, terrain, building and mining-landscape data before Overture/OSM; cover CBD, Sandton, Rosebank, Soweto landmarks, rail, and OR Tambo/Lanseria approaches.
- [ ] Detail CBD/Newtown, Constitution Hill/Braamfontein, Sandton, Soweto; include Carlton Centre, Ponte, Hillbrow Tower, Constitution Court exterior, Nelson Mandela Square, Soccer City, Orlando towers, Gautrain stations, mine dumps, and airport shells.
- [ ] Build Braamfontein–Newtown/CBD and Sandton hero zones, multiple skyline clusters, ridges, rail/transit, dense trees, collision, dry/wet-season and night materials.
- [ ] Assert highveld elevation/ridges, CBD/Sandton/Soweto coverage, transit/airport routes, and `city:verify --city johannesburg`.

## Phase 103 — Durban, South Africa (`durban`)

- [ ] Acquire eThekwini municipal LiDAR/3D, terrain, orthophoto, coast and building sources before Overture/OSM; cover CBD, Golden Mile, harbor/port, Berea, Umhlanga, rail, and airport approach.
- [ ] Detail beachfront, CBD, Point, harbor, Umhlanga; include Moses Mabhida arch/stadium, City Hall, uShaka exterior, convention center, lighthouse, port cranes/ships, promenade/piers, rail, and high-rise beachfront.
- [ ] Build Golden Mile/Point and CBD/harbor hero zones, subtropical coast/dunes, port/bay water, palms, collision, humid haze, and night waterfront.
- [ ] Assert beach/harbor/port topology, stadium arch, coastal tower line, and `city:verify --city durban`.

## Phase 104 — Pretoria, South Africa (`pretoria`)

- [ ] Acquire Tshwane/Gauteng terrain, imagery, LiDAR/building and municipal open data before Overture/OSM; cover CBD, government ridge, university, jacaranda corridors, rail, and airport approaches.
- [ ] Detail Church Square, Union Buildings, Arcadia, university, Freedom Park; include Union Buildings/terraces, Voortrekker Monument, Palace of Justice exterior, City Hall, Freedom Park structures, Loftus, Gautrain, and station.
- [ ] Build Church Square–Union Buildings and Freedom Park hero zones, ridge terrain, jacaranda vegetation, rail/transit, heritage facades, collision, and night materials.
- [ ] Assert ridge/monument sightlines, civic landmark alignment, vegetation/road balance, and `city:verify --city pretoria`.

## Phase 105 — Nairobi, Kenya (`nairobi`)

- [ ] Acquire Nairobi/Kenyan official terrain, imagery, LiDAR/building and open data before Overture/OSM; cover CBD, Westlands/Upper Hill, rail, airport approach, and national park boundary shell.
- [ ] Detail CBD, Kenyatta Avenue, Upper Hill, Westlands, museum district; include KICC, Parliament exterior, City Hall, Kenyatta Mausoleum context, Times Tower, Britam Tower, railway museum/station, expressway, and airport.
- [ ] Build CBD–Upper Hill and Westlands hero zones, plateau terrain, expressway/rail, urban tree canopy, collision, dry/wet and night materials.
- [ ] Assert skyline clusters, airport/expressway/rail geometry, park boundary exclusions, and `city:verify --city nairobi`.

## Phase 106 — Cairo, Egypt (`cairo`)

- [ ] Acquire Egyptian/Cairo official terrain, imagery, building and heritage model sources before Overture/OSM; cover historic/modern Cairo, Nile/islands, Giza pyramid plateau as a separate protected hero area, rail, and airport approaches.
- [ ] Detail Downtown/Tahrir, Islamic Cairo, Coptic Cairo, Zamalek, Giza; include pyramids/Sphinx under approved heritage models, Cairo Tower, Egyptian Museum exterior/current museum metadata, citadel/mosques, Khan el-Khalili streets, Nile bridges, Metro/rail, and felucca routes.
- [ ] Build Tahrir–Nile/Zamalek, Islamic Cairo, and Giza hero zones, desert/urban terrain, heritage review, river/islands/boats, collision, dust-safe and night materials.
- [ ] Assert pyramid geometry/orientation and plateau exclusion rules, Nile/bridge/island topology, minaret skyline, and `city:verify --city cairo`.

## Phase 107 — Alexandria, Egypt (`alexandria-egypt`)

- [ ] Acquire Egyptian/Alexandria terrain, coast, bathymetry, imagery and building sources before Overture/OSM; cover Corniche, Eastern/Western harbors, port, rail, and airport approach.
- [ ] Detail Corniche, historic center, Bibliotheca district, Citadel harbor; include Bibliotheca Alexandrina, Qaitbay Citadel, Montaza Palace exterior, Roman theatre, mosque exteriors, Stanley Bridge, tram/rail, port cranes, beaches, and boats.
- [ ] Build Bibliotheca–citadel waterfront and historic center hero zones, Mediterranean coast/harbors, weathered facades, trams, collision, haze and night materials.
- [ ] Assert Corniche/harbor/port continuity, citadel/library silhouettes, tram alignment, and `city:verify --city alexandria-egypt`.

## Phase 108 — Marrakech, Morocco (`marrakech`)

- [ ] Acquire Moroccan/Marrakech terrain, orthophoto, building and heritage data before Overture/OSM; cover medina/walls, Gueliz, gardens, airport, palm groves, and Atlas horizon.
- [ ] Detail Jemaa el-Fnaa/souks, Kasbah, Mellah, Gueliz; include Koutoubia, city walls/gates, Bahia/El Badi exteriors, Saadian tomb exterior context, Majorelle structures, Menara pavilion, station, and airport.
- [ ] Build medina/souks–square and Koutoubia–Kasbah hero zones, courtyard/roof/street maze, earthen materials, walls/palms, collision, heat/dust and night materials.
- [ ] Assert medina wall/gate/topology, minaret/Atlas sightline, market lane collision, and `city:verify --city marrakech`.

## Phase 109 — Casablanca, Morocco (`casablanca`)

- [ ] Acquire Moroccan/Casablanca terrain, coast, orthophoto, building and port data before Overture/OSM; cover center, Corniche, port, rail, and airport corridor.
- [ ] Detail Art Deco center, medina, Hassan II waterfront, Habous; include Hassan II Mosque exterior, cathedral exterior, Mohammed V Square, Twin Center, lighthouse, Casa-Port/Voyageurs stations, trams, port cranes/ships, and beaches.
- [ ] Build Art Deco center–medina and mosque/Corniche hero zones, coast/port, tram/rail, Moorish/Deco facades, collision, haze and night materials.
- [ ] Assert mosque minaret/coastal foundation, port/rail/tram continuity, facade-era coverage, and `city:verify --city casablanca`.

## Phase 110 — Tunis, Tunisia (`tunis`)

- [ ] Acquire Tunisian/Tunis terrain, imagery, building, coast and heritage data before Overture/OSM; cover medina, Ville Nouvelle, lake, Carthage/Sidi Bou Said context, port, rail, and airport.
- [ ] Detail medina, Avenue Bourguiba, Bardo exterior area, Carthage/Sidi Bou Said; include Zitouna exterior, clock tower, cathedral, Bab el Bhar, Carthage ruins under approved sources, amphitheatre, blue-white streets, light rail, lake/port, and airport.
- [ ] Build medina–avenue and Sidi Bou Said/Carthage hero zones, courtyard facades/alleys, lake/coast, rail, vegetation, collision, heat and night materials.
- [ ] Assert medina gate/network, archaeological review, lake/coast/transit, and `city:verify --city tunis`.

## Phase 111 — Algiers, Algeria (`algiers`)

- [ ] Acquire Algerian/Algiers terrain, coast, imagery, building and heritage sources before Overture/OSM; cover Casbah slopes, waterfront/port, modern center, rail, and airport approach.
- [ ] Detail Casbah, central waterfront, Martyrs’ Memorial ridge, Notre Dame d’Afrique; include Casbah citadel/mosques exteriors, Grande Poste, basilica, memorial, Grand Mosque exterior, port, cable cars, Metro/trams, and rail.
- [ ] Build Casbah–waterfront and memorial ridge hero zones, extreme stair/terrace terrain, white facades, harbor/port, transit/cableways, collision, and night materials.
- [ ] Assert slope/stair collision, Casbah fabric, ridge/harbor sightlines, transit, and `city:verify --city algiers`.

## Phase 112 — Lagos, Nigeria (`lagos`)

- [ ] Acquire Lagos/Nigerian official LiDAR where available, terrain, high-resolution licensed imagery, building and lagoon data before Overture/OSM; cover Lagos/VI/Ikoyi, Lekki, mainland core, lagoon, port, bridges, and airport approach.
- [ ] Detail Marina/Lagos Island, Victoria Island, Ikoyi, Lekki, Yaba; include National Theatre exterior, NECOM, Civic towers, Eko Atlantic current-state skyline, Lekki-Ikoyi bridge, Third Mainland Bridge, ports, markets, rail, and ferry terminals.
- [ ] Build Marina–VI and Lekki/Ikoyi hero zones, lagoon/coast/reclamation, bridges/ferries, dense roads, tropical vegetation, collision, humid haze and night materials.
- [ ] Assert island/lagoon/bridge topology, construction-date metadata, port/ferry/rail, and `city:verify --city lagos`.

## Phase 113 — Abuja, Nigeria (`abuja`)

- [ ] Acquire Nigerian/Abuja terrain, imagery, buildings and planning data before Overture/OSM; cover central business/government districts, Aso Rock terrain, airport corridor, and planned road network.
- [ ] Detail Three Arms Zone public exteriors, Central Area, Wuse, Millennium Park; include National Mosque, National Christian Centre, city gate, National Assembly exterior, Supreme Court exterior, stadium, rail station, and Aso Rock skyline.
- [ ] Build Central Area–park and Wuse hero zones, planned boulevards, inselberg terrain, rail/roads, vegetation, collision, heat and night materials.
- [ ] Assert road-axis/terrain alignment, public/sensitive asset exclusions, landmark set, and `city:verify --city abuja`.

## Phase 114 — Accra, Ghana (`accra`)

- [ ] Acquire Ghana/Accra terrain, coast, imagery, building and municipal data before Overture/OSM; cover central Accra, Osu, airport district, Tema-facing coastal shell, rail, and lagoons.
- [ ] Detail Independence Square, Jamestown, Osu, Airport City; include Independence Arch/Black Star, Kwame Nkrumah memorial, lighthouse, Christiansborg exterior, National Theatre exterior, modern towers, markets, port context, and airport.
- [ ] Build Independence–Osu and Jamestown/coast hero zones, tropical coast/lagoon, colonial/modern facades, roads, collision, humid haze and night materials.
- [ ] Assert coast/lagoons, monument alignment, lighthouse/airport skyline, and `city:verify --city accra`.

## Phase 115 — Dakar, Senegal (`dakar`)

- [ ] Acquire Senegal/Dakar terrain, coast, bathymetry, imagery, building and municipal data before Overture/OSM; cover Cape Verde peninsula, Gorée Island, port, airport-facing corridor, and volcanic coastal features.
- [ ] Detail Plateau, Medina, Corniche, African Renaissance hill, Gorée; include monument, Grand Mosque exterior, railway station, IFAN/museums exteriors, lighthouse, House of Slaves exterior context under heritage review, port, ferries, and beaches.
- [ ] Build Plateau–port and Gorée hero zones, peninsula cliffs/coast, ferry routes, colorful facades, vegetation, collision, dust/haze and night materials.
- [ ] Assert island/ferry/coast topology, monument/lighthouse heights, heritage review, and `city:verify --city dakar`.

## Phase 116 — Addis Ababa, Ethiopia (`addis-ababa`)

- [ ] Acquire Ethiopian/Addis terrain, imagery, building and municipal data before Overture/OSM; cover highland basin, center, AU district, Entoto slopes, light rail, and airport approach.
- [ ] Detail Piazza, Meskel Square, AU district, Entoto; include Holy Trinity/St George exteriors, AU headquarters exterior, National Museum exterior, Unity Park public exterior, Lion of Judah, stadium, light rail, station, and airport.
- [ ] Build Piazza–Meskel and Entoto viewpoint hero zones, high-altitude terrain, mixed-era facades, light rail/roads, eucalyptus vegetation, collision, rainy/dry and night materials.
- [ ] Assert elevation/slope and Entoto skyline, light-rail continuity, civic/religious review, and `city:verify --city addis-ababa`.

## Phase 117 — Kampala, Uganda (`kampala`)

- [ ] Acquire Uganda/Kampala terrain, imagery, building, wetland and municipal data before Overture/OSM; cover central hills, Lake Victoria-facing shell, rail, airport corridor, and wetlands.
- [ ] Detail central business district, Old Kampala, Kololo, Mengo; include Uganda National Mosque exterior, Independence Monument, Kasubi Tombs exterior context, cathedrals, parliament exterior, station, stadium, markets, and hill roads.
- [ ] Build CBD–Old Kampala and Kololo hero zones, seven-hills terrain, wetlands, tropical vegetation, roads/rail, collision, rainy/dry and night materials.
- [ ] Assert hill profiles, wetland preservation, heritage source approval, and `city:verify --city kampala`.

## Phase 118 — Kigali, Rwanda (`kigali`)

- [ ] Acquire Rwanda/Kigali high-resolution terrain, imagery, buildings and municipal planning data before Overture/OSM; cover central hills/valleys, airport corridor, wetlands, and expanding districts.
- [ ] Detail CBD, Kiyovu, Kimihurura, convention district, memorial exterior context; include Convention Centre, Kigali City Tower, Marriott/radial skyline masses where licensed, memorial public exterior, stadium, markets, and airport.
- [ ] Build CBD–convention and Kiyovu hill hero zones, rolling terrain/retaining walls, wetlands, vegetation, roads, collision, wet/dry and night materials.
- [ ] Assert hill/road grades, wetland/urban boundaries, landmark set and construction dates, and `city:verify --city kigali`.

## Phase 119 — Dar es Salaam, Tanzania (`dar-es-salaam`)

- [ ] Acquire Tanzania/Dar official terrain, coast, imagery, building, port and municipal data before Overture/OSM; cover CBD, peninsula, harbor/port, BRT/rail, airport approach, and islands context.
- [ ] Detail Kivukoni/CBD, Kariakoo, Oyster Bay, harbor; include PSPF/tower skyline, Azania/St Joseph exteriors, Askari Monument, National Museum exterior, markets, ferry terminals, port cranes/ships, BRT, and station.
- [ ] Build Kivukoni–harbor and Kariakoo hero zones, Indian Ocean/harbor, ferries/port, tropical facades/vegetation, collision, humid haze and night materials.
- [ ] Assert coast/harbor/ferry topology, port/BRT/rail, skyline, and `city:verify --city dar-es-salaam`.

## Phase 120 — Zanzibar City, Tanzania (`zanzibar-city`)

- [ ] Acquire Zanzibar/Tanzanian terrain, coast, imagery, building and heritage data before Overture/OSM; cover Stone Town, Ng’ambo, harbor, airport approach, reefs, and nearby islets.
- [ ] Detail Stone Town, Forodhani, port, Ng’ambo; include House of Wonders current-state metadata, Old Fort, cathedral/mosque exteriors, palace museum exterior, carved-door streets, ferry terminal, dhows, markets, and beaches.
- [ ] Build complete Stone Town and waterfront hero zones, coral-stone facades/alleys, shallow water/reef/boats, palms, collision, humid/weathered and night materials.
- [ ] Assert UNESCO street-network/landmarks, coastline/reef/ferry, restoration dates, and `city:verify --city zanzibar-city`.

## Phase 121 — Luanda, Angola (`luanda`)

- [ ] Acquire Angolan/Luanda terrain, coast, imagery, building and municipal data before Overture/OSM; cover Baixa, Ilha, bay, port, Talatona shell, airport approaches, and Mussulo context.
- [ ] Detail Marginal/Baixa, Ilha, Miramar, Talatona; include Banco Nacional exterior, Fortaleza de São Miguel, Mausoleum exterior, modern towers, port, stadium, churches, new airport shell, and waterfront.
- [ ] Build Marginal–fortress and Ilha hero zones, bay/coastal sandbar, Portuguese/modern facades, port/roads, collision, haze and night skyline.
- [ ] Assert bay/Ilha topology, fortress/elevation, old/new airport metadata, and `city:verify --city luanda`.

## Phase 122 — Maputo, Mozambique (`maputo`)

- [ ] Acquire Mozambique/Maputo terrain, coast, imagery, building and municipal data before Overture/OSM; cover Baixa, Polana, bay, port, rail, airport, and bridge approach.
- [ ] Detail Baixa, station district, Independence Square, Polana; include railway station, City Hall, cathedral, Iron House, fortress, Samora Machel statue context, Maputo–Katembe Bridge, port cranes/ships, and avenues.
- [ ] Build Baixa–station/port and Polana hero zones, bay/bridge, colonial/modern facades, acacia/palm vegetation, rail, collision, humid and night materials.
- [ ] Assert bridge span/clearance, bay/port/rail topology, architectural landmarks, and `city:verify --city maputo`.

## Phase 123 — Harare, Zimbabwe (`harare`)

- [ ] Acquire Zimbabwe/Harare terrain, imagery, building and municipal data before Overture/OSM; cover CBD, government/park districts, suburbs at shell LoD, rail, and airport approach.
- [ ] Detail CBD, Africa Unity Square, Kopje, Avondale; include Reserve Bank tower, parliament exterior/current relocation metadata, National Gallery exterior, cathedral, Kopje monuments, station, stadium, and jacaranda avenues.
- [ ] Build CBD–Kopje and park/avenue hero zones, plateau terrain, modernist facades, rail/roads, jacaranda vegetation, collision, dry/wet and night materials.
- [ ] Assert skyline/avenue layout, airport/rail, source dates and landmark set, and `city:verify --city harare`.

## Phase 124 — Lusaka, Zambia (`lusaka`)

- [ ] Acquire Zambia/Lusaka terrain, imagery, building and municipal data before Overture/OSM; cover CBD, government district, rail, airport corridor, and expanding urban shell.
- [ ] Detail Cairo Road/CBD, government center, cathedral district; include National Assembly exterior, Freedom Statue, cathedral exteriors, FINDECO House, markets, station, museum exterior, stadium, and airport.
- [ ] Build Cairo Road–civic and market/rail hero zones, plateau terrain, commercial facades, roads/rail, vegetation, collision, dry/wet and night materials.
- [ ] Assert civic/rail axis, airport corridor, market coverage and landmark set, and `city:verify --city lusaka`.

## Phase 125 — Windhoek, Namibia (`windhoek`)

- [ ] Acquire Namibia/Windhoek high-resolution terrain, imagery, building and municipal data before Overture/OSM; cover central basin/hills, airport corridors, rail, and surrounding ridges.
- [ ] Detail center, government district, Klein Windhoek; include Christ Church, Independence Memorial exterior, Tintenpalast exterior, Alte Feste, station, Supreme Court exterior, modern towers, and hilltop landmarks.
- [ ] Build Independence Avenue–historic core and hill viewpoint hero zones, arid mountain terrain, German-colonial/modern facades, rail/roads, sparse vegetation, collision, heat and night materials.
- [ ] Assert basin/ridge elevations, airport/rail, heritage/civic landmarks, and `city:verify --city windhoek`.

## Phase 126 — Gaborone, Botswana (`gaborone`)

- [ ] Acquire Botswana/Gaborone terrain, imagery, building and municipal data before Overture/OSM; cover CBD, government enclave public exteriors, Kgale Hill, rail, airport corridor, and dam context.
- [ ] Detail Main Mall, CBD, Three Dikgosi, government district; include Three Dikgosi monument, National Assembly exterior, High Court exterior, iTowers, stadium, station, airport, and Kgale Hill.
- [ ] Build Main Mall–CBD and Kgale viewpoint hero zones, low-rise urban shell, hill terrain, rail/roads, vegetation, collision, dry-season and night materials.
- [ ] Assert planned-core/monument layout, hill skyline, airport/rail and sensitive exclusions, and `city:verify --city gaborone`.

## Phase 127 — Victoria, Seychelles (`victoria-seychelles`)

- [ ] Acquire Seychelles/Mahé terrain, coast, bathymetry, imagery and building data before Overture/OSM; cover Victoria, harbor, steep Mahé mountains, airport approach, reefs, and nearby islands shell.
- [ ] Detail central Victoria, harbor, Beau Vallon context; include clock tower, cathedral/temple exteriors, market, State House public exterior, stadium, port, airport, marinas, and botanical gardens.
- [ ] Build clock tower–market/harbor and Beau Vallon hero zones, extreme tropical terrain, reefs/shallow water, boats, dense vegetation, collision, humid and night materials.
- [ ] Assert mountain/coast/reef alignment, harbor/airport, vegetation budgets and landmark set, and `city:verify --city victoria-seychelles`.

## Phase 128 — Port Louis, Mauritius (`port-louis`)

- [ ] Acquire Mauritius/Port Louis terrain, coast, bathymetry, imagery and building data before Overture/OSM; cover harbor, central city, Moka mountains, Caudan, port, rail/transit, and airport-facing corridor shell.
- [ ] Detail central market, waterfront/Caudan, government/citadel public exteriors; include Jummah Mosque exterior, St Louis cathedral, Fort Adelaide, Aapravasi Ghat exterior context, bank towers, racecourse, port cranes/ships, and mountains.
- [ ] Build market–waterfront and citadel hero zones, steep mountain/harbor terrain, multicultural facades, boats, vegetation, collision, humid and night materials.
- [ ] Assert harbor/mountain silhouette, fort elevation, heritage-source review, and `city:verify --city port-louis`.

## Phase 129 — Antananarivo, Madagascar (`antananarivo`)

- [ ] Acquire Madagascar/Antananarivo high-resolution terrain, imagery, building, wetland/rice-field and heritage sources before Overture/OSM; cover upper/lower city, ridges, airport corridor, and surrounding plains.
- [ ] Detail Upper City, Analakely, Lake Anosy, railway district; include Rova current-restoration state, Andafiavaratra exterior, cathedral, Independence Avenue, station, memorial, markets, and hillside houses.
- [ ] Build Upper City–Analakely and Lake Anosy hero zones, extreme terraced terrain/stairs, highland facades, wetlands/rice fields, collision, rainy/dry and night materials.
- [ ] Assert ridge/road/stair alignment, Rova restoration metadata, lake/plain terrain, and `city:verify --city antananarivo`.

## Phase 130 — Kinshasa, Democratic Republic of the Congo (`kinshasa`)

- [ ] Acquire lawful DRC/Kinshasa terrain, imagery, building, river and municipal data before Overture/OSM; cover Gombe, central districts, Congo River/islands, rail, and airport corridor without sensitive infrastructure.
- [ ] Detail Gombe, Boulevard du 30 Juin, central market/rail district; include Palais de la Nation public exterior, Palais du Peuple exterior, Limete tower, cathedral, station, stadium, river port, ferries, and opposite-bank Brazzaville shell.
- [ ] Build Gombe–river and central boulevard hero zones, vast river/islands, tropical vegetation, rail/roads/ferries, collision, humid haze and night materials.
- [ ] Assert international river/source separation, islands/port/ferry, public/sensitive exclusions, and `city:verify --city kinshasa`.

## Phase 131 — Dubai, United Arab Emirates (`dubai`)

- [ ] Acquire Dubai municipal/open 3D, terrain, imagery and building data with explicit redistribution rights before Overture/OSM; cover Downtown, Sheikh Zayed corridor, Marina/Palm, Creek, ports, islands, and both airport approaches.
- [ ] Detail Downtown, DIFC, Old Dubai/Creek, Marina, Palm/Jumeirah; include Burj Khalifa, Dubai Mall exterior/fountains, Burj Al Arab, Frame, Museum of the Future, Atlantis exterior where licensed, Cayan Tower, Ain Dubai current state, Metro, airport terminals, abras, and ports.
- [ ] Build Downtown and Creek/Al Fahidi hero zones plus Marina/Palm high detail, supertall LODs, desert/coastal/reclaimed terrain, boats/Metro, collision, heat haze and night emissives.
- [ ] Assert tower height/silhouettes and licensed exteriors, reclaimed-island/coast topology, airport/Metro, exposure and `city:verify --city dubai`.

## Phase 132 — Abu Dhabi, United Arab Emirates (`abu-dhabi`)

- [ ] Acquire Abu Dhabi municipal/open 3D, imagery, bathymetry, building and terrain data with redistribution rights before Overture/OSM; cover island city, Corniche, Saadiyat/Yas, mangroves, airport, and bridges.
- [ ] Detail Corniche/CBD, presidential district public exteriors, Saadiyat, Yas; include Sheikh Zayed Grand Mosque, Louvre Abu Dhabi exterior, Etihad Towers, Qasr Al Watan exterior, Aldar HQ, Capital Gate, Emirates Palace exterior, Yas circuit/hotels where licensed, mangroves, bridges, and airport.
- [ ] Build Corniche/mosque and Louvre/Saadiyat hero zones, islands/mangroves/shallow water, monumental facades, road/bridge network, collision, heat haze and night materials.
- [ ] Assert island/bridge/mangrove topology, dome/mosque geometry, trademark/license review, and `city:verify --city abu-dhabi`.

## Phase 133 — Doha, Qatar (`doha`)

- [ ] Acquire Qatar/Doha official 3D, terrain, imagery, bathymetry and building data with redistribution rights before Overture/OSM; cover Corniche, West Bay, Msheireb/Souq, Pearl/Lusail shell, port, Metro, and airport.
- [ ] Detail Souq Waqif/Msheireb, Corniche, Museum district, West Bay, Katara; include Museum of Islamic Art, National Museum, dhow harbor, Tornado/Doha towers, Sheraton exterior, stadium exemplars, Pearl, Metro stations, and airport.
- [ ] Build Souq–Msheireb and Corniche/museums hero zones, coastal/reclaimed water, traditional/modern facades, dhows/Metro, collision, heat and night materials.
- [ ] Assert coast/reclamation, museum/tower silhouettes, Metro/airport and emissive exposure, and `city:verify --city doha`.

## Phase 134 — Riyadh, Saudi Arabia (`riyadh`)

- [ ] Acquire Saudi/Riyadh official/open terrain, imagery and building data with explicit rights before Overture/OSM; cover central corridors, King Abdullah district, Diriyah public heritage area, airport, and escarpment context without sensitive infrastructure.
- [ ] Detail Olaya, KAFD, historic center, Diriyah; include Kingdom Centre, Al Faisaliah, KAFD towers/Metro, Masmak exterior, National Museum exterior, Diriyah heritage exteriors, stadium, and airport shell.
- [ ] Build Olaya and historic/Diriyah hero zones, desert terrain/wadis, mud-brick/modern facade libraries, Metro/roads, collision, heat/dust and night materials.
- [ ] Assert licensed KAFD/current construction state, heritage review, Metro/road network, and `city:verify --city riyadh`.

## Phase 135 — Jeddah, Saudi Arabia (`jeddah`)

- [ ] Acquire Saudi/Jeddah official/open terrain, coast, imagery and building data with redistribution rights before Overture/OSM; cover Al-Balad, Corniche, port, airport, reefs, and current tower construction sites with dates.
- [ ] Detail Al-Balad, central Corniche, north waterfront; include historic coral houses/gates, King Fahd Fountain, NCB tower, floating mosque exterior, Jeddah Tower current-state metadata, port, airport, waterfront sculptures, and stadium shell.
- [ ] Build Al-Balad and Corniche/fountain hero zones, coral-stone/rawashin facade assets, Red Sea/reef/coast, port/roads, collision, humidity/heat and night materials.
- [ ] Assert heritage facade/topology, fountain effect budget, construction dates, coast/port/airport, and `city:verify --city jeddah`.

## Phase 136 — Jerusalem (`jerusalem`)

- [ ] Acquire legally compatible Israeli/Palestinian municipal/national terrain, imagery, building and heritage sources with neutral provenance; cover Old City, surrounding neighborhoods/hills, rail, and airport-facing corridor while excluding sensitive infrastructure.
- [ ] Detail complete Old City quarters/walls and gates, Mount of Olives, civic center; include Dome of the Rock/Western Wall/Church of Holy Sepulchre exteriors under cultural review, Tower of David, walls/gates, Knesset public exterior, Israel Museum exterior, light rail, and valleys.
- [ ] Build Old City and Jaffa Road–civic hero zones, limestone facade/roof/street maze, hill/valley terrain, transit, collision, restrained night materials, and multi-stakeholder cultural review.
- [ ] Assert neutral naming/source ledger, wall/gate and terrain topology, holy-site asset authorization, and `city:verify --city jerusalem`.

## Phase 137 — Tel Aviv–Yafo (`tel-aviv-jaffa`)

- [ ] Acquire municipal/national terrain, coast, orthophoto, 3D/building and heritage sources with compatible terms before Overture/OSM; cover Tel Aviv, Jaffa, beachfront, Yarkon, rail, port, and airport approach.
- [ ] Detail White City/Rothschild, beachfront, Neve Tzedek, old Jaffa, Sarona; include Azrieli, Shalom tower, Habima, Bauhaus exemplars, Jaffa clock/tower/minaret exteriors, port, promenade, rail/light rail, and airport shell.
- [ ] Build Rothschild/White City and Jaffa hero zones, Bauhaus facade library, coast/Yarkon/port, transit, collision, heat and night materials.
- [ ] Assert White City facade/scale coverage, coastline/Jaffa terrain, rail/light rail, and `city:verify --city tel-aviv-jaffa`.

## Phase 138 — Amman, Jordan (`amman`)

- [ ] Acquire Jordan/Amman high-resolution terrain, imagery, building and heritage sources before Overture/OSM; cover central hills/valleys, Citadel, airport corridor, and expanding western districts.
- [ ] Detail Downtown, Citadel, Rainbow Street, Abdali; include Roman Theatre, Citadel/temple, King Abdullah I Mosque exterior, Abdali towers, Jordan Museum exterior, royal/public civic exteriors only where appropriate, and hill stairways.
- [ ] Build Downtown–Citadel and Rainbow/Abdali hero zones, extreme limestone hill terrain, stairs/retaining walls, roads, collision, heat/dust and night materials.
- [ ] Assert seven-hill profiles, Citadel/theatre alignment, stair/road collision, and `city:verify --city amman`.

## Phase 139 — Beirut, Lebanon (`beirut`)

- [ ] Acquire lawful Lebanese/Beirut terrain, coast, imagery, building and heritage data with current damage/reconstruction dates before Overture/OSM; cover center, Corniche, port public shell, hills, and airport approach without sensitive infrastructure.
- [ ] Detail Downtown, Gemmayzeh/Mar Mikhael, Hamra, Corniche/Raouché; include Pigeon Rocks, Mohammad Al-Amin/St George exteriors, Roman baths context, Martyrs’ Square, museum exteriors, port silos current-state metadata, waterfront towers, and airport.
- [ ] Build Downtown–Gemmayzeh and Corniche hero zones, layered historic/modern/damaged states, coast/cliffs, roads, collision, haze and night materials, with cultural/safety review.
- [ ] Assert capture dates/damage metadata, coastline/Pigeon Rocks, heritage and sensitive exclusions, and `city:verify --city beirut`.

## Phase 140 — Muscat, Oman (`muscat`)

- [ ] Acquire Oman/Muscat official/open high-resolution terrain, coast, imagery and building data before Overture/OSM; cover Old Muscat/Mutrah, mountain corridors, port, airport, and coastal settlements.
- [ ] Detail Mutrah Corniche/souq, Old Muscat, opera district; include Sultan Qaboos Grand Mosque, Royal Opera exterior, Al Alam Palace exterior, Al Jalali/Mirani forts, Mutrah fort, incense burner monument, port/dhows, airport, and mountain roads.
- [ ] Build Mutrah and Old Muscat hero zones, dramatic bare-rock terrain, forts/walls, coast/port/dhows, white facade language, collision, heat and night materials.
- [ ] Assert mountain-road grades, fort/harbor topology, mosque/royal-exterior permissions, and `city:verify --city muscat`.

## Phase 141 — Kuwait City, Kuwait (`kuwait-city`)

- [ ] Acquire Kuwait municipal/national terrain, coast, imagery and building data with redistribution rights before Overture/OSM; cover central waterfront, old market, port, islands shell, airport, and road network.
- [ ] Detail Sharq, old city/Souq, waterfront; include Kuwait Towers, Liberation Tower, Grand Mosque exterior, National Assembly exterior, Al Hamra, Seif Palace public exterior, dhow harbor, scientific center exterior, port, and airport.
- [ ] Build Souq–waterfront and Kuwait Towers hero zones, flat desert/coast, modern/traditional facades, roads/boats, collision, dust/heat and night materials.
- [ ] Assert tower silhouettes, shoreline/harbor, public/sensitive exclusions, and `city:verify --city kuwait-city`.

## Phase 142 — Manama, Bahrain (`manama`)

- [ ] Acquire Bahrain/Manama terrain, bathymetry, imagery and building data with redistribution rights before Overture/OSM; cover Manama, Muharraq, reclaimed islands, causeways, port, and airport.
- [ ] Detail Bab Al Bahrain/souq, Diplomatic Area, waterfront, Muharraq heritage; include Bahrain World Trade Center, Financial Harbour, Grand Mosque exterior, National Museum exterior, fort, pearling-route exteriors, causeways, dhow harbor, and airport.
- [ ] Build souq–financial waterfront and Muharraq hero zones, shallow water/reclamation, traditional/modern facades, bridges/boats, collision, heat and night materials.
- [ ] Assert island/reclamation/causeway topology, tower silhouettes, heritage-route coverage, and `city:verify --city manama`.

## Phase 143 — Tehran, Iran (`tehran`)

- [ ] Acquire lawful Iranian/Tehran terrain, imagery, building and heritage sources with sanctions/export review before Overture/OSM; cover central city, Alborz foothills, rail, airport corridors, and parks without sensitive infrastructure.
- [ ] Detail Grand Bazaar/Golestan exterior, central civic, Valiasr, northern hills; include Azadi Tower, Milad Tower, Tabiat Bridge, Golestan public exterior, National Museum exterior, railway station, Metro entrances, parks, and mountain skyline.
- [ ] Build Azadi–central and Tabiat/park hero zones, steep north-south terrain, mixed facades, Metro/roads, collision, haze and night materials.
- [ ] Assert sanctions/security/source compliance, Alborz silhouette, tower/bridge/Metro geometry, and `city:verify --city tehran`.

## Phase 144 — Baghdad, Iraq (`baghdad`)

- [ ] Acquire lawful Iraqi/Baghdad terrain, imagery, building and heritage sources with security review before Overture/OSM; cover public central districts, Tigris, rail, and civilian airport corridor while excluding sensitive sites.
- [ ] Detail Mutanabbi/old center, riverfront, public monuments; include Mustansiriya exterior, Qushla, Save Iraqi Culture monument, Victory Arch public context if approved, mosque exteriors under cultural review, bridges, station, and river boats.
- [ ] Build old center–Tigris and public cultural district hero zones, river/bridges, courtyard facades, palms, collision, heat/dust and night materials.
- [ ] Assert security exclusions, Tigris/bridge topology, heritage permissions/current-state metadata, and `city:verify --city baghdad`.

## Phase 145 — Mecca, Saudi Arabia (`mecca`)

- [ ] Acquire only officially licensed Saudi/Mecca terrain, imagery and building sources with religious/cultural and security review; cover public city terrain and pilgrimage routes while excluding interiors and restricted/sensitive detail.
- [ ] Detail the public exterior urban fabric around Masjid al-Haram only under explicit authorization, Mina public route context, hills and transport; include Abraj Al Bait silhouette, major public tunnels/roads/rail stations, and pilgrimage infrastructure at approved abstraction.
- [ ] Build authorized public-exterior hero viewpoints, extreme mountain/tunnel terrain, dense crowd-safe collision abstractions, rail/roads, heat/night materials, and mandatory cultural review.
- [ ] Assert written permissions, restricted-area masks, terrain/transport, respectful camera/spawn rules; otherwise keep the city at distant LoD and block hero publication via `city:verify --city mecca`.

## Phase 146 — Tokyo, Japan (`tokyo`)

- [ ] Acquire Japan’s Project PLATEAU CityGML and Tokyo open terrain/orthophoto data first, then Overture/OSM deltas; cover 23 wards at LoD, western centers, rivers/bay/islands, rail, Haneda/Narita corridors, and Mount Fuji horizon.
- [ ] Detail Marunouchi/Ginza, Shibuya, Shinjuku, Asakusa, Odaiba, Akihabara; include Tokyo Tower, Skytree, Station, Imperial Palace public exterior/perimeter, Senso-ji, Meiji shrine public exterior, Shibuya crossing, Metropolitan Government, Rainbow Bridge, stadiums, rail stations/lines, ferries, and airports.
- [ ] Build Shibuya and Marunouchi–Ginza/Station hero zones plus Asakusa, dense signage/facades, rail multi-levels, bay/rivers/bridges, collision, day/rain/night materials, and earthquake-safe metadata versioning.
- [ ] Assert PLATEAU lineage/ward coverage, station/rail topology, signage texture fidelity/exposure, all skyline centers, and `city:verify --city tokyo`.

## Phase 147 — Kyoto, Japan (`kyoto`)

- [ ] Acquire Project PLATEAU/Kyoto official 3D where available, Japanese terrain/orthophoto and heritage sources before Overture/OSM; cover basin, central grid, eastern/western hills, Kamo River, rail, and station approaches.
- [ ] Detail Gion/Higashiyama, station/central, Arashiyama, Fushimi; include Kiyomizu-dera, Yasaka, Kinkaku-ji, Fushimi Inari public exteriors under heritage rights, Kyoto Tower/station, Nijo Castle exterior, bamboo grove, river/bridges, and rail.
- [ ] Build Gion–Higashiyama and Arashiyama hero zones, machiya facade/roof/street assets, temple/shrine review, hills/rivers, rail, vegetation, collision, seasonal and night materials.
- [ ] Assert protected roofline/hill sightlines, heritage permissions, street/river/rail continuity, and `city:verify --city kyoto`.

## Phase 148 — Osaka, Japan (`osaka`)

- [ ] Acquire Project PLATEAU/Osaka official CityGML, Japanese terrain/orthophoto and port data first, then Overture/OSM; cover central wards, bay/port, rivers/canals, rail, and Kansai/Itami approaches.
- [ ] Detail Umeda, Namba/Dotonbori, Osaka Castle park, Shinsekai, bay; include castle exterior, Umeda Sky, Abeno Harukas, Tsutenkaku, Glico-area generic/licensed signage, stations/rail loops, bridges/canals, port wheel, stadium, and airports.
- [ ] Build Dotonbori/Namba and Umeda hero zones, dense signage/facades, multi-level rail/roads, canals/bridges, collision, rain and night materials.
- [ ] Assert PLATEAU coverage, rail/station topology, canal/reflection/signage quality, and `city:verify --city osaka`.

## Phase 149 — Seoul, South Korea (`seoul`)

- [ ] Acquire Seoul open digital-twin/3D, national terrain, orthophoto and building data before Overture/OSM; cover all districts at shell LoD, Han River, mountains, rail, and Gimpo/Incheon corridors.
- [ ] Detail Jongno/palaces, Myeongdong, Gangnam, Hongdae, Yeouido, Dongdaemun; include Gyeongbokgung public exterior, city gates, N Seoul Tower, Lotte World Tower, DDP, 63 Building, stadiums, Han bridges, subway/rail stations, and Cheonggyecheon.
- [ ] Build palace–Jongno/Myeongdong and Gangnam hero zones, dense signage, mountains/river/stream, transit multi-levels, collision, seasonal/rain/night materials.
- [ ] Assert district/river/bridge coverage, palace-wall and supertall silhouettes, subway/station density, and `city:verify --city seoul`.

## Phase 150 — Busan, South Korea (`busan`)

- [ ] Acquire Busan/Korean open 3D, terrain, orthophoto, coast and building data before Overture/OSM; cover port/bay, central districts, Haeundae, mountain ridges, rail, and airport approach.
- [ ] Detail Nampo/Jagalchi, Gamcheon, Haeundae, Centum, Gwangalli; include Busan Tower, Jagalchi, Gamcheon terraces, LCT towers, Cinema Center exterior, Gwangandaegyo, port cranes/ships, beaches, cable car, station, and Metro.
- [ ] Build Nampo–Gamcheon and Haeundae/Gwangalli hero zones, extreme coast/mountain terrain, bridge/port/boats, colorful terraces, collision, fog/rain and night materials.
- [ ] Assert ridge/coast/port geometry, bridge clearance/lighting, Metro and skyline clusters, and `city:verify --city busan`.

## Phase 151 — Beijing, China (`beijing`)

- [ ] Acquire only lawfully exportable Chinese/Beijing official terrain, imagery and 3D/building sources with coordinate-system and data-security review before Overture/OSM; cover central rings, public heritage areas, rail, airport corridors, and mountain context without sensitive detail.
- [ ] Detail central axis/public exteriors, hutong sample areas, CBD, Olympic Park; include Forbidden City/Tiananmen public exteriors under approved sources, Temple of Heaven, Drum/Bell towers, CCTV HQ, China Zun, Olympic stadium/aquatics exteriors, rail stations, and airport shells.
- [ ] Build authorized central-axis/hutong and Olympic hero zones, courtyard/roof assets, ring roads/subway, parks, collision, haze and night materials, preserving GCJ/WGS transform provenance.
- [ ] Assert export/security/license review, coordinate transform control points, central axis/CBD/Olympic silhouettes, and `city:verify --city beijing`.

## Phase 152 — Shanghai, China (`shanghai`)

- [ ] Acquire lawfully exportable Shanghai/Chinese terrain, imagery, 3D/building and river/port sources with security review before Overture/OSM; cover Puxi/Pudong, Huangpu/Suzhou Creek, rail, port shell, and airport corridors.
- [ ] Detail Bund, Lujiazui, French Concession sample, People’s Square, Xintiandi; include Shanghai/World Financial/Jin Mao towers, Oriental Pearl, Bund facades, Shanghai Museum exterior, station, bridges, ferries, and airport shells.
- [ ] Build Bund–Lujiazui cross-river and French Concession hero zones, supertall LODs, historic facades, river/ferries/bridges, Metro, collision, haze/rain and night materials.
- [ ] Assert coordinate/source compliance, tower height/silhouettes, Bund facade continuity, river/transit, and `city:verify --city shanghai`.

## Phase 153 — Hong Kong (`hong-kong`)

- [ ] Acquire Hong Kong Lands Department/open 3D, terrain, orthophoto, building, coastline and bathymetric data with current terms before Overture/OSM; cover Hong Kong Island, Kowloon, key New Territories shell, harbor/islands, rail, and airport approaches.
- [ ] Detail Central/Admiralty, Tsim Sha Tsui, Mong Kok, Victoria Peak, West Kowloon; include IFC/ICC, Bank of China, HSBC exterior, Convention Centre, Peak Tower, Star Ferry piers, Clock Tower, skyline towers, tram/MTR stations, bridges/tunnels, airport, and harbor craft.
- [ ] Build Central–Peak and Tsim Sha Tsui/Mong Kok hero zones, extreme terrain/density, tower/facade/signage LODs, harbor/ferries, tram/MTR, collision, humid haze/rain and night materials.
- [ ] Assert terrain/building grounding, cross-harbor skyline/ferry/tunnel topology, signage/exposure, and `city:verify --city hong-kong`.

## Phase 154 — Macau (`macau`)

- [ ] Acquire Macau official terrain, imagery, building, coastline/reclamation and heritage sources with explicit rights before Overture/OSM; cover peninsula, Taipa/Cotai/Coloane, bridges, ferry terminals, and airport.
- [ ] Detail Historic Centre, waterfront, Taipa Village, Cotai; include Ruins of St Paul’s, Senado Square, Guia fortress/lighthouse, Macau Tower, public exteriors of resorts only when licensed, bridges, ferry terminals, and airport.
- [ ] Build Historic Centre and Taipa/Cotai hero zones, Portuguese/Chinese facade assets, hills/reclaimed coast, bridge/ferry routes, collision, humid and night materials.
- [ ] Assert heritage street/facade set, reclamation/bridge topology, resort trademark/license review, and `city:verify --city macau`.

## Phase 155 — Taipei, Taiwan (`taipei`)

- [ ] Acquire Taiwan/Taipei official 3D, LiDAR, terrain, orthophoto and building data before Overture/OSM; cover basin, rivers, mountains, rail, Songshan/Taoyuan corridors, and hot-spring northern shell.
- [ ] Detail Xinyi, Zhongzheng, Dadaocheng, Ximending, Beitou; include Taipei 101, Chiang Kai-shek Memorial public exterior, Presidential Office public exterior, Longshan Temple exterior, Grand Hotel exterior, station, MRT, Maokong gondola, bridges, and airports.
- [ ] Build Xinyi and old-city/Dadaocheng hero zones, dense arcades/signage, basin/mountain/river terrain, MRT/rail, collision, typhoon-rain and night materials.
- [ ] Assert basin/river/terrain, 101 silhouette, arcade collision, transit/airport and source naming, and `city:verify --city taipei`.

## Phase 156 — Singapore (`singapore`)

- [ ] Acquire Singapore SLA/URA/OneMap/open 3D, terrain, imagery and building data only where redistribution is explicit, then Overture/OSM; cover the whole island at shell LoD, central region at LoD2, southern islands, port, reservoirs, MRT, and airport.
- [ ] Detail Civic District/Marina Bay, Chinatown, Kampong Glam, Orchard, Gardens, Sentosa; include Marina Bay Sands exterior where licensed, Merlion, Supertrees, ArtScience exterior, Esplanade, Fullerton, Raffles exterior, shophouses, Jewel exterior where licensed, port, MRT, cable car, and airport.
- [ ] Build Marina/Civic and Chinatown–Kampong Glam hero zones, tropical high-density facade/vegetation system, bay/reservoirs, MRT/roads, collision, rain and night materials.
- [ ] Assert whole-island coverage, bay/reclamation, vegetation/thermal budgets, landmark licenses, MRT/airport, and `city:verify --city singapore`.

## Phase 157 — Bangkok, Thailand (`bangkok`)

- [ ] Acquire Thai/Bangkok terrain, imagery, building, canal and municipal data before Overture/OSM; cover central districts, Chao Phraya, khlongs, rail, port shell, and both airport corridors.
- [ ] Detail Rattanakosin, Chinatown, Silom/Sathorn, Sukhumvit, Siam; include Grand Palace/Wat exteriors under cultural rights, Giant Swing, Democracy Monument, MahaNakhon, Baiyoke, Iconsiam exterior where licensed, rail stations, Skytrain/MRT, bridges, canals, and boats.
- [ ] Build Rattanakosin–river and Siam/Sukhumvit hero zones, temple roofs/signage, river/canal/boat network, elevated rail, tropical vegetation, collision, monsoon and night materials.
- [ ] Assert temple/cultural review, canal/river topology, elevated transit, tower/signage quality, and `city:verify --city bangkok`.

## Phase 158 — Kuala Lumpur, Malaysia (`kuala-lumpur`)

- [ ] Acquire Malaysia/Kuala Lumpur official 3D, terrain, imagery and building data before Overture/OSM; cover central valley, Putrajaya shell where extent permits, rail, airport corridor, and limestone hill context.
- [ ] Detail KLCC, Bukit Bintang, Merdeka Square, Chinatown, Brickfields; include Petronas Towers, Merdeka 118, KL Tower, Sultan Abdul Samad, National Mosque exterior, station, Batu Caves context, monorail/MRT, and airport shell.
- [ ] Build KLCC–Bukit Bintang and Merdeka/Chinatown hero zones, supertall LODs, tropical facades/vegetation, river renewal, rail, collision, rain/haze and night materials.
- [ ] Assert tower heights/silhouettes, transit layers, valley terrain and heritage facade set, and `city:verify --city kuala-lumpur`.

## Phase 159 — Jakarta, Indonesia (`jakarta`)

- [ ] Acquire Indonesian/Jakarta official terrain, imagery, LiDAR/building, canal/coast and subsidence data before Overture/OSM; cover central districts, old port, bay/reclamation, rail, and airport corridors.
- [ ] Detail Monas/Merdeka, Kota Tua, Bundaran HI, Sudirman, Glodok; include Monas, Istiqlal/cathedral exteriors, National Museum exterior, Hotel Indonesia roundabout, BNI/skyscrapers, station, TransJakarta/MRT/LRT, canals, port, and airport shell.
- [ ] Build Kota Tua and Monas–Sudirman hero corridors, dense facades, canals/flood infrastructure/coast, multi-modal transit, collision, monsoon/haze and night materials.
- [ ] Assert subsidence/date metadata, canal/coast topology, transit and monument/skyline coverage, and `city:verify --city jakarta`.

## Phase 160 — Denpasar and South Bali, Indonesia (`denpasar-bali`)

- [ ] Acquire Bali/Indonesian terrain, imagery, building, coast/reef and cultural-site data before Overture/OSM; cover Denpasar, Sanur, Kuta/Seminyak, airport, Nusa Dua, and visible volcanic terrain shell.
- [ ] Detail Denpasar civic/market areas, Sanur, Kuta, Uluwatu context; include Bajra Sandhi, Puputan Square, temple/gate exteriors under cultural review, airport-on-coast, beaches, reefs, resorts only where licensed, and watercraft.
- [ ] Build Denpasar market/civic and Sanur/Kuta coastal hero zones, Balinese roof/wall/gate libraries, rice/volcanic terrain, reefs/ocean, scooters/roads, collision, humid and night materials.
- [ ] Assert cultural-site permissions, coast/reef/airport, volcanic sightline and facade authenticity, and `city:verify --city denpasar-bali`.

## Phase 161 — Manila, Philippines (`manila`)

- [ ] Acquire Philippine/Metro Manila terrain, imagery, LiDAR/building, river/coast and municipal data before Overture/OSM; cover Manila, Makati, BGC, Quezon shell, Pasig River, bay, port, rail, and airport.
- [ ] Detail Intramuros, Rizal Park, Binondo, Makati, BGC; include walls/fort, Manila Cathedral/San Agustin exteriors, Rizal Monument, City Hall, skyscraper clusters, bridges, jeepney-route abstraction, LRT/MRT, port, and airport.
- [ ] Build Intramuros–Rizal and Makati/BGC hero zones, Spanish/modern facades, bay/river/flood layers, transit, tropical vegetation, collision, monsoon and night materials.
- [ ] Assert metro skyline clusters, Intramuros wall topology, river/bay/port, transit/airport and flood datum, and `city:verify --city manila`.

## Phase 162 — Ho Chi Minh City, Vietnam (`ho-chi-minh-city`)

- [ ] Acquire Vietnamese/HCMC terrain, imagery, building, river/canal and municipal data before Overture/OSM; cover Districts 1/3/4, Thu Duc shell, Saigon River, port, Metro, and airport corridor.
- [ ] Detail District 1, Cholon sample, riverfront, Thu Thiem; include City Hall, Central Post Office, cathedral current-restoration state, Independence Palace exterior, Landmark 81, Bitexco, Ben Thanh, opera, bridges, Metro stations, and river boats.
- [ ] Build District 1–river and Cholon hero zones, colonial/shophouse/high-rise facade sets, river/canals, Metro/roads, collision, monsoon and night materials.
- [ ] Assert river/bridge/Metro topology, landmark dates, street-level density/signage, and `city:verify --city ho-chi-minh-city`.

## Phase 163 — Hanoi, Vietnam (`hanoi`)

- [ ] Acquire Vietnamese/Hanoi terrain, imagery, building, lake/river and municipal data before Overture/OSM; cover Old Quarter, French Quarter, West Lake, Red River, rail, and airport corridor.
- [ ] Detail Old Quarter, Hoàn Kiếm, Ba Đình public areas, French Quarter, West Lake; include Temple of Literature, opera, St Joseph’s exterior, One Pillar Pagoda exterior, Ho Chi Minh Mausoleum public exterior under review, Long Biên Bridge, station, and lakes.
- [ ] Build Old Quarter–Hoàn Kiếm and French Quarter hero zones, narrow shophouse facades/signage, lakes/river/bridge, rail/roads, collision, humid haze and night materials.
- [ ] Assert Old Quarter block/roof density, lake/river topology, bridge/rail and cultural review, and `city:verify --city hanoi`.

## Phase 164 — Phnom Penh, Cambodia (`phnom-penh`)

- [ ] Acquire Cambodian/Phnom Penh terrain, imagery, building and Mekong/Tonlé Sap data before Overture/OSM; cover river confluence, center, rail, port, and airport corridor.
- [ ] Detail riverfront, Royal Palace public exterior, central market, French Quarter; include palace/silver-pagoda exteriors under cultural review, Independence Monument, Central Market, Wat Phnom exterior, National Museum exterior, stadium, bridges, ferries, station, and port.
- [ ] Build riverfront–palace/market and Wat Phnom hero zones, colonial/Khmer facade assets, confluence/water traffic, roads, collision, monsoon and night materials.
- [ ] Assert three-river confluence, monument/palace permissions, market/port/bridge topology, and `city:verify --city phnom-penh`.

## Phase 165 — Yangon, Myanmar (`yangon`)

- [ ] Acquire lawful Myanmar/Yangon terrain, imagery, building, river and heritage data with sanctions/security review before Overture/OSM; cover central public areas, river/port shell, rail circle, lakes, and airport corridor without sensitive sites.
- [ ] Detail downtown grid, Kandawgyi, Shwedagon public exterior, riverfront; include Shwedagon exterior under cultural rights, Sule exterior, City Hall, Secretariat public exterior where approved, colonial facades, station, circular rail, port, and lake landmarks.
- [ ] Build downtown–river and Kandawgyi/Shwedagon hero zones, colonial facade library, pagoda skyline, river/lakes, rail, collision, monsoon and night materials.
- [ ] Assert sanctions/security and cultural review, grid/facade coverage, river/rail/lake, and `city:verify --city yangon`.

## Phase 166 — Vientiane, Laos (`vientiane`)

- [ ] Acquire Laos/Vientiane terrain, imagery, building and Mekong data before Overture/OSM; cover central city, riverfront, wetlands, rail/airport corridors, and Thai-bank shell.
- [ ] Detail central temples/public exteriors, Patuxai, riverfront, That Luang; include Patuxai, Pha That Luang exterior, Wat Si Saket exterior, Presidential Palace public exterior, markets, station/rail, airport, Mekong promenade, and bridges context.
- [ ] Build Patuxai–That Luang and riverfront hero zones, low-rise temple/colonial facade assets, Mekong/wetlands, rail/roads, collision, monsoon and night materials.
- [ ] Assert cultural permissions, Mekong/international boundary, rail/airport and landmark set, and `city:verify --city vientiane`.

## Phase 167 — Kathmandu, Nepal (`kathmandu`)

- [ ] Acquire Nepal/Kathmandu high-resolution terrain, imagery, building, heritage and earthquake-reconstruction data before Overture/OSM; cover valley core, Kathmandu/Patan/Bhaktapur at appropriate LoD, airport, and Himalayan horizon.
- [ ] Detail Kathmandu Durbar/Thamel, Patan Durbar, Swayambhu/Boudha public exteriors; include approved temple/stupa/palace exteriors with reconstruction dates, Dharahara current state, Narayanhiti exterior, airport, ring roads, and hill viewpoints.
- [ ] Build Kathmandu/Thamel and Patan hero zones, carved brick/timber facade/roof library, dense alleys/courtyards, valley/hills, collision, monsoon/dust and night materials.
- [ ] Assert heritage permissions/reconstruction versions, valley terrain/Himalayan view, temple geometry and airport, and `city:verify --city kathmandu`.

## Phase 168 — Delhi, India (`delhi`)

- [ ] Acquire Indian/Delhi official terrain, imagery, building, monument and municipal data with security review before Overture/OSM; cover Old/New Delhi, central NCR shell, Yamuna, Metro/rail, and airport corridor without sensitive infrastructure.
- [ ] Detail Shahjahanabad, Central Vista public exteriors, Connaught Place, Mehrauli; include India Gate, Red Fort/Qutub/Humayun’s Tomb exteriors under heritage rights, Jama Masjid exterior, Lotus Temple exterior, Parliament/Rashtrapati public exteriors as permitted, stations, Metro, and airport.
- [ ] Build Old Delhi and Connaught/Central Vista hero zones, Mughal/colonial/modern facade sets, Yamuna, Metro/rail, collision, monsoon/smog and night materials.
- [ ] Assert heritage/security permissions, radial/old-city topology, monument alignment, Metro/airport, and `city:verify --city delhi`.

## Phase 169 — Mumbai, India (`mumbai`)

- [ ] Acquire Maharashtra/Mumbai official terrain, imagery, building, coastline/creek and municipal data before Overture/OSM; cover island city, western/eastern suburbs shell, harbor, rail, port, and airport.
- [ ] Detail Fort/Colaba, Marine Drive, CSMT, Worli/Bandra, Dharavi at respectful LoD; include Gateway, Taj exterior where licensed, CSMT, High Court/university exteriors, Sea Link, Antilia exterior where lawful, towers, stadium, local rail/Metro, ferries, and port.
- [ ] Build Fort–Colaba/Marine Drive and Bandra–Worli hero zones, Gothic/Art Deco facade sets, coast/creeks/harbor, rail density, collision, monsoon and night materials.
- [ ] Assert peninsula/coast/rail topology, UNESCO facade/landmark set, Sea Link clearance, and `city:verify --city mumbai`.

## Phase 170 — Bengaluru, India (`bengaluru`)

- [ ] Acquire Karnataka/Bengaluru terrain, imagery, building, lake and municipal data before Overture/OSM; cover central city, technology corridors at shell LoD, lakes, Metro, rail, and airport corridor.
- [ ] Detail MG Road/Cubbon, Vidhana Soudha public exterior, market/palace exterior area, Whitefield/Electronic City exemplars; include Vidhana Soudha, Bangalore Palace exterior, High Court exterior, UB Tower, stadium, Bull Temple exterior, Metro viaducts/stations, lakes, and airport.
- [ ] Build MG Road–Cubbon and market heritage hero zones, tree-canopy city materials, lakes/drainage, Metro/roads, collision, monsoon and night materials.
- [ ] Assert lake/topography, tree/render budgets, Metro/tech-corridor/airport, civic landmark set, and `city:verify --city bengaluru`.

## Phase 171 — Kolkata, India (`kolkata`)

- [ ] Acquire West Bengal/Kolkata terrain, imagery, building, Hooghly/wetland and municipal data before Overture/OSM; cover central city, Howrah, river, rail, port shell, and airport approach.
- [ ] Detail BBD Bagh, Maidan, Park Street, North Kolkata sample, Howrah; include Victoria Memorial, Howrah Bridge, Writers’/High Court exteriors, Indian Museum exterior, St Paul’s, Shaheed Minar, station, trams/Metro, river ferries, and stadium.
- [ ] Build BBD Bagh–Maidan/Park Street and North Kolkata hero zones, colonial/bazaar facades, Hooghly/bridges/ferries, trams/rail, collision, monsoon and night materials.
- [ ] Assert bridge/station/river topology, tram continuity, heritage facade set, and `city:verify --city kolkata`.

## Phase 172 — Chennai, India (`chennai`)

- [ ] Acquire Tamil Nadu/Chennai terrain, coast, imagery, building, river/wetland and municipal data before Overture/OSM; cover center, Marina, port, rail, airport, and IT corridor shell.
- [ ] Detail Fort/George Town, Marina, Mylapore, Egmore, Central; include High Court exterior, Central/Egmore stations, Ripon Building, Kapaleeshwarar/Santhome exteriors under cultural rights, lighthouse, stadium, Metro, port, and airport.
- [ ] Build George Town–Central and Marina/Mylapore hero zones, Indo-Saracenic/temple facade sets, coast/rivers/wetlands, rail/Metro, collision, monsoon and night materials.
- [ ] Assert coastline/port/floodplain, station/rail/Metro topology, cultural landmark review, and `city:verify --city chennai`.

## Phase 173 — Hyderabad, India (`hyderabad-india`)

- [ ] Acquire Telangana/Hyderabad terrain, imagery, building, lake and municipal data before Overture/OSM; cover old city, central lake, HITEC City shell, Metro, rail, and airport corridor.
- [ ] Detail Charminar/old city, Hussain Sagar, Abids, HITEC; include Charminar, Mecca Masjid/Chowmahalla/Golconda exteriors under heritage rights, Buddha statue, Secretariat public exterior, Cyber Towers, stadium, Metro, station, and lakefront.
- [ ] Build Charminar–old city and Hussain Sagar hero zones, Deccani facade/market assets, granite terrain/lakes, elevated Metro, collision, monsoon/heat and night materials.
- [ ] Assert heritage permissions, lake/terrain/Metro, old/new skyline and market topology, and `city:verify --city hyderabad-india`.

## Phase 174 — Jaipur, India (`jaipur`)

- [ ] Acquire Rajasthan/Jaipur terrain, imagery, building, heritage and municipal data before Overture/OSM; cover walled Pink City, hills/forts, rail, and airport approach.
- [ ] Detail City Palace public exterior, Hawa Mahal, bazaars, Jantar Mantar, Amber/Jaigarh/Nahargarh contexts; include gates/walls, Albert Hall exterior, Jal Mahal exterior, forts, station, and hill roads.
- [ ] Build complete Pink City core and Amber approach hero zones, pink sandstone facade/arcade assets, walls/gates, arid hills/lake, collision, heat and night materials.
- [ ] Assert grid/wall/gate completeness, heritage permissions, fort/hill/lake elevations, and `city:verify --city jaipur`.

## Phase 175 — Agra, India (`agra`)

- [ ] Acquire Indian/UP terrain, imagery, building, Yamuna and protected-monument sources before Overture/OSM; cover Taj/fort public areas, old city shell, river, rail, and airport approach.
- [ ] Detail Taj Mahal public exterior complex, Agra Fort, riverfront gardens, old market approach; include Itmad-ud-Daulah exterior, Mehtab Bagh, gateways, walls, station, bridges, and riverfront under archaeological rules.
- [ ] Build Taj–river/Mehtab and Fort hero zones only with approved survey/heritage assets, precise symmetry/water gardens, river/terrain, collision boundaries, haze and day/night materials.
- [ ] Assert written monument/source permission, Taj geometry/axis/reflection, river/fort placement, restricted camera rules, and `city:verify --city agra`.

## Phase 176 — Dhaka, Bangladesh (`dhaka`)

- [ ] Acquire Bangladesh/Dhaka terrain, imagery, building, river/canal/wetland and municipal data before Overture/OSM; cover old/central/new city, Buriganga, rail, airport, and floodplain shell.
- [ ] Detail Old Dhaka, Motijheel, Shahbagh, parliament district public exteriors; include Jatiya Sangsad exterior under architectural rights, Ahsan Manzil exterior, Lalbagh Fort, Shaheed Minar, Curzon Hall exterior, station, river port/launches, Metro, and airport.
- [ ] Build Old Dhaka–river and Shahbagh hero zones, dense market/facade assets, floodplain/water, Metro/rail/boats, collision, monsoon and night materials.
- [ ] Assert flood/river/canal topology, density/performance, Metro/rail/port and landmark set, and `city:verify --city dhaka`.

## Phase 177 — Colombo, Sri Lanka (`colombo`)

- [ ] Acquire Sri Lankan/Colombo terrain, coast, imagery, building, port and wetland data before Overture/OSM; cover Fort/Pettah, waterfront, port city current state, rail, airport corridor, and lake.
- [ ] Detail Fort, Pettah, Galle Face, Cinnamon Gardens; include Lotus Tower, old Parliament exterior, Town Hall, Independence Memorial, station, port cranes/ships, Port City dated geometry, temples/churches exteriors, rail, and coast.
- [ ] Build Fort–Pettah/Galle Face and civic-gardens hero zones, colonial/market/modern facades, coast/lake/wetlands, rail, collision, monsoon and night materials.
- [ ] Assert reclamation/version metadata, port/coast/rail topology, tower/heritage landmarks, and `city:verify --city colombo`.

## Phase 178 — Malé, Maldives (`male-maldives`)

- [ ] Acquire Maldives/Malé high-resolution coast, bathymetry, imagery and building data before Overture/OSM; cover Malé, Hulhumalé, airport island, bridges, reefs, harbor and ferries.
- [ ] Detail central Malé, waterfront, fish market/harbor, Hulhumalé; include Grand Friday Mosque exterior, Mulee Aage public exterior, memorials, stadium, Sinamalé Bridge, airport, ferry terminals, seawalls, and dense rooftops.
- [ ] Build central harbor and Malé–airport bridge hero zones, exact island/seawall elevation, reef/shallow-water classes, boats/ferries, dense collision, humid and night materials.
- [ ] Assert island/reclamation/reef topology, sea-level datum, bridge/airport/ferry routes, and `city:verify --city male-maldives`.

## Phase 179 — Karachi, Pakistan (`karachi`)

- [ ] Acquire Pakistan/Karachi terrain, coast, imagery, building, port and municipal data with security review before Overture/OSM; cover central/southern districts, coastline, both ports at public shell LoD, rail, and airport corridor.
- [ ] Detail Saddar, Clifton, old city, waterfront; include Mazar-e-Quaid, Frere Hall, Mohatta exterior, Merewether Tower, Empress Market, Teen Talwar, port cranes/ships, station, beach, and airport.
- [ ] Build Saddar–old city and Clifton/seafront hero zones, colonial/market/modern facades, coast/port, rail/roads, collision, dust/haze and night materials.
- [ ] Assert security/source review, coastline/port/rail, monument/market landmarks and density, and `city:verify --city karachi`.

## Phase 180 — Lahore, Pakistan (`lahore`)

- [ ] Acquire Pakistan/Punjab terrain, imagery, building and heritage data with security review before Overture/OSM; cover walled city, Mall/civic corridor, canal, rail, and airport approach.
- [ ] Detail Walled City, Fort/Badshahi public exteriors, Mall, modern center; include Minar-e-Pakistan, Lahore Fort/Badshahi/Wazir Khan exteriors under heritage rights, city gates, museum exterior, GPO, station, canal, and Metro/Orange Line.
- [ ] Build Walled City and Mall hero zones, Mughal/colonial facade/roof assets, gates/alleys, canal/transit, collision, monsoon/haze and night materials.
- [ ] Assert heritage permissions, wall/gate/street topology, monument/fort alignment, transit, and `city:verify --city lahore`.

## Phase 181 — Islamabad–Rawalpindi, Pakistan (`islamabad-rawalpindi`)

- [ ] Acquire Pakistan/CDA terrain, imagery, building and municipal data with security review before Overture/OSM; cover public Islamabad sectors, Margalla Hills, Rawalpindi center shell, rail, and airport corridor without sensitive sites.
- [ ] Detail Blue Area, public civic/cultural zones, Saidpur, Rawalpindi bazaar sample; include Faisal Mosque, Pakistan Monument, Centaurus exterior where licensed, Supreme Court/Parliament public exteriors as permitted, Daman-e-Koh, Metrobus, station, and airport shell.
- [ ] Build Blue Area–monument and Saidpur/Margalla hero zones, planned grid/hill terrain, public landmark assets, transit, collision, monsoon and night materials.
- [ ] Assert security exclusion masks, sector/terrain geometry, mosque/monument permissions, airport/transit, and `city:verify --city islamabad-rawalpindi`.

## Phase 182 — Sydney, Australia (`sydney`)

- [ ] Acquire NSW/Sydney official 3D/LiDAR, terrain, orthophoto, bathymetry and building data before Overture/OSM; cover harbor/inner city, Parramatta shell, beaches/cliffs, rail, port, and airport approaches.
- [ ] Detail Circular Quay/Rocks, CBD, Darling Harbour, Barangaroo, Bondi; include Opera House under licensed architectural model, Harbour Bridge, Centrepoint, Queen Victoria Building, Town Hall, stadiums, ferries, light rail, stations, airport, beaches, and headlands.
- [ ] Build Circular Quay–Rocks and Darling/Barangaroo hero zones, harbor/bays/cliffs, bridge/ferries, rail/light rail, vegetation, collision, bright and night materials.
- [ ] Assert Opera/bridge rights and silhouettes, harbor/ferry/water topology, airport approach, and `city:verify --city sydney`.

## Phase 183 — Melbourne, Australia (`melbourne`)

- [ ] Acquire Victoria/Melbourne official 3D/LiDAR, terrain, orthophoto and building data before Overture/OSM; cover CBD, inner districts, Yarra/bay edge, port, rail/trams, and airport corridor.
- [ ] Detail CBD lanes, Federation Square, Southbank, Docklands, Carlton; include Flinders Street, Shrine, Royal Exhibition exterior, Eureka/Australia 108, stadiums, Arts Centre spire, bridges, station, trams, port, and markets.
- [ ] Build laneways/Federation–Southbank and Carlton hero zones, Victorian/modern facades, Yarra/bridges, tram/rail network, collision, four-season/wet and night materials.
- [ ] Assert grid/laneway and tram topology, river/bridge, skyline/stadium landmarks, and `city:verify --city melbourne`.

## Phase 184 — Brisbane, Australia (`brisbane`)

- [ ] Acquire Queensland/Brisbane official 3D/LiDAR, terrain, orthophoto and flood/building data before Overture/OSM; cover river bends, CBD, South Bank, hills, rail, port shell, and airport approach.
- [ ] Detail CBD, South Bank, Fortitude Valley, Kangaroo Point; include Story Bridge, City Hall, Treasury exterior, stadiums, Wheel, modern towers, cliffs, ferry terminals, rail, and airport.
- [ ] Build CBD–South Bank and Valley/Kangaroo Point hero zones, river/floodplain/cliffs, bridges/CityCats, subtropical vegetation, collision, wet and night materials.
- [ ] Assert river-bend/bridge/ferry topology, flood datum, skyline/hill alignment, and `city:verify --city brisbane`.

## Phase 185 — Perth, Australia (`perth`)

- [ ] Acquire Western Australia/Perth official 3D/LiDAR, terrain, orthophoto, coast and building data before Overture/OSM; cover CBD, Swan/Canning rivers, Kings Park, Fremantle shell, beaches, rail, and airport.
- [ ] Detail CBD/Elizabeth Quay, Kings Park, Northbridge, Fremantle; include Bell Tower, Optus Stadium, Matagarup Bridge, State Buildings exteriors, modern towers, Fremantle prison/public port exteriors, ferries, rail, and beaches.
- [ ] Build Elizabeth Quay–Kings Park and Fremantle hero zones, river/coast, bridges/ferries, Mediterranean vegetation, rail, collision, bright and night materials.
- [ ] Assert river/coast/park terrain, bridge/stadium silhouettes, Fremantle/rail coverage, and `city:verify --city perth`.

## Phase 186 — Adelaide, Australia (`adelaide`)

- [ ] Acquire South Australia/Adelaide official 3D/LiDAR, terrain, orthophoto and building data before Overture/OSM; cover parklands/grid, CBD, hills edge, coast shell, rail/trams, and airport approach.
- [ ] Detail North Terrace, central squares, riverbank, market; include Parliament exterior, railway station, cathedral, Adelaide Oval, university/museum exteriors, Convention Centre, Central Market, tram, and airport.
- [ ] Build North Terrace–riverbank and market/squares hero zones, planned grid/parklands, hills/coast context, trams/rail, vegetation, collision, dry/wet and night materials.
- [ ] Assert parkland ring/grid, river/stadium/civic landmarks, airport/tram, and `city:verify --city adelaide`.

## Phase 187 — Canberra, Australia (`canberra`)

- [ ] Acquire ACT official 3D/LiDAR, terrain, orthophoto and building data before Overture/OSM; cover Griffin plan, lake, parliamentary triangle public exteriors, surrounding hills, airport, and urban centers.
- [ ] Detail Parliamentary Triangle, Civic, ANU/lakefront; include Parliament House public exterior/roof, Old Parliament, War Memorial exterior, National Gallery/Library/High Court exteriors, Telstra Tower, bridges, lake craft, and light rail.
- [ ] Build parliamentary/lake axis and Civic hero zones, precise axial terrain/landscape, lake/bridges, public-building collision limits, rail, vegetation, and night materials.
- [ ] Assert Griffin axes/view corridors, lake/bridge topology, public/sensitive exclusions, and `city:verify --city canberra`.

## Phase 188 — Auckland, New Zealand (`auckland`)

- [ ] Acquire Auckland Council/LINZ official 3D/LiDAR, terrain, orthophoto, bathymetry and building data before Overture/OSM; cover isthmus, harbors, volcanic cones, islands shell, rail, port, and airport.
- [ ] Detail CBD/Viaduct, Wynyard, Ponsonby, Devonport; include Sky Tower, Harbour Bridge, Ferry Building, museum exterior, stadium, port cranes/ships, ferries, rail/CRL current state, Rangitoto and volcanic cones.
- [ ] Build CBD–Viaduct/Wynyard and Devonport hero zones, volcanic terrain/harbors, bridge/ferries, vegetation, rail, collision, rain and night materials.
- [ ] Assert two-harbor/coast/volcano topology, ferry/bridge/port, skyline and construction dates, and `city:verify --city auckland`.

## Phase 189 — Wellington, New Zealand (`wellington`)

- [ ] Acquire Wellington/LINZ official 3D/LiDAR, steep terrain, orthophoto and building data before Overture/OSM; cover CBD/harbor, surrounding hills, airport approach, rail, and port.
- [ ] Detail civic/waterfront, parliament, Cuba Street, Mount Victoria; include Beehive/Parliament public exteriors, railway station, Te Papa exterior, cable car, stadium, airport runway, port/ferries, and hillside houses.
- [ ] Build waterfront–Cuba and parliament/cable-car hero zones, extreme hill/road/stair terrain, harbor/ferries, rail, collision, wind/rain and night materials.
- [ ] Assert slope/road/cable-car geometry, harbor/airport runway, landmark and vegetation budgets, and `city:verify --city wellington`.

## Phase 190 — Queenstown, New Zealand (`queenstown`)

- [ ] Acquire Queenstown Lakes/LINZ high-resolution LiDAR, terrain, orthophoto, bathymetry and building data before Overture/OSM; cover town, Lake Wakatipu, surrounding ranges, airport approach, and gondola/ski-route context.
- [ ] Detail lakefront/town center, Queenstown Hill, Bob’s Peak; include Skyline gondola/station, wharf, gardens, historic steamship exterior where licensed, Kawarau/Shotover bridge contexts, airport, marinas, and ski-field shells.
- [ ] Build town/lakefront and gondola/Bob’s Peak hero zones, mountain terrain at highest available resolution, lake/depth/boats, vegetation, collision, snow and night materials.
- [ ] Assert mountain/lake/airport elevation, gondola route, shoreline/boat and terrain texture sharpness, and `city:verify --city queenstown`.

## Phase 191 — Buenos Aires, Argentina (`buenos-aires`)

- [ ] Acquire Buenos Aires/Argentina official 3D/LiDAR, terrain, orthophoto, building and Río de la Plata data before Overture/OSM; cover central communes, Puerto Madero, La Boca, rail, port, and airport approaches.
- [ ] Detail Microcentro/Plaza de Mayo, San Telmo, Recoleta, Palermo, La Boca, Puerto Madero; include Obelisk, Casa Rosada exterior, Congress, Teatro Colón exterior, Kavanagh, Floralis, Bombonera/Monumental exteriors, bridge, stations, Subte, port, and waterfront.
- [ ] Build Plaza–Obelisk/San Telmo and La Boca/Puerto Madero hero zones, European/colorful facade sets, estuary/port, rail/Subte, collision, rain and night materials.
- [ ] Assert avenue/monument scale, district facade identity, port/estuary/rail and stadium set, and `city:verify --city buenos-aires`.

## Phase 192 — Rio de Janeiro, Brazil (`rio-de-janeiro`)

- [ ] Acquire Rio/Brazil official 3D/LiDAR, terrain, orthophoto, bathymetry and building data before Overture/OSM; cover Guanabara Bay, central/south zones, major mountains/forest, beaches, port, and both airport approaches.
- [ ] Detail Centro/Lapa, Copacabana/Ipanema, Urca, Santa Teresa, Maracanã; include Christ the Redeemer under approved rights, Sugarloaf cable car, Arches, cathedral, Municipal Theatre exterior, Museum of Tomorrow exterior, stadium, favelas at respectful aggregate/detail policy, beaches, ferries, and airports.
- [ ] Build Centro/Lapa and Copacabana–Ipanema hero zones plus Sugarloaf approach, dramatic terrain/forest, bay/ocean/ferries, rail/cable cars, collision, tropical haze and night materials.
- [ ] Assert mountain/monument/cableway silhouettes, beach/bay/airport topology, respectful community review, and `city:verify --city rio-de-janeiro`.

## Phase 193 — São Paulo, Brazil (`sao-paulo`)

- [ ] Acquire São Paulo/Brazil official LiDAR, terrain, orthophoto, building, river and municipal data before Overture/OSM; cover central expanded area, Paulista, Pinheiros, rail/Metro, and airport corridors.
- [ ] Detail Centro, Avenida Paulista, Ibirapuera, Liberdade, Pinheiros; include MASP exterior, Copan/Italia/Altino towers, cathedral, Municipal Theatre exterior, Luz station, market, Ibirapuera architectural exteriors, stadiums, bridges, Metro/rail, and airports.
- [ ] Build historic Centro and Paulista hero zones, massive high-rise LOD/instancing system, buried/channel rivers, Metro/rail, parks, collision, rain/haze and night materials.
- [ ] Assert extreme-density performance, skyline coverage and LOD stability, rail/Metro/airport, landmark set, and `city:verify --city sao-paulo`.

## Phase 194 — Santiago, Chile (`santiago-chile`)

- [ ] Acquire Santiago/Chile official LiDAR, terrain, orthophoto, building and river data before Overture/OSM; cover basin, central/Providencia/Las Condes, hills, rail/Metro, and airport corridor.
- [ ] Detail Plaza de Armas/civic center, Lastarria, Providencia, Sanhattan, San Cristóbal; include Gran Torre Santiago, La Moneda public exterior, cathedral, museum/cultural exteriors, Entel Tower, funicular/cable car, Costanera, Metro, and stadium.
- [ ] Build historic center–Lastarria and Providencia/San Cristóbal hero zones, Andes/basin terrain, Mapocho/bridges, cableway/Metro, collision, smog/snow-season and night materials.
- [ ] Assert Andes sightline/terrain and basin haze, tower/monument alignment, river/transit, and `city:verify --city santiago-chile`.

## Phase 195 — Lima, Peru (`lima`)

- [ ] Acquire Lima/Peru official terrain, cliff/coast, orthophoto, building and archaeological data before Overture/OSM; cover historic center, Miraflores/Barranco, Callao/port shell, rail, and airport approach.
- [ ] Detail Plaza Mayor/historic center, Miraflores, Barranco, San Isidro; include cathedral/government public exteriors, San Francisco exterior, Torre Tagle exterior, Huaca Pucllana under heritage rights, cliffs/malecón, Bridge of Sighs, modern towers, Metropolitano/Metro, port, and airport.
- [ ] Build historic center and Miraflores–Barranco hero zones, adobe/colonial/modern facades, coastal cliffs/ocean, transit, collision, garúa haze and night materials.
- [ ] Assert cliff/coast/port topology, archaeology exclusion, heritage facade set, transit/airport, and `city:verify --city lima`.

## Phase 196 — Bogotá, Colombia (`bogota`)

- [ ] Acquire Bogotá/Colombia official 3D/LiDAR, high-resolution terrain, orthophoto, building and wetland data before Overture/OSM; cover plateau, eastern hills, central/northern districts, transit, and airport corridor.
- [ ] Detail La Candelaria, Plaza Bolívar, Centro Internacional, Chapinero, Monserrate; include cathedral/capitol/palace public exteriors, Gold Museum exterior, Colpatria/BD Bacatá, Monserrate sanctuary/cable car exterior, bullring exterior, TransMilenio, and airport.
- [ ] Build Candelaria–Plaza and Centro/Monserrate hero zones, steep eastern terrain, colonial/brick facades, cableway/BRT, wetlands, collision, rain and night materials.
- [ ] Assert plateau/hill/cableway geometry, brick-density performance, BRT/airport and heritage landmarks, and `city:verify --city bogota`.

## Phase 197 — Medellín, Colombia (`medellin`)

- [ ] Acquire Medellín/Colombia official 3D/LiDAR, high-resolution terrain, orthophoto, building and river data before Overture/OSM; cover valley, central/el Poblado, hillside districts at respectful LoD, Metro/cableways, and airport corridors.
- [ ] Detail Centro/Plaza Botero, El Poblado, river innovation district, selected hillside cable-car corridors; include Coltejer, cathedral, museum exteriors, Pueblito Paisa, Orquideorama exterior, stadium, Metro stations/viaducts, Metrocable, bridges, and airport shell.
- [ ] Build Centro–river and Metrocable hillside hero zones, extreme valley/retaining terrain, brick facade library, river/Metro/cableway, vegetation, collision, rain and night materials.
- [ ] Assert valley/slope/building grounding, Metro/Metrocable continuity, respectful community review, and `city:verify --city medellin`.

## Phase 198 — Cartagena, Colombia (`cartagena-colombia`)

- [ ] Acquire Cartagena/Colombia official terrain, coast/bathymetry, orthophoto, building and heritage data before Overture/OSM; cover walled city, Getsemaní, Bocagrande, bay/islands shell, port, and airport approach.
- [ ] Detail complete walls/bastions/gates, Centro/San Diego, Getsemaní, Bocagrande; include clock tower, cathedral/church exteriors, San Felipe fortress, Palace of Inquisition exterior, city walls, modern towers, port/cruise/ferry routes, beaches, and airport.
- [ ] Build walled city/Getsemaní and fortress hero zones, colorful colonial facades/balconies, walls/walkways, bay/coast/boats, collision, humid and night materials.
- [ ] Assert full wall/bastion/gate topology, fortress elevation, bay/port/airport and facade detail, and `city:verify --city cartagena-colombia`.

## Phase 199 — Quito, Ecuador (`quito`)

- [ ] Acquire Quito/Ecuador official 3D/LiDAR, high-resolution volcanic terrain, orthophoto, building and heritage data before Overture/OSM; cover elongated valley, historic center, modern north, airport corridor, and surrounding volcanoes.
- [ ] Detail Plaza Grande/historic center, La Ronda, Panecillo, modern north; include Basilica, cathedral/La Compañía/San Francisco exteriors under heritage rights, Carondelet public exterior, Panecillo monument, TelefériQo/cableway, Mitad del Mundo context where extent permits, and airport shell.
- [ ] Build complete central UNESCO core and Panecillo/cableway hero zones, extreme terrain/stairs, colonial facades/roofs, transit, collision, cloud/rain and night materials.
- [ ] Assert volcanic terrain/elevation, church/roof skyline and cableway, heritage permissions, and `city:verify --city quito`.

## Phase 200 — Cusco, Peru (`cusco`)

- [ ] Acquire Cusco/Peru official high-resolution terrain, orthophoto, building and archaeological/heritage data before Overture/OSM; cover historic basin, Sacsayhuamán public context, rail/airport, surrounding terraces, and Sacred Valley-facing terrain shell.
- [ ] Detail Plaza de Armas, San Blas, Qorikancha public exterior, market/rail district; include cathedral/church exteriors, Qorikancha, Twelve-Angled Stone streetscape context, Sacsayhuamán under approved heritage sources, Cristo Blanco, station/rail, airport, terraces, and Inca walls.
- [ ] Build Plaza–San Blas and Sacsayhuamán approach hero zones, Inca/colonial stone and tile facade assets, extreme high-altitude terrain/stairs/walls, rail, collision, seasonal and night materials.
- [ ] Assert archaeological permissions and exclusion masks, wall/terrain/elevation accuracy, historic-core coverage, airport/rail, and `pnpm city:verify --city cusco --profile release`.

## Portfolio completion gate

After Phase 200, run `pnpm cities:verify --all --profile release` and assert:

- Exactly 200 signed city manifests exist and every catalog city points to an immutable CDN release that answers `200`, supports byte ranges, sends the expected cache headers, and passes checksum verification.
- Every city passed the same current pipeline version and hardware profiles; no phase relies solely on an expired waiver. The portfolio report lists data age, best/worst imagery GSD, building/landmark coverage, package size, cold/warm readiness, FPS/1% low, hitch rate, memory, and visual metrics for every city.
- An automated 200-city fly-to soak test visits each city twice in randomized order, validates cross-fades/authority/cancellation, captures a fixed skyline and street image, and completes without a crash, WebGL context loss, unbounded memory growth, missing attribution, blank imagery, or HTTP error.
- A deliberately corrupt city package, forbidden-license source, missing landmark, bad datum, blurred texture, blank texture, oversized GPU asset, collision hole, slow tile, and janky trace each fail the portfolio gate.
- Product UI shows coverage/detail/date/source badges. Cities with unavailable licensed LoD3 assets remain visibly marked Preview and cannot be represented as photorealistic or release-complete.

## Delivery sequencing and resourcing

- Build the shared pipeline first, then execute phases in numerical order for predictable product rollout. Independent data/legal/art teams may work ahead, but publication remains phase-gated.
- Staff each active city with geospatial/data engineering, technical art, environment art, QA/performance, and licensing review. A city with an excellent official model may take weeks; a city needing original LoD3 landmark work may take months. Do not trade the common quality gates for an arbitrary calendar date.
- Re-run discovery quarterly and rebuild when a materially newer official model, terrain, imagery, or landmark source appears. Content hashes and atomic pointers make upgrades and rollback safe.
- The plan defines 200 high-detail targets, not a claim that 200 equally detailed open models already exist. When licenses or source quality prevent the target, publish only a clearly labeled lower tier or delay that city; never fill the gap with unauthorized imagery/model extraction.
