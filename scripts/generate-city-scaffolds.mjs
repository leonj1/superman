import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const planPath = join(ROOT, "PLAN.md");
const geonamesPath = process.argv[2];

if (!geonamesPath) {
  throw new Error(
    "Usage: node scripts/generate-city-scaffolds.mjs /path/to/cities15000.txt",
  );
}

const countryCodes = new Map(
  Object.entries({
    Argentina: "AR",
    Algeria: "DZ",
    Angola: "AO",
    Australia: "AU",
    Austria: "AT",
    Bahamas: "BS",
    Bahrain: "BH",
    Bangladesh: "BD",
    Belgium: "BE",
    Belize: "BZ",
    Botswana: "BW",
    "Bosnia and Herzegovina": "BA",
    Brazil: "BR",
    Bulgaria: "BG",
    Cambodia: "KH",
    Canada: "CA",
    Chile: "CL",
    China: "CN",
    Colombia: "CO",
    "Costa Rica": "CR",
    Croatia: "HR",
    Cuba: "CU",
    Czechia: "CZ",
    Denmark: "DK",
    "Democratic Republic of the Congo": "CD",
    "Dominican Republic": "DO",
    Ecuador: "EC",
    Egypt: "EG",
    Estonia: "EE",
    Ethiopia: "ET",
    Finland: "FI",
    France: "FR",
    Germany: "DE",
    Ghana: "GH",
    Greece: "GR",
    Guatemala: "GT",
    Hungary: "HU",
    Iceland: "IS",
    India: "IN",
    Indonesia: "ID",
    Iran: "IR",
    Iraq: "IQ",
    Ireland: "IE",
    Italy: "IT",
    Jamaica: "JM",
    Japan: "JP",
    Jordan: "JO",
    Kenya: "KE",
    Kuwait: "KW",
    Laos: "LA",
    Latvia: "LV",
    Lebanon: "LB",
    Lithuania: "LT",
    Luxembourg: "LU",
    Madagascar: "MG",
    Malaysia: "MY",
    Maldives: "MV",
    Mauritius: "MU",
    Mexico: "MX",
    Morocco: "MA",
    Mozambique: "MZ",
    Myanmar: "MM",
    Namibia: "NA",
    Nepal: "NP",
    Netherlands: "NL",
    "New Zealand": "NZ",
    Nigeria: "NG",
    Norway: "NO",
    Oman: "OM",
    Pakistan: "PK",
    Panama: "PA",
    Peru: "PE",
    Philippines: "PH",
    Poland: "PL",
    Portugal: "PT",
    "Puerto Rico": "PR",
    Qatar: "QA",
    Romania: "RO",
    Russia: "RU",
    Rwanda: "RW",
    "Saudi Arabia": "SA",
    Senegal: "SN",
    Serbia: "RS",
    Seychelles: "SC",
    Slovenia: "SI",
    "South Africa": "ZA",
    "South Korea": "KR",
    Spain: "ES",
    "Sri Lanka": "LK",
    Sweden: "SE",
    Switzerland: "CH",
    Taiwan: "TW",
    Tanzania: "TZ",
    Thailand: "TH",
    Tunisia: "TN",
    Türkiye: "TR",
    Uganda: "UG",
    Ukraine: "UA",
    "United Arab Emirates": "AE",
    "United Kingdom": "GB",
    "United States": "US",
    Uruguay: "UY",
    Vietnam: "VN",
    Zambia: "ZM",
    Zimbabwe: "ZW",
  }),
);

const specialLocations = {
  monaco: { query: "Monaco", country: "Monaco", countryCode: "MC" },
  jerusalem: { query: "Jerusalem", country: "Israel", countryCode: "IL" },
  "tel-aviv-jaffa": {
    query: "Tel Aviv",
    country: "Israel",
    countryCode: "IL",
  },
  "hong-kong": { query: "Hong Kong", country: "Hong Kong", countryCode: "HK" },
  macau: { query: "Macao", country: "Macau", countryCode: "MO" },
  singapore: { query: "Singapore", country: "Singapore", countryCode: "SG" },
  queenstown: {
    query: "Queenstown",
    country: "New Zealand",
    countryCode: "NZ",
    geonameId: "6204696",
    name: "Queenstown",
    ascii: "Queenstown",
    alternates: [],
    latitude: -45.03116,
    longitude: 168.66271,
    population: 15_800,
  },
};

const aliases = {
  "new-york-city": "New York City",
  "dallas-fort-worth": "Dallas",
  "washington-dc": "Washington",
  "portland-oregon": "Portland",
  "ottawa-gatineau": "Ottawa",
  "quebec-city": "Quebec",
  "san-jose-costa-rica": "San Jose",
  "kingston-jamaica": "Kingston",
  "birmingham-uk": "Birmingham",
  "saint-petersburg": "Saint Petersburg",
  "alexandria-egypt": "Alexandria",
  "victoria-seychelles": "Victoria",
  "denpasar-bali": "Denpasar",
  "hyderabad-india": "Hyderabad",
  "male-maldives": "Male",
  "islamabad-rawalpindi": "Islamabad",
  "santiago-chile": "Santiago",
  "cartagena-colombia": "Cartagena",
};

const officialModelLeads = {
  "new-york-city":
    "https://data.cityofnewyork.us/City-Government/3-D-Building-Model/tnru-abg2",
  toronto: "https://open.toronto.ca/dataset/3d-massing/",
  montreal: "https://donnees.montreal.ca/en/dataset?tags=3D",
  berlin: "https://www.businesslocationcenter.de/downloadportal/",
  helsinki:
    "https://www.hel.fi/en/decision-making/information-on-helsinki/maps-and-geospatial-data/helsinki-3d",
  vienna: "https://www.wien.gv.at/stadtplanung/geodaten",
  rotterdam: "https://www.rotterdam.nl/rotterdam-in-3d",
  warsaw:
    "https://www.geoportal.gov.pl/en/data/other-data/3d-models-of-building/",
  "cape-town":
    "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/239",
};

const frenchCities = new Set([
  "paris",
  "lyon",
  "marseille",
  "nice",
  "bordeaux",
]);

function normalize(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parsePlan() {
  const lines = readFileSync(planPath, "utf8").split("\n");
  const phases = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index]?.match(
      /^## Phase (\d+) — (.+) \(`([a-z0-9-]+)`\)$/,
    );
    if (!match) continue;
    const bullets = lines
      .slice(index + 1, index + 8)
      .filter((line) => line.startsWith("- [ ] "));
    if (bullets.length !== 4) {
      throw new Error(`Phase ${match[1]} must contain exactly four steps.`);
    }
    phases.push({
      phase: Number(match[1]),
      heading: match[2],
      slug: match[3],
      acquire: bullets[0].slice(6),
      detail: bullets[1].slice(6),
      build: bullets[2].slice(6),
      assert: bullets[3].slice(6),
    });
  }
  if (phases.length !== 200) throw new Error("PLAN.md must define 200 phases.");
  return phases;
}

function resolveIdentity(phase) {
  const special = specialLocations[phase.slug];
  if (special) return special;
  const countries = [...countryCodes.keys()].sort(
    (a, b) => b.length - a.length,
  );
  const country = countries.find((candidate) =>
    phase.heading.endsWith(`, ${candidate}`),
  );
  if (!country) throw new Error(`Unknown country in ${phase.heading}.`);
  const display = phase.heading.slice(0, -(country.length + 2));
  return {
    query: aliases[phase.slug] ?? display.split(",")[0],
    country,
    countryCode: countryCodes.get(country),
  };
}

function loadGeonames() {
  return readFileSync(geonamesPath, "utf8")
    .trim()
    .split("\n")
    .map((line) => {
      const fields = line.split("\t");
      return {
        geonameId: fields[0],
        name: fields[1],
        ascii: fields[2],
        alternates: fields[3]?.split(",") ?? [],
        latitude: Number(fields[4]),
        longitude: Number(fields[5]),
        countryCode: fields[8],
        population: Number(fields[14]) || 0,
      };
    });
}

function locate(phase, geonames) {
  const identity = resolveIdentity(phase);
  if ("latitude" in identity) return identity;
  const wanted = normalize(identity.query);
  const candidates = geonames
    .filter((record) => record.countryCode === identity.countryCode)
    .map((record) => {
      const names = [record.name, record.ascii, ...record.alternates].map(
        normalize,
      );
      const exact = names.includes(wanted);
      const partial = names.some(
        (name) => name.startsWith(wanted) || wanted.startsWith(name),
      );
      return { record, score: exact ? 2 : partial ? 1 : 0 };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) => b.score - a.score || b.record.population - a.record.population,
    );
  const match = candidates[0]?.record;
  if (!match) throw new Error(`No GeoNames match for ${phase.slug}.`);
  return { ...identity, ...match };
}

function sentenceSection(sentence, start, end) {
  const begin = sentence.toLowerCase().indexOf(start.toLowerCase());
  if (begin < 0) return [];
  const content = sentence.slice(begin + start.length);
  const finish = end ? content.toLowerCase().indexOf(end.toLowerCase()) : -1;
  return (finish >= 0 ? content.slice(0, finish) : content)
    .replace(/[.;]$/, "")
    .split(/,|\band\b/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 1);
}

function square(longitude, latitude, radiusKm) {
  const latitudeDelta = radiusKm / 111.32;
  const longitudeDelta =
    radiusKm / (111.32 * Math.cos((latitude * Math.PI) / 180));
  return [
    [longitude - longitudeDelta, latitude - latitudeDelta],
    [longitude + longitudeDelta, latitude - latitudeDelta],
    [longitude + longitudeDelta, latitude + latitudeDelta],
    [longitude - longitudeDelta, latitude + latitudeDelta],
    [longitude - longitudeDelta, latitude - latitudeDelta],
  ].map(([lon, lat]) => [Number(lon.toFixed(6)), Number(lat.toFixed(6))]);
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

const phases = parsePlan();
const geonames = loadGeonames();
const generatedAt = "2026-09-05";
const cities = phases.map((phase) => {
  const location = locate(phase, geonames);
  const center = {
    longitude: location.longitude,
    latitude: location.latitude,
  };
  const districts = sentenceSection(phase.detail, "Detail ", "; include");
  const landmarks = sentenceSection(phase.detail, "include ");
  const geography =
    sentenceSection(phase.acquire, "; cover ").length > 0
      ? sentenceSection(phase.acquire, "; cover ")
      : sentenceSection(phase.acquire, ". Cover ");
  const transitModes = [
    "roads",
    ...(/rail|metro|subway|tram|streetcar|train|station/i.test(phase.detail)
      ? ["rail"]
      : []),
    ...(/ferr|boat|water traffic|riverboat|seaplane/i.test(phase.detail)
      ? ["water"]
      : []),
    ...(/airport|approach|\b[A-Z]{3}\b/.test(phase.acquire) ? ["air"] : []),
  ];
  const latitudeRadius = 40 / 111.32;
  const longitudeRadius =
    40 / (111.32 * Math.cos((location.latitude * Math.PI) / 180));
  return {
    phase: phase.phase,
    slug: phase.slug,
    displayName: phase.heading.slice(
      0,
      phase.heading.endsWith(`, ${location.country}`)
        ? -(location.country.length + 2)
        : undefined,
    ),
    country: location.country,
    countryCode: location.countryCode,
    geonamesId: Number(location.geonameId),
    populationReference: location.population,
    center,
    bounds: {
      west: Number((location.longitude - longitudeRadius).toFixed(6)),
      south: Number((location.latitude - latitudeRadius).toFixed(6)),
      east: Number((location.longitude + longitudeRadius).toFixed(6)),
      north: Number((location.latitude + latitudeRadius).toFixed(6)),
    },
    spawnPoints: [
      {
        id: "city-overview",
        longitude: location.longitude,
        latitude: location.latitude,
        altitude: 1_500,
        heading: 0,
        pitch: -25,
      },
    ],
    polygons: {
      metro: square(location.longitude, location.latitude, 40),
      core: square(location.longitude, location.latitude, 10),
      hero: [square(location.longitude, location.latitude, 1)],
    },
    expectedDistricts: districts,
    expectedLandmarks: landmarks,
    expectedGeography: geography,
    expectedWaterBodies: geography.filter((item) =>
      /river|bay|lake|harbor|harbour|ocean|sea|canal|water|island|coast|shore/i.test(
        item,
      ),
    ),
    expectedBridges: landmarks.filter((item) => /bridge/i.test(item)),
    expectedAirports: geography.filter((item) =>
      /airport|approach|\b[A-Z]{3}\b/.test(item),
    ),
    transitModes: [...new Set(transitModes)],
    requirements: {
      acquire: phase.acquire,
      detail: phase.detail,
      build: phase.build,
      assertion: phase.assert,
    },
    package: {
      status: "cataloged",
      releaseAvailable: false,
      tilesetUrl: null,
      releaseHash: null,
      performanceCertified: false,
      attribution: [],
    },
  };
});

writeJson(join(ROOT, "cities/catalog.json"), {
  schemaVersion: 1,
  generatedAt,
  coordinateSource: {
    name: "GeoNames cities15000",
    url: "https://download.geonames.org/export/dump/cities15000.zip",
    license: "CC-BY-4.0",
    attribution: "GeoNames (https://www.geonames.org/)",
  },
  cities,
});

for (const city of cities) {
  const directory = join(ROOT, "cities", city.slug);
  const sourceId = `geonames-${city.geonamesId}`;
  const cityModelLead =
    officialModelLeads[city.slug] ??
    (frenchCities.has(city.slug)
      ? "https://www.data.gouv.fr/datasets/bd-topo-r"
      : "https://docs.overturemaps.org/guides/buildings/");
  const sourceCandidates = [
    {
      id: "city-model-discovery",
      role: "city-model",
      url: cityModelLead,
      discoveryBrief: city.requirements.acquire,
    },
    {
      id: "terrain-discovery",
      role: "terrain",
      url:
        city.countryCode === "US"
          ? "https://www.usgs.gov/3d-elevation-program"
          : "https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM",
      discoveryBrief:
        "Acquire the highest legally redistributable terrain/LiDAR coverage for the declared bounds.",
    },
    {
      id: "imagery-discovery",
      role: "imagery",
      url:
        city.countryCode === "US"
          ? "https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer"
          : "https://openaerialmap.org/",
      discoveryBrief:
        "Acquire orthophotography meeting the metro/core/hero GSD contract.",
    },
    {
      id: "roads-discovery",
      role: "roads",
      url: "https://www.openstreetmap.org/copyright",
      discoveryBrief:
        "Extract roads and transit with ODbL attribution and database separation.",
    },
    {
      id: "water-discovery",
      role: "water",
      url: "https://www.openstreetmap.org/copyright",
      discoveryBrief:
        "Extract hydrography and validate it against authoritative local shoreline data.",
    },
    {
      id: "vegetation-discovery",
      role: "vegetation",
      url: "https://docs.overturemaps.org/guides/land-use/",
      discoveryBrief:
        "Acquire tree, park, land-cover, and biome data suitable for instanced rendering.",
    },
  ].map((candidate) => ({
    ...candidate,
    status: "discovery-required",
    publisher: null,
    author: null,
    license: null,
    attribution: null,
    acquiredAt: null,
    sourceVersion: null,
    originalCrs: null,
    verticalDatum: null,
    allowedUses: [],
    redistributionStatus: "unreviewed",
    checksum: null,
  }));
  writeJson(join(directory, "sources.json"), {
    schemaVersion: 1,
    city: city.slug,
    sources: [
      {
        id: sourceId,
        role: "catalog-coordinate",
        status: "approved",
        url: `https://www.geonames.org/${city.geonamesId}`,
        publisher: "GeoNames",
        author: "GeoNames contributors",
        license: "CC-BY-4.0",
        attribution: "GeoNames (https://www.geonames.org/)",
        acquiredAt: generatedAt,
        sourceVersion: "cities15000-2026-09-05",
        originalCrs: "EPSG:4326",
        verticalDatum: "not-applicable",
        allowedUses: ["redistribution", "modification", "commercial-use"],
        redistributionStatus: "allowed-with-attribution",
        checksum: sha256(
          `${city.geonamesId}:${city.center.latitude}:${city.center.longitude}`,
        ),
      },
      ...sourceCandidates,
    ],
    rejectedCandidates: [],
  });
  writeJson(join(directory, "recipe.yml"), {
    schemaVersion: 1,
    city: city.slug,
    pipelineImage: "ghcr.io/superman-world/city-pipeline:1.0.0",
    requiredSourceRoles: [
      "city-model",
      "terrain",
      "imagery",
      "roads",
      "water",
      "vegetation",
    ],
    targets: {
      metroRadiusKm: 40,
      coreRadiusKm: 10,
      minimumHeroZones: 2,
      format: "3d-tiles-1.1",
      payload: "glTF-2.0",
    },
    operations: [
      "verify-source-ledger",
      "download-checksum-pinned-inputs",
      "transform-to-epsg-4978",
      "correct-vertical-datum",
      "clip-metro-core-and-hero-zones",
      "repair-topology-and-conflate-by-priority",
      "generate-lod0-lod1-lod2-lod3",
      "generate-simplified-collision",
      "compress-meshes-and-ktx2-textures",
      "tile-spatially-and-write-bounding-volumes",
      "validate-and-sign-manifest",
    ],
    budgets: {
      visibleTriangles: 8_000_000,
      drawCalls: 2_000,
      decodedGpuMegabytes: 1_536,
      cpuHeapMegabytes: 1_024,
      maximumTextureDimension: 8_192,
      minimumLodCount: 3,
    },
  });
  writeJson(join(directory, "city.manifest.json"), {
    schemaVersion: 1,
    city: city.slug,
    phase: city.phase,
    status: "cataloged",
    releaseHash: null,
    tilesetUrl: null,
    content: [],
    sourceLineage: [sourceId],
    featureCounts: null,
    coverage: null,
    budgets: null,
    collisionHash: null,
    landmarkIds: [],
    screenshots: [],
    attribution: ["GeoNames (https://www.geonames.org/)"],
    performanceCertified: false,
    certificationEvidence: null,
    visualEvidence: null,
    performanceEvidence: null,
    streamingEvidence: null,
    memoryEvidence: null,
    collisionEvidence: null,
    blockers: [
      "Approved redistributable city geometry has not been acquired.",
      "Terrain, imagery, landmark, collision, and transit packages have not been built.",
      "Physical-GPU performance evidence and two-person review are required.",
    ],
  });
}

console.log(`Generated ${cities.length} deterministic city scaffolds.`);
