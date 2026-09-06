export interface GeodeticPosition {
  longitude: number;
  latitude: number;
  height: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface EnuFrame {
  east: Vector3;
  north: Vector3;
  up: Vector3;
}

export const WGS84 = {
  semiMajorAxis: 6_378_137,
  semiMinorAxis: 6_356_752.314245179,
} as const;

const eccentricitySquared =
  1 - WGS84.semiMinorAxis ** 2 / WGS84.semiMajorAxis ** 2;

export function geodeticToEcef(position: GeodeticPosition): Vector3 {
  const longitude = degreesToRadians(position.longitude);
  const latitude = degreesToRadians(position.latitude);
  const sinLatitude = Math.sin(latitude);
  const cosLatitude = Math.cos(latitude);
  const radius =
    WGS84.semiMajorAxis /
    Math.sqrt(1 - eccentricitySquared * sinLatitude * sinLatitude);

  return {
    x: (radius + position.height) * cosLatitude * Math.cos(longitude),
    y: (radius + position.height) * cosLatitude * Math.sin(longitude),
    z: (radius * (1 - eccentricitySquared) + position.height) * sinLatitude,
  };
}

export function ecefToGeodetic(point: Vector3): GeodeticPosition {
  const p = Math.hypot(point.x, point.y);
  const longitude = Math.atan2(point.y, point.x);
  let latitude = Math.atan2(point.z, p * (1 - eccentricitySquared));
  let height = 0;

  for (let iteration = 0; iteration < 10; iteration += 1) {
    const sinLatitude = Math.sin(latitude);
    const radius =
      WGS84.semiMajorAxis /
      Math.sqrt(1 - eccentricitySquared * sinLatitude * sinLatitude);
    height = p / Math.max(Math.cos(latitude), 1e-12) - radius;
    const next = Math.atan2(
      point.z,
      p * (1 - (eccentricitySquared * radius) / (radius + height)),
    );
    if (Math.abs(next - latitude) < 1e-13) break;
    latitude = next;
  }

  return {
    longitude: normalizeLongitude(radiansToDegrees(longitude)),
    latitude: radiansToDegrees(latitude),
    height,
  };
}

export function enuFrame(
  position: Pick<GeodeticPosition, "longitude" | "latitude">,
): EnuFrame {
  const longitude = degreesToRadians(position.longitude);
  const latitude = degreesToRadians(position.latitude);
  const sinLongitude = Math.sin(longitude);
  const cosLongitude = Math.cos(longitude);
  const sinLatitude = Math.sin(latitude);
  const cosLatitude = Math.cos(latitude);

  return {
    east: { x: -sinLongitude, y: cosLongitude, z: 0 },
    north: {
      x: -sinLatitude * cosLongitude,
      y: -sinLatitude * sinLongitude,
      z: cosLatitude,
    },
    up: {
      x: cosLatitude * cosLongitude,
      y: cosLatitude * sinLongitude,
      z: sinLatitude,
    },
  };
}

export function addScaled(
  origin: Vector3,
  basis: Vector3,
  amount: number,
): Vector3 {
  return {
    x: origin.x + basis.x * amount,
    y: origin.y + basis.y * amount,
    z: origin.z + basis.z * amount,
  };
}

export function dot(left: Vector3, right: Vector3): number {
  return left.x * right.x + left.y * right.y + left.z * right.z;
}

export function magnitude(value: Vector3): number {
  return Math.hypot(value.x, value.y, value.z);
}

export function normalizeLongitude(value: number): number {
  return ((((value + 180) % 360) + 360) % 360) - 180;
}

export function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function radiansToDegrees(value: number): number {
  return (value * 180) / Math.PI;
}

export const TIMES_SQUARE_SPAWN = {
  longitude: -73.9855,
  latitude: 40.758,
  height: 1.7,
  heading: 185,
  pitch: 7,
} as const;
