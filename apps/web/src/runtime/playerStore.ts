import type { MovementMode } from "@superman/simulation";
import type { RendererMetrics } from "@superman/telemetry";
import type { SourceState } from "./WorldProviders";
import { create } from "zustand";

export interface PlayerUiState {
  mode: MovementMode;
  qualityLabel: string;
  loadingMessage: string;
  metrics: RendererMetrics | null;
  attribution: string;
  sources: Record<
    "terrain" | "imagery" | "buildings" | "manhattan" | "collision",
    SourceState
  >;
  setSnapshot: (snapshot: Partial<Omit<PlayerUiState, "setSnapshot">>) => void;
}

export const usePlayerStore = create<PlayerUiState>((set) => ({
  mode: "loading",
  qualityLabel: "Preparing world",
  loadingMessage: "Initializing high-fidelity globe…",
  metrics: null,
  attribution: "CesiumJS",
  sources: {
    terrain: "loading",
    imagery: "loading",
    buildings: "loading",
    manhattan: "loading",
    collision: "loading",
  },
  setSnapshot: (snapshot) => set(snapshot),
}));
