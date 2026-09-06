import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { parseRuntimeConfig, supportsWorldExperience } from "@superman/config";
import type { CityCatalogEntry } from "@superman/world-manifest";
import type { WorldEngine } from "../runtime/WorldEngine";
import { loadCityCatalog, searchCities } from "../runtime/CityCatalog";
import { usePlayerStore } from "../runtime/playerStore";

const FEATURED_CITY_SLUGS = [
  "new-york-city",
  "chicago",
  "london",
  "paris",
  "tokyo",
];

export function App(): ReactNode {
  const configResult = useMemo(() => {
    try {
      return { config: parseRuntimeConfig(import.meta.env), error: null };
    } catch (cause) {
      return {
        config: null,
        error:
          cause instanceof Error ? cause.message : "Invalid configuration.",
      };
    }
  }, []);

  return (
    <ErrorBoundary>
      {configResult.error || !configResult.config ? (
        <FatalScreen
          title="Configuration error"
          message={configResult.error ?? "Configuration is missing."}
        />
      ) : (
        <World config={configResult.config} />
      )}
    </ErrorBoundary>
  );
}

function World({
  config,
}: {
  config: ReturnType<typeof parseRuntimeConfig>;
}): ReactNode {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WorldEngine | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [cityCatalogOpen, setCityCatalogOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<CityCatalogEntry[]>([]);
  const [cityCatalogError, setCityCatalogError] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState("New York City");
  const [unsupported, setUnsupported] = useState(false);
  const {
    mode,
    qualityLabel,
    loadingMessage,
    metrics,
    attribution,
    sources,
    setSnapshot,
  } = usePlayerStore();

  useEffect(() => {
    let cancelled = false;
    void loadCityCatalog()
      .then((catalog) => {
        if (cancelled) return;
        setCities(catalog.cities);
        window.__SUPERMAN_CITY_COUNT__ = catalog.cities.length;
      })
      .catch((cause) => {
        if (!cancelled) {
          setCityCatalogError(
            cause instanceof Error
              ? cause.message
              : "City catalog unavailable.",
          );
        }
      });
    return () => {
      cancelled = true;
      window.__SUPERMAN_CITY_COUNT__ = undefined;
    };
  }, []);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    const capability = {
      webgl2: Boolean(canvas.getContext("webgl2")),
      pointerLock: "pointerLockElement" in document,
      hardwareConcurrency: navigator.hardwareConcurrency || 2,
    };
    if (!supportsWorldExperience(capability)) {
      setUnsupported(true);
      return;
    }
    if (!hostRef.current) return;
    let disposed = false;
    const container = hostRef.current;
    void import("../runtime/WorldEngine")
      .then(({ WorldEngine: Engine }) => {
        if (disposed) return;
        const engine = new Engine({
          container,
          config,
          onSnapshot: (snapshot) => setSnapshot(snapshot),
          onFatalError: (error) => setFatal(error.message),
        });
        engineRef.current = engine;
        return engine.start();
      })
      .catch((cause) => {
        if (!disposed) {
          setFatal(
            cause instanceof Error
              ? cause.message
              : "The world runtime could not be loaded.",
          );
        }
      });
    return () => {
      disposed = true;
      engineRef.current?.destroy();
      engineRef.current = null;
      window.__SUPERMAN_WORLD_READY__ = false;
    };
  }, [config, setSnapshot]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyF") engineRef.current?.toggleFlight();
      if (event.code === "KeyP") engineRef.current?.togglePause();
      if (event.code === "KeyR") engineRef.current?.reset();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const visitCity = (city: CityCatalogEntry) => {
    setActiveCity(city.displayName);
    setCityCatalogOpen(false);
    setCityQuery("");
    void engineRef.current?.travelToCity(city);
  };

  useEffect(() => {
    window.__SUPERMAN_VISIT_CITY__ = async (slug: string) => {
      const city = cities.find((candidate) => candidate.slug === slug);
      if (!city) throw new Error(`Unknown city: ${slug}`);
      setActiveCity(city.displayName);
      await engineRef.current?.travelToCity(city);
    };
    return () => {
      window.__SUPERMAN_VISIT_CITY__ = undefined;
    };
  }, [cities]);

  const visibleCities = searchCities(cities, cityQuery);
  const featuredCities = FEATURED_CITY_SLUGS.map((slug) =>
    cities.find((city) => city.slug === slug),
  ).filter((city): city is CityCatalogEntry => Boolean(city));

  if (unsupported) {
    return (
      <FatalScreen
        title="This device is not supported"
        message="Superman World requires WebGL 2, pointer lock, and a modern desktop GPU. Try the latest Chrome or Edge with hardware acceleration enabled."
      />
    );
  }

  return (
    <main className="world-shell">
      <div
        ref={hostRef}
        className="world-canvas"
        data-testid="world-canvas"
        aria-label="Interactive 3D world"
      />
      <div className="vignette" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Superman World home">
          <span className="brand-mark">S</span>
          <span>
            <strong>SUPERMAN</strong>
            <small>WORLD EXPLORER</small>
          </span>
        </a>
        <div className="status-pill" data-testid="quality-status">
          <i className={mode === "loading" ? "pulse amber" : "pulse"} />
          {qualityLabel}
        </div>
      </header>

      {mode === "loading" && (
        <section className="loading-card" role="status" aria-live="polite">
          <span className="loader" />
          <p>{loadingMessage || "Preparing Manhattan…"}</p>
          <small>
            {Object.entries(sources)
              .map(([source, state]) => `${source}: ${state}`)
              .join(" · ")}
          </small>
        </section>
      )}

      {mode !== "loading" && (
        <div className="reticle" aria-hidden="true">
          <span />
        </div>
      )}

      <aside className="telemetry-panel" aria-label="Flight telemetry">
        <div>
          <small>MODE</small>
          <strong>{mode.replace(/([A-Z])/g, " $1").toUpperCase()}</strong>
        </div>
        <div>
          <small>SPEED</small>
          <strong>
            {Math.round(metrics?.speed ?? 0)} <em>m/s</em>
          </strong>
        </div>
        <div>
          <small>ALTITUDE</small>
          <strong>{formatAltitude(metrics?.altitude ?? 0)}</strong>
        </div>
        <div>
          <small>FRAME RATE</small>
          <strong>
            {Math.round(metrics?.fps ?? 0)} <em>fps</em>
          </strong>
        </div>
        <div>
          <small>IMAGE</small>
          <strong>{metrics?.worldQuality.toUpperCase() ?? "LOADING"}</strong>
        </div>
        <div>
          <small>RESOLUTION</small>
          <strong>{Math.round((metrics?.resolutionScale ?? 1) * 100)}%</strong>
        </div>
      </aside>

      <nav className="action-dock" aria-label="World actions">
        <button
          type="button"
          onClick={() => engineRef.current?.toggleFlight()}
          disabled={mode === "loading"}
        >
          <span aria-hidden="true">↟</span>
          {mode === "walking" ? "Take off" : "Land"}
          <kbd>F</kbd>
        </button>
        <button type="button" onClick={() => setControlsOpen((open) => !open)}>
          <span aria-hidden="true">⌨</span>
          Controls
        </button>
        <button type="button" onClick={() => setCityCatalogOpen(true)}>
          <span aria-hidden="true">◎</span>
          200 Cities
        </button>
        <button type="button" onClick={() => engineRef.current?.reset()}>
          <span aria-hidden="true">↺</span>
          Reset
          <kbd>R</kbd>
        </button>
      </nav>

      <section className="location-strip" aria-label="Quick travel">
        <span>EXPLORE</span>
        {featuredCities.map((city) => (
          <button key={city.slug} type="button" onClick={() => visitCity(city)}>
            {city.displayName}
          </button>
        ))}
      </section>

      <div className="active-city" aria-live="polite">
        <small>CITY TARGET</small>
        <strong>{activeCity}</strong>
        {config.tileProvider === "offline-fixture" && (
          <span>
            {activeCity === "New York City"
              ? "LOCAL 3D · MIDTOWN / TIMES SQUARE"
              : "PROCEDURAL 3D PREVIEW · CATALOG-DRIVEN"}
          </span>
        )}
      </div>

      {controlsOpen && (
        <section className="controls-card" role="dialog" aria-label="Controls">
          <button
            className="close"
            aria-label="Close controls"
            onClick={() => setControlsOpen(false)}
          >
            ×
          </button>
          <h2>Controls</h2>
          <dl>
            <div>
              <dt>
                <kbd>W A S D</kbd>
              </dt>
              <dd>Move</dd>
            </div>
            <div>
              <dt>
                <kbd>MOUSE</kbd>
              </dt>
              <dd>Look</dd>
            </div>
            <div>
              <dt>
                <kbd>SPACE / SHIFT</kbd>
              </dt>
              <dd>Rise / descend</dd>
            </div>
            <div>
              <dt>
                <kbd>CTRL</kbd>
              </dt>
              <dd>Boost</dd>
            </div>
            <div>
              <dt>
                <kbd>ESC</kbd>
              </dt>
              <dd>Release cursor</dd>
            </div>
          </dl>
        </section>
      )}

      {cityCatalogOpen && (
        <section
          className="city-catalog"
          role="dialog"
          aria-label="City catalog"
        >
          <header>
            <div>
              <p className="eyebrow">PREBUILT WORLD TARGETS</p>
              <h2>Explore 200 cities</h2>
              <p>
                Catalog locations are available now. High-detail packages appear
                only after their licensed source data passes release validation.
              </p>
            </div>
            <button
              className="close"
              aria-label="Close city catalog"
              onClick={() => setCityCatalogOpen(false)}
            >
              ×
            </button>
          </header>
          <label className="city-search">
            <span>Search city or country</span>
            <input
              autoFocus
              value={cityQuery}
              onChange={(event) => setCityQuery(event.target.value)}
              placeholder="Chicago, France, Cape Town…"
            />
          </label>
          <div className="city-catalog-summary">
            <span data-testid="city-catalog-count">
              {visibleCities.length} of {cities.length} cities
            </span>
            <span>
              {config.tileProvider === "hybrid"
                ? "Live terrain + OSM buildings enabled"
                : "Offline mode: local procedural 3D previews"}
            </span>
          </div>
          {cityCatalogError ? (
            <p role="alert">{cityCatalogError}</p>
          ) : (
            <div className="city-grid">
              {visibleCities.map((city) => (
                <button
                  key={city.slug}
                  type="button"
                  onClick={() => visitCity(city)}
                >
                  <span>
                    <strong>{city.displayName}</strong>
                    <small>{city.country}</small>
                  </span>
                  <em>
                    {config.tileProvider === "offline-fixture"
                      ? city.slug === "new-york-city"
                        ? "LOCAL 3D+"
                        : "LOCAL 3D"
                      : city.package.releaseAvailable
                        ? "3D READY"
                        : `PHASE ${city.phase}`}
                  </em>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <footer className="credits" data-testid="attribution">
        CesiumJS · {attribution}
      </footer>
      {fatal && <FatalScreen title="World unavailable" message={fatal} />}
    </main>
  );
}

function formatAltitude(meters: number): string {
  if (meters >= 1_000) return `${(meters / 1_000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function FatalScreen({
  title,
  message,
}: {
  title: string;
  message: string;
}): ReactNode {
  return (
    <main className="fatal-screen" role="alert">
      <div className="brand-mark large">S</div>
      <p className="eyebrow">SUPERMAN WORLD</p>
      <h1>{title}</h1>
      <p>{message}</p>
      <button type="button" onClick={() => location.reload()}>
        Try again
      </button>
    </main>
  );
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  override state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info);
  }
  override render(): ReactNode {
    return this.state.error ? (
      <FatalScreen
        title="Unexpected error"
        message={this.state.error.message}
      />
    ) : (
      this.props.children
    );
  }
}
