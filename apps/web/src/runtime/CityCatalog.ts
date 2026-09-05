import {
  cityCatalogSchema,
  type CityCatalog,
  type CityCatalogEntry,
} from "@superman/world-manifest";

export async function loadCityCatalog(
  request: typeof fetch = fetch,
): Promise<CityCatalog> {
  const response = await request("/cities/catalog.json");
  if (!response.ok) {
    throw new Error(`The city catalog returned HTTP ${response.status}.`);
  }
  return cityCatalogSchema.parse(await response.json());
}

export function searchCities(
  cities: CityCatalogEntry[],
  query: string,
): CityCatalogEntry[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return cities;
  return cities.filter((city) =>
    `${city.displayName} ${city.country} ${city.slug}`
      .toLocaleLowerCase()
      .includes(normalized),
  );
}
