import type { MovementMode } from "@superman/simulation";
import type { RendererMetrics } from "@superman/telemetry";
import { create } from "zustand";

export interface PlayerUiState {
  mode: MovementMode;
  qualityLabel: string;
  loadingMessage: string;
  metrics: RendererMetrics | null;
  setSnapshot: (snapshot: Partial<Omit<PlayerUiState, "setSnapshot">>) => void;
}

export const usePlayerStore = create<PlayerUiState>((set) => ({
  mode: "loading",
  qualityLabel: "Preparing world",
  loadingMessage: "Initializing high-fidelity globe…",
  metrics: null,
  setSnapshot: (snapshot) => set(snapshot),
}));
