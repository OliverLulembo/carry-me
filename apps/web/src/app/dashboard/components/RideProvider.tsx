"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { InboundBus } from "./InboundBuses";

export type RouteStop = { id: string; name: string; order: number };

export type ActiveTap = {
  id: string;
  tripId: string;
  status: string;
  groupSize: number;
  tappedOnAt: string;
  onStop: { id: string; name: string };
  offStop: { id: string; name: string } | null;
  busPlate: string;
  nextStop: { id: string; name: string } | null;
  route: { id: string; name: string; stops: RouteStop[] };
};

export type FareHint = {
  stopId: string;
  creditsPerPassenger: number;
  totalCredits: number;
};

export type RideModal = null | "board" | "off" | "group";

type RideContextValue = {
  activeTap: ActiveTap | null;
  fareHints: FareHint[];
  loading: boolean;
  busy: boolean;
  error: string | null;
  modal: RideModal;
  setModal: (modal: RideModal) => void;
  groupSize: number;
  setGroupSize: (n: number) => void;
  refreshActive: () => Promise<void>;
  tapOn: (tripId: string) => Promise<void>;
  tapOff: (stopId: string) => Promise<void>;
  setError: (msg: string | null) => void;
  boardingStopId: string | null;
  boardingStopName: string;
  inboundBuses: InboundBus[];
  destinationStopId: string | null;
};

const RideContext = createContext<RideContextValue | null>(null);

export function RideProvider({
  children,
  boardingStopId,
  boardingStopName,
  inboundBuses,
  destinationStopId,
}: {
  children: ReactNode;
  boardingStopId: string | null;
  boardingStopName: string;
  inboundBuses: InboundBus[];
  destinationStopId: string | null;
}) {
  const router = useRouter();
  const [activeTap, setActiveTap] = useState<ActiveTap | null>(null);
  const [fareHints, setFareHints] = useState<FareHint[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<RideModal>(null);
  const [groupSize, setGroupSize] = useState(1);

  const refreshActive = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const res = await fetch("/api/me/taps/active", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load ride status");
      setActiveTap(data.tap ?? null);
      setFareHints(data.fareHints ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ride status");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshActive();
  }, [refreshActive]);

  // Keep next-stop (bus GPS) fresh while the passenger is on board.
  useEffect(() => {
    if (!activeTap) return;
    const id = setInterval(() => {
      void refreshActive({ silent: true });
    }, 15_000);
    return () => clearInterval(id);
  }, [activeTap, refreshActive]);

  const tapOn = useCallback(
    async (tripId: string) => {
      if (!boardingStopId) {
        setError("Log your arrival at a stop first, or pick a stop below.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/taps/on", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tripId, stopId: boardingStopId, groupSize }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not board");
        setModal(null);
        await refreshActive();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not board");
      } finally {
        setBusy(false);
      }
    },
    [boardingStopId, groupSize, refreshActive, router],
  );

  const tapOff = useCallback(
    async (stopId: string) => {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch("/api/taps/off", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stopId, tapId: activeTap?.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not complete tap off");
        setModal(null);
        setActiveTap(null);
        setFareHints([]);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not complete tap off");
      } finally {
        setBusy(false);
      }
    },
    [activeTap?.id, router],
  );

  const value = useMemo(
    () => ({
      activeTap,
      fareHints,
      loading,
      busy,
      error,
      modal,
      setModal,
      groupSize,
      setGroupSize,
      refreshActive,
      tapOn,
      tapOff,
      setError,
      boardingStopId,
      boardingStopName,
      inboundBuses,
      destinationStopId,
    }),
    [
      activeTap,
      fareHints,
      loading,
      busy,
      error,
      modal,
      groupSize,
      refreshActive,
      tapOn,
      tapOff,
      boardingStopId,
      boardingStopName,
      inboundBuses,
      destinationStopId,
    ],
  );

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
}

export function useRide() {
  const ctx = useContext(RideContext);
  if (!ctx) {
    throw new Error("useRide must be used within RideProvider");
  }
  return ctx;
}
