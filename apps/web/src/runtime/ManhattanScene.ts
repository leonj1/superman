export interface ManhattanBox {
  id: string;
  east: number;
  north: number;
  up: number;
  width: number;
  depth: number;
  height: number;
  color: string;
  rotationDegrees?: number;
  collision?: boolean;
  facadeStyle?: number;
}

export interface ManhattanWindow {
  east: number;
  north: number;
  up: number;
  color: string;
  size: number;
}

export interface ManhattanLabel {
  id: string;
  east: number;
  north: number;
  up: number;
  text: string;
  color: string;
  background: string;
  font: string;
}

export interface ManhattanSceneDefinition {
  boxes: ManhattanBox[];
  windows: ManhattanWindow[];
  labels: ManhattanLabel[];
  collisionBuildings: ManhattanBox[];
  stats: {
    buildings: number;
    facadeWindows: number;
    signs: number;
    streetDetails: number;
    landmarks: number;
  };
}

const BUILDING_COLORS = [
  "#a8b4bc",
  "#c5b69f",
  "#6e8492",
  "#d2cec3",
  "#897970",
  "#92a2a9",
  "#b89e82",
];

const WINDOW_COLORS = ["#d8f2ff", "#ffe9a8", "#9bdcff", "#f6c96a"];
let cachedScene: ManhattanSceneDefinition | undefined;

/**
 * A deterministic, redistributable Midtown vertical slice. It deliberately
 * models city composition and streets rather than claiming survey accuracy.
 * All visual layers are batched by ManhattanLayer at runtime.
 */
export function createManhattanScene(): ManhattanSceneDefinition {
  if (cachedScene) return cachedScene;
  const boxes: ManhattanBox[] = [];
  const windows: ManhattanWindow[] = [];
  const labels: ManhattanLabel[] = [];
  const collisionBuildings: ManhattanBox[] = [];
  let buildingCount = 0;
  let streetDetails = 0;
  let landmarkCount = 0;

  addBox(boxes, {
    id: "midtown-ground",
    east: 0,
    north: 0,
    up: -0.18,
    width: 1_900,
    depth: 2_400,
    height: 0.36,
    color: "#202a31",
  });

  // Sidewalk lots leave a narrow avenue through the origin and cross streets
  // every fourth row. Their light concrete edge makes the street grid legible.
  for (let row = -9; row <= 9; row += 1) {
    if (row % 4 === 0) continue;
    for (let column = -6; column <= 6; column += 1) {
      if (column === 0 || Math.abs(column) === 4) continue;
      const east = column * 59;
      const north = row * 66;
      const seed = Math.abs(row * 79 + column * 131);
      const distanceFade = Math.min(75, Math.abs(row) * 2 + Math.abs(column));
      const height = Math.max(34, 76 + (seed % 15) * 10 - distanceFade);
      const width = 43 + (seed % 3) * 3;
      const depth = 49 + (seed % 4) * 3;
      const color = BUILDING_COLORS[seed % BUILDING_COLORS.length] ?? "#999";

      addBox(boxes, {
        id: `sidewalk-${row}-${column}`,
        east,
        north,
        up: 0.09,
        width: 56,
        depth: 63,
        height: 0.18,
        color: "#92999c",
      });
      addBuilding(boxes, collisionBuildings, {
        id: `tower-${row}-${column}`,
        east,
        north,
        width,
        depth,
        height,
        color,
        seed,
      });
      buildingCount += 1;

      if (Math.abs(column) <= 3 && Math.abs(row) <= 7) {
        addFacadeWindows(windows, {
          east,
          north,
          width,
          depth,
          height,
          seed,
        });
      }
    }
  }

  // Broadway's angled paving and the Times Square pedestrian plazas.
  addBox(boxes, {
    id: "broadway-paving",
    east: -3,
    north: 5,
    up: 0.025,
    width: 18,
    depth: 1_270,
    height: 0.05,
    color: "#323d43",
    rotationDegrees: -8,
  });
  addBox(boxes, {
    id: "times-square-plaza",
    east: -4,
    north: 82,
    up: 0.065,
    width: 16,
    depth: 118,
    height: 0.08,
    color: "#565f61",
    rotationDegrees: -8,
  });

  // Lane dividers, crosswalks, traffic islands and the red TKTS-style steps.
  for (let north = -560; north <= 560; north += 42) {
    addBox(boxes, {
      id: `lane-${north}`,
      east: 1.5,
      north,
      up: 0.045,
      width: 0.18,
      depth: 19,
      height: 0.04,
      color: "#e9c65e",
    });
    streetDetails += 1;
  }
  for (const crossing of [-264, 0, 264]) {
    for (let stripe = -5; stripe <= 5; stripe += 1) {
      addBox(boxes, {
        id: `crosswalk-${crossing}-${stripe}`,
        east: stripe * 2.1,
        north: crossing,
        up: 0.055,
        width: 1.15,
        depth: 7,
        height: 0.04,
        color: "#eef0e8",
      });
      streetDetails += 1;
    }
  }
  for (let step = 0; step < 7; step += 1) {
    addBox(boxes, {
      id: `red-step-${step}`,
      east: -10,
      north: 127 + step * 2.8,
      up: 0.2 + step * 0.28,
      width: 14 - step * 0.8,
      depth: 3,
      height: 0.38 + step * 0.12,
      color: "#d92d3a",
    });
    streetDetails += 1;
  }

  // Static street traffic adds scale and recognizable New York color.
  const vehicleColors = ["#f2c230", "#f2c230", "#c9d2d6", "#a7242a"];
  for (let index = 0; index < 20; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const east = side * (6.2 + (index % 3));
    const north = -510 + index * 54;
    const color = vehicleColors[index % vehicleColors.length] ?? "#ddd";
    addBox(boxes, {
      id: `vehicle-${index}`,
      east,
      north,
      up: 0.72,
      width: 2,
      depth: 4.6,
      height: 1.25,
      color,
    });
    addBox(boxes, {
      id: `vehicle-window-${index}`,
      east,
      north,
      up: 1.47,
      width: 1.7,
      depth: 2.25,
      height: 0.38,
      color: "#172a35",
    });
    streetDetails += 2;
  }

  for (let index = -7; index <= 7; index += 1) {
    for (const side of [-1, 1]) {
      const east = side * 16.5;
      const north = index * 72 + 24;
      addBox(boxes, {
        id: `lamp-post-${side}-${index}`,
        east,
        north,
        up: 2.5,
        width: 0.22,
        depth: 0.22,
        height: 5,
        color: "#1c2327",
      });
      addBox(boxes, {
        id: `lamp-${side}-${index}`,
        east,
        north,
        up: 5.15,
        width: 0.8,
        depth: 0.65,
        height: 0.35,
        color: "#ffe5a0",
      });
      streetDetails += 2;
    }
  }

  // Recognizable skyline anchors are clearly stylized proxies, not survey data.
  addLandmark(boxes, collisionBuildings, {
    id: "one-times-square",
    east: -28,
    north: -225,
    width: 34,
    depth: 42,
    height: 118,
    color: "#767f84",
    accent: "#29b6e7",
  });
  addLandmark(boxes, collisionBuildings, {
    id: "bank-of-america-tower",
    east: 330,
    north: -290,
    width: 58,
    depth: 58,
    height: 300,
    color: "#89a9b7",
    accent: "#c7edff",
  });
  addLandmark(boxes, collisionBuildings, {
    id: "empire-state-building",
    east: 455,
    north: -1_030,
    width: 72,
    depth: 68,
    height: 352,
    color: "#b7ad98",
    accent: "#f2e6c9",
  });
  addLandmark(boxes, collisionBuildings, {
    id: "chrysler-building",
    east: 720,
    north: -520,
    width: 54,
    depth: 54,
    height: 292,
    color: "#aeb9bd",
    accent: "#e5f1f4",
  });
  landmarkCount += 4;

  const signPanels = [
    { east: -24, north: -182, up: 33, color: "#ef3340" },
    { east: 24, north: -140, up: 27, color: "#1676d2" },
    { east: -24, north: -86, up: 41, color: "#f2b705" },
    { east: 24, north: -28, up: 35, color: "#9b35d0" },
    { east: -24, north: 42, up: 29, color: "#22a879" },
    { east: 24, north: 108, up: 44, color: "#ef5b2a" },
    { east: -24, north: 173, up: 38, color: "#1d9bd1" },
    { east: 24, north: 236, up: 31, color: "#e13a76" },
  ];
  signPanels.forEach((sign, index) => {
    addBox(boxes, {
      id: `times-square-screen-${index}`,
      east: sign.east,
      north: sign.north,
      up: sign.up,
      width: 0.45,
      depth: 18 + (index % 3) * 4,
      height: 18 + (index % 2) * 8,
      color: sign.color,
    });
  });

  labels.push(
    {
      id: "times-square-label",
      east: -22,
      north: -72,
      up: 25,
      text: "TIMES SQUARE",
      color: "#ffffff",
      background: "#1565c0",
      font: "700 20px Inter, sans-serif",
    },
    {
      id: "broadway-label",
      east: 22,
      north: 58,
      up: 17,
      text: "BROADWAY",
      color: "#ffffff",
      background: "#16814b",
      font: "700 15px Inter, sans-serif",
    },
    {
      id: "nyc-label",
      east: -22,
      north: 148,
      up: 47,
      text: "NEW YORK CITY",
      color: "#ffffff",
      background: "#d42732",
      font: "800 18px Inter, sans-serif",
    },
  );

  cachedScene = {
    boxes,
    windows,
    labels,
    collisionBuildings,
    stats: {
      buildings: buildingCount + landmarkCount,
      facadeWindows: windows.length,
      signs: signPanels.length + labels.length,
      streetDetails,
      landmarks: landmarkCount,
    },
  };
  return cachedScene;
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
  const podiumHeight = Math.min(24, input.height * 0.28);
  const podium: ManhattanBox = {
    id: `${input.id}-podium`,
    east: input.east,
    north: input.north,
    up: podiumHeight / 2 + 0.2,
    width: input.width,
    depth: input.depth,
    height: podiumHeight,
    color: input.color,
    collision: true,
    facadeStyle: input.seed % 6,
  };
  addBox(boxes, podium);
  const towerWidth =
    input.height > 130 ? input.width * 0.78 : input.width * 0.9;
  const towerDepth =
    input.height > 130 ? input.depth * 0.76 : input.depth * 0.9;
  addBox(boxes, {
    id: `${input.id}-body`,
    east: input.east + ((input.seed % 3) - 1) * 2,
    north: input.north + ((input.seed % 5) - 2),
    up: podiumHeight + (input.height - podiumHeight) / 2 + 0.2,
    width: towerWidth,
    depth: towerDepth,
    height: input.height - podiumHeight,
    color: input.color,
    facadeStyle: input.seed % 6,
  });
  addBox(boxes, {
    id: `${input.id}-roof`,
    east: input.east,
    north: input.north,
    up: input.height + 1.1,
    width: towerWidth * 0.72,
    depth: towerDepth * 0.7,
    height: 2,
    color: "#d2d9da",
  });
  if (Math.abs(input.east) <= 190 && Math.abs(input.north) <= 520) {
    const innerFace =
      input.east - Math.sign(input.east || 1) * (towerWidth / 2 + 0.13);
    const glass = ["#274957", "#7da9b7", "#d5ba70"];
    for (
      let bandHeight = podiumHeight + 5;
      bandHeight < input.height - 4;
      bandHeight += 9
    ) {
      addBox(boxes, {
        id: `${input.id}-facade-band-${Math.round(bandHeight)}`,
        east: innerFace,
        north: input.north,
        up: bandHeight,
        width: 0.26,
        depth: towerDepth * 0.82,
        height: 2.3,
        color:
          glass[(input.seed + Math.round(bandHeight / 9)) % glass.length] ??
          "#7da9b7",
      });
    }
  }
  collisions.push({ ...podium, height: input.height, up: input.height / 2 });
}

function addFacadeWindows(
  windows: ManhattanWindow[],
  building: Omit<BuildingInput, "id" | "color">,
): void {
  const maxHeight = Math.min(building.height - 5, 150);
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
          size: 3.4,
        },
        {
          east: building.east + offset,
          north: building.north + building.depth / 2 + 0.08,
          up,
          color,
          size: 3.4,
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
        size: 3.4,
      });
    }
  }
}

function addLandmark(
  boxes: ManhattanBox[],
  collisions: ManhattanBox[],
  input: Omit<BuildingInput, "seed"> & { accent: string },
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
      facadeStyle: index < tiers.length - 1 ? index % 6 : undefined,
    });
    base += height;
  });
  addBox(boxes, {
    id: `${input.id}-spire`,
    east: input.east,
    north: input.north,
    up: input.height + 16,
    width: 2.2,
    depth: 2.2,
    height: 32,
    color: input.accent,
  });
  collisions.push({
    id: `${input.id}-collision`,
    east: input.east,
    north: input.north,
    up: input.height / 2,
    width: input.width,
    depth: input.depth,
    height: input.height,
    color: input.color,
    collision: true,
  });
}

function addBox(target: ManhattanBox[], box: ManhattanBox): void {
  target.push(box);
}
