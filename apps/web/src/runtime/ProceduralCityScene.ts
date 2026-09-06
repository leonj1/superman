import type { CityCatalogEntry } from "@superman/world-manifest";
import type {
  ManhattanBox,
  ManhattanLabel,
  ManhattanSceneDefinition,
  ManhattanWindow,
} from "./ManhattanScene";

const PALETTES = {
  cool: ["#91a2aa", "#b9b2a5", "#627985", "#d0cbc0", "#7e7771", "#78909a"],
  desert: ["#c7a77f", "#dbc39c", "#aa8065", "#ead8b6", "#9a715c", "#c5b18b"],
  tropical: ["#8ca6a1", "#d0b998", "#5f8685", "#e0d4b7", "#9d816a", "#71939b"],
  historic: ["#b49a7e", "#d0bea1", "#977c69", "#dfd2bb", "#826f65", "#ad9b80"],
  glass: ["#77929e", "#9caeb4", "#526f7c", "#b6c1c0", "#6d7f86", "#829ba5"],
} as const;

const WINDOW_COLORS = ["#d8f2ff", "#ffe9a8", "#9bdcff", "#f6c96a"];

/**
 * Generates an attractive, redistributable city preview from catalog metadata.
 * It is intentionally a visual preview, not a survey-accurate digital twin.
 */
export function createProceduralCityScene(
  city: CityCatalogEntry,
): ManhattanSceneDefinition {
  const boxes: ManhattanBox[] = [];
  const windows: ManhattanWindow[] = [];
  const labels: ManhattanLabel[] = [];
  const collisionBuildings: ManhattanBox[] = [];
  const seed = hash(city.slug);
  const paletteName = choosePalette(city, seed);
  const palette = PALETTES[paletteName];
  const populationScale = Math.min(
    1.45,
    Math.max(0.72, Math.log10(Math.max(city.populationReference, 100_000)) / 6),
  );
  const highRise = city.populationReference >= 1_000_000;
  const hasWater = city.expectedWaterBodies.length > 0;
  const groundColor = paletteName === "desert" ? "#756c5b" : "#26343a";
  let buildingCount = 0;
  let streetDetails = 0;

  addBox(boxes, {
    id: `${city.slug}-ground`,
    east: 0,
    north: 0,
    up: -0.2,
    width: 1_900,
    depth: 2_300,
    height: 0.4,
    color: groundColor,
  });

  if (hasWater) {
    addBox(boxes, {
      id: `${city.slug}-water`,
      east: -710,
      north: 0,
      up: 0.02,
      width: 430,
      depth: 2_300,
      height: 0.06,
      color: paletteName === "tropical" ? "#168b9d" : "#2c6f8d",
    });
  }

  const columnStart = hasWater ? -3 : -6;
  for (let row = -9; row <= 9; row += 1) {
    if (row % 4 === 0) continue;
    for (let column = columnStart; column <= 6; column += 1) {
      if (column === 0 || Math.abs(column) === 4) continue;
      const localSeed = Math.abs(seed + row * 79 + column * 131);
      const east = column * 61;
      const north = row * 67;
      const centrality = Math.max(
        0.35,
        1 - (Math.abs(row) + Math.abs(column)) / 22,
      );
      const baseHeight = highRise ? 78 : 46;
      const height = Math.max(
        24,
        (baseHeight + (localSeed % (highRise ? 130 : 66))) *
          populationScale *
          centrality,
      );
      const width = 43 + (localSeed % 4) * 3;
      const depth = 48 + (localSeed % 5) * 2;
      const color = palette[localSeed % palette.length] ?? palette[0];

      addBox(boxes, {
        id: `${city.slug}-sidewalk-${row}-${column}`,
        east,
        north,
        up: 0.09,
        width: 57,
        depth: 64,
        height: 0.18,
        color: paletteName === "desert" ? "#b7aa91" : "#92999c",
      });
      addBuilding(boxes, collisionBuildings, {
        id: `${city.slug}-building-${row}-${column}`,
        east,
        north,
        width,
        depth,
        height,
        color,
        seed: localSeed,
      });
      addFacadeWindows(windows, {
        east,
        north,
        width,
        depth,
        height,
        seed: localSeed,
      });
      buildingCount += 1;
    }
  }

  addRoadDetails(boxes, city.slug, seed);
  streetDetails += 124;
  streetDetails += addVehicles(boxes, city.slug, seed);
  streetDetails += addStreetTrees(boxes, city.slug, seed, paletteName);

  const landmarks = city.expectedLandmarks.slice(0, 4);
  while (landmarks.length < 4)
    landmarks.push(`${city.displayName} Tower ${landmarks.length + 1}`);
  const landmarkPositions = [
    { east: 250, north: -430 },
    { east: -260, north: -520 },
    { east: 365, north: -820 },
    { east: -340, north: 630 },
  ];
  landmarks.forEach((name, index) => {
    const position = landmarkPositions[index]!;
    const landmarkHeight =
      (145 + ((seed + index * 83) % 175)) * populationScale;
    addLandmark(boxes, collisionBuildings, {
      id: `${city.slug}-landmark-${index}`,
      ...position,
      width: 48 + ((seed + index) % 20),
      depth: 48 + ((seed + index * 3) % 18),
      height: landmarkHeight,
      color: palette[(index + 2) % palette.length] ?? palette[0],
      accent: index % 2 === 0 ? "#d8f1f4" : "#efc96d",
      seed: seed + index,
    });
    labels.push({
      id: `${city.slug}-landmark-label-${index}`,
      east: position.east,
      north: position.north - 34,
      up: Math.min(landmarkHeight * 0.55, 90),
      text: shortLabel(name),
      color: "#ffffff",
      background: "#183c50",
      font: "700 14px Inter, sans-serif",
    });
  });

  const districts = city.expectedDistricts.slice(0, 2);
  labels.push({
    id: `${city.slug}-city-label`,
    east: -23,
    north: 95,
    up: 37,
    text: city.displayName.toLocaleUpperCase(),
    color: "#ffffff",
    background: paletteName === "desert" ? "#a04d28" : "#b42635",
    font: "800 19px Inter, sans-serif",
  });
  districts.forEach((district, index) => {
    labels.push({
      id: `${city.slug}-district-label-${index}`,
      east: index === 0 ? -23 : 23,
      north: index === 0 ? -65 : 225,
      up: index === 0 ? 25 : 31,
      text: shortLabel(district),
      color: "#ffffff",
      background: index === 0 ? "#176d91" : "#24764f",
      font: "700 14px Inter, sans-serif",
    });
  });

  return {
    boxes,
    windows,
    labels,
    collisionBuildings,
    stats: {
      buildings: buildingCount + landmarks.length,
      facadeWindows: windows.length,
      signs: labels.length,
      streetDetails,
      landmarks: landmarks.length,
    },
  };
}

function choosePalette(
  city: CityCatalogEntry,
  seed: number,
): keyof typeof PALETTES {
  const text =
    `${city.country} ${city.expectedGeography.join(" ")}`.toLocaleLowerCase();
  if (/desert|gulf|arid|sahel/.test(text)) return "desert";
  if (
    /tropic|caribbean|indian ocean|pacific|equator/.test(text) ||
    Math.abs(city.center.latitude) < 18
  )
    return "tropical";
  if (
    /historic|old town|medieval|colonial|imperial/.test(
      `${city.requirements.detail} ${city.requirements.build}`.toLocaleLowerCase(),
    )
  )
    return "historic";
  if (Math.abs(city.center.latitude) > 48) return "cool";
  return seed % 3 === 0 ? "glass" : "historic";
}

function addRoadDetails(
  boxes: ManhattanBox[],
  slug: string,
  seed: number,
): void {
  for (let north = -560; north <= 560; north += 42) {
    addBox(boxes, {
      id: `${slug}-lane-${north}`,
      east: 1.5,
      north,
      up: 0.045,
      width: 0.18,
      depth: 19,
      height: 0.04,
      color: seed % 2 === 0 ? "#e9c65e" : "#e9ece8",
    });
  }
  for (const crossing of [-268, 0, 268]) {
    for (let stripe = -5; stripe <= 5; stripe += 1) {
      addBox(boxes, {
        id: `${slug}-crosswalk-${crossing}-${stripe}`,
        east: stripe * 2.1,
        north: crossing,
        up: 0.055,
        width: 1.15,
        depth: 7,
        height: 0.04,
        color: "#eef0e8",
      });
    }
  }
}

function addVehicles(
  boxes: ManhattanBox[],
  slug: string,
  seed: number,
): number {
  const colors = ["#e7b82e", "#e8ecee", "#b32f37", "#276b9b", "#30383d"];
  for (let index = 0; index < 18; index += 1) {
    const east = (index % 2 === 0 ? -1 : 1) * (6.2 + (index % 3));
    const north = -500 + index * 57;
    addBox(boxes, {
      id: `${slug}-vehicle-${index}`,
      east,
      north,
      up: 0.72,
      width: 2,
      depth: 4.5,
      height: 1.25,
      color: colors[(seed + index) % colors.length] ?? "#ddd",
    });
    addBox(boxes, {
      id: `${slug}-vehicle-glass-${index}`,
      east,
      north,
      up: 1.45,
      width: 1.7,
      depth: 2.2,
      height: 0.36,
      color: "#172a35",
    });
  }
  return 36;
}

function addStreetTrees(
  boxes: ManhattanBox[],
  slug: string,
  seed: number,
  palette: keyof typeof PALETTES,
): number {
  if (palette === "desert" && seed % 2 === 0) return 0;
  let details = 0;
  for (let index = -7; index <= 7; index += 1) {
    for (const side of [-1, 1]) {
      const east = side * 17;
      const north = index * 72 + 24;
      addBox(boxes, {
        id: `${slug}-tree-trunk-${side}-${index}`,
        east,
        north,
        up: 2.3,
        width: 0.4,
        depth: 0.4,
        height: 4.6,
        color: "#55412e",
      });
      addBox(boxes, {
        id: `${slug}-tree-crown-${side}-${index}`,
        east,
        north,
        up: 5.4,
        width: 3.2,
        depth: 3.2,
        height: 3.4,
        color: palette === "tropical" ? "#277c55" : "#3d7449",
      });
      details += 2;
    }
  }
  return details;
}

interface BuildingInput {
  id: string;
  east: number;
  north: number;
  width: number;
  depth: number;
  height: number;
  color: string;
  seed: number;
}

function addBuilding(
  boxes: ManhattanBox[],
  collisions: ManhattanBox[],
  input: BuildingInput,
): void {
  const podiumHeight = Math.min(22, input.height * 0.3);
  const style = input.seed % 6;
  const podium: ManhattanBox = {
    ...input,
    id: `${input.id}-podium`,
    up: podiumHeight / 2 + 0.2,
    height: podiumHeight,
    collision: true,
    facadeStyle: style,
  };
  addBox(boxes, podium);
  const towerWidth = input.width * (input.height > 120 ? 0.76 : 0.9);
  const towerDepth = input.depth * (input.height > 120 ? 0.74 : 0.9);
  addBox(boxes, {
    ...input,
    id: `${input.id}-body`,
    east: input.east + ((input.seed % 3) - 1) * 1.6,
    north: input.north + ((input.seed % 5) - 2),
    up: podiumHeight + (input.height - podiumHeight) / 2 + 0.2,
    width: towerWidth,
    depth: towerDepth,
    height: input.height - podiumHeight,
    facadeStyle: style,
  });
  addBox(boxes, {
    id: `${input.id}-roof`,
    east: input.east,
    north: input.north,
    up: input.height + 1.1,
    width: towerWidth * 0.7,
    depth: towerDepth * 0.68,
    height: 2,
    color: "#ccd3d4",
  });
  collisions.push({ ...podium, up: input.height / 2, height: input.height });
}

function addFacadeWindows(
  windows: ManhattanWindow[],
  building: Omit<BuildingInput, "id" | "color">,
): void {
  const maxHeight = Math.min(building.height - 4, 145);
  for (let up = 7; up < maxHeight; up += 9) {
    const color = WINDOW_COLORS[(building.seed + Math.round(up)) % 4] ?? "#fff";
    for (
      let offset = -building.width / 2 + 5;
      offset < building.width / 2 - 3;
      offset += 8
    ) {
      windows.push(
        {
          east: building.east + offset,
          north: building.north - building.depth / 2 - 0.08,
          up,
          color,
          size: 3.3,
        },
        {
          east: building.east + offset,
          north: building.north + building.depth / 2 + 0.08,
          up,
          color,
          size: 3.3,
        },
      );
    }
    for (
      let offset = -building.depth / 2 + 5;
      offset < building.depth / 2 - 3;
      offset += 7
    ) {
      windows.push({
        east:
          building.east -
          Math.sign(building.east || 1) * (building.width / 2 + 0.08),
        north: building.north + offset,
        up,
        color,
        size: 3.3,
      });
    }
  }
}

function addLandmark(
  boxes: ManhattanBox[],
  collisions: ManhattanBox[],
  input: BuildingInput & { accent: string },
): void {
  const tiers = [
    { ratio: 0.5, scale: 1 },
    { ratio: 0.27, scale: 0.72 },
    { ratio: 0.16, scale: 0.48 },
    { ratio: 0.07, scale: 0.23 },
  ];
  let base = 0;
  tiers.forEach((tier, index) => {
    const height = input.height * tier.ratio;
    addBox(boxes, {
      id: `${input.id}-tier-${index}`,
      east: input.east,
      north: input.north,
      up: base + height / 2,
      width: input.width * tier.scale,
      depth: input.depth * tier.scale,
      height,
      color: index === tiers.length - 1 ? input.accent : input.color,
      facadeStyle:
        index < tiers.length - 1 ? (input.seed + index) % 6 : undefined,
    });
    base += height;
  });
  addBox(boxes, {
    id: `${input.id}-spire`,
    east: input.east,
    north: input.north,
    up: input.height + 13,
    width: 2,
    depth: 2,
    height: 26,
    color: input.accent,
  });
  collisions.push({
    ...input,
    id: `${input.id}-collision`,
    up: input.height / 2,
    collision: true,
  });
}

function shortLabel(value: string): string {
  const cleaned = value.replace(/\s+under .*$/i, "").trim();
  return cleaned.length > 28 ? `${cleaned.slice(0, 25).trim()}…` : cleaned;
}

function hash(value: string): number {
  let result = 2_166_136_261;
  for (const character of value) {
    result ^= character.codePointAt(0) ?? 0;
    result = Math.imul(result, 16_777_619);
  }
  return result >>> 0;
}

function addBox(target: ManhattanBox[], box: ManhattanBox): void {
  target.push(box);
}
