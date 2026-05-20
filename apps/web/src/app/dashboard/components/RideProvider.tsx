"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { InboundBus } from "./InboundBuses";
import { NotificationToast } from "./NotificationToast";
import {
  createBoardingNotification,
  type PassengerNotification,
} from "./passenger-notifications";

export type RouteStop = { id: string; name: string; order: number };

export type ActiveTap = {
  id: string;
  tripId: string;
  status: string;
  groupSize: number;
  tappedOnAt: string;
  onStop: { id: string; name: string };
  offStop: { id: string; name: string } | null;
  distanceToDestinationMeters: number | null;
  etaToDestinationMinutes: number | null;
  busPlate: string;
  currentStop: { id: string; name: string } | null;
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
  notifications: PassengerNotification[];
  unreadNotificationCount: number;
  latestToast: PassengerNotification | null;
  dismissToast: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
};

const RideContext = createContext<RideContextValue | null>(null);

export function RideProvider({
  children,
  boardingStopId,
  boardingStopName,
  inboundBuses,
  destinationStopId,
  isWaitingAtStop = false,
}: {
  children: ReactNode;
  boardingStopId: string | null;
  boardingStopName: string;
  inboundBuses: InboundBus[];
  destinationStopId: string | null;
  /** True when the passenger has logged "I'm here" at a stop. */
  isWaitingAtStop?: boolean;
}) {
  const router = useRouter();
  const [activeTap, setActiveTap] = useState<ActiveTap | null>(null);
  const [fareHints, setFareHints] = useState<FareHint[]>([]);
  const [inboundBusesState, setInboundBusesState] = useState(inboundBuses);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<RideModal>(null);
  const [groupSize, setGroupSize] = useState(1);
  const [notifications, setNotifications] = useState<PassengerNotification[]>([]);
  const [latestToast, setLatestToast] = useState<PassengerNotification | null>(null);
  const knownReadyTripIdsRef = useRef<Set<string> | null>(null);

  const notifyBusBoarding = useCallback(
    (bus: InboundBus) => {
      const notification = createBoardingNotification({
        tripId: bus.tripId,
        busPlate: bus.busPlate,
        routeName: bus.routeName,
        stopName: boardingStopName,
      });
      setNotifications((prev) => [notification, ...prev].slice(0, 20));
      setLatestToast(notification);
    },
    [boardingStopName],
  );

  const processInboundBuses = useCallback(
    (buses: InboundBus[]) => {
      const readyIds = new Set(
        buses.filter((b) => b.arrivedAtStop).map((b) => b.tripId),
      );

      if (knownReadyTripIdsRef.current === null) {
        knownReadyTripIdsRef.current = readyIds;
      } else {
        if (isWaitingAtStop) {
          for (const bus of buses) {
            if (bus.arrivedAtStop && !knownReadyTripIdsRef.current.has(bus.tripId)) {
              notifyBusBoarding(bus);
            }
          }
        }
        knownReadyTripIdsRef.current = readyIds;
      }

      setInboundBusesState(buses);
    },
    [isWaitingAtStop, notifyBusBoarding],
  );

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
    processInboundBuses(inboundBuses);
  }, [inboundBuses, processInboundBuses]);

  // Reset boarding detection when the waiting stop changes.
  useEffect(() => {
    knownReadyTripIdsRef.current = null;
    setLatestToast(null);
  }, [boardingStopId]);

  const refreshInboundBuses = useCallback(async () => {
    if (!boardingStopId) return;
    try {
      const res = await fetch(`/api/stops/${boardingStopId}/inbound-buses`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return;
      const buses: InboundBus[] = (data.buses ?? []).map(
        (b: {
          tripId: string;
          busPlate: string;
          route: { name: string };
          seatsAvailable: number;
          capacity: number;
          etaMinutes: number | null;
          arrivedAtStop: boolean;
        }) => ({
          tripId: b.tripId,
          busPlate: b.busPlate,
          routeName: b.route.name,
          seatsAvailable: b.seatsAvailable,
          capacity: b.capacity,
          etaMinutes: b.etaMinutes,
          arrivedAtStop: b.arrivedAtStop,
        }),
      );
      processInboundBuses(buses);
    } catch {
      /* keep last known buses */
    }
  }, [boardingStopId, processInboundBuses]);

  useEffect(() => {
    refreshActive();
  }, [refreshActive]);

  // Poll inbound buses while waiting to board.
  useEffect(() => {
    if (activeTap || !boardingStopId) return;
    void refreshInboundBuses();
    const id = setInterval(() => {
      void refreshInboundBuses();
    }, 10_000);
    return () => clearInterval(id);
  }, [activeTap, boardingStopId, refreshInboundBuses]);

  // Keep ride status fresh while on board.
  useEffect(() => {
    if (!activeTap) return;
    const id = setInterval(() => {
      void refreshActive({ silent: true });
    }, 10_000);
    return () => clearInterval(id);
  }, [activeTap, refreshActive]);

  const dismissToast = useCallback(() => setLatestToast(null), []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setLatestToast(null);
  }, []);

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

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
          body: JSON.stringify({
            tripId,
            stopId: boardingStopId,
            destinationStopId,
            groupSize,
          }),
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
    [boardingStopId, destinationStopId, groupSize, refreshActive, router],
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
        if (!res.ok) throw new Error(data.error ?? "Could not update ride");
        setModal(null);
        setActiveTap(null);
        setFareHints([]);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update ride");
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
      inboundBuses: inboundBusesState,
      destinationStopId,
      notifications,
      unreadNotificationCount,
      latestToast,
      dismissToast,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
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
      inboundBusesState,
      destinationStopId,
      notifications,
      unreadNotificationCount,
      latestToast,
      dismissToast,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
    ],
  );

  return (
    <RideContext.Provider value={value}>
      {children}
      <NotificationToast notification={latestToast} onDismiss={dismissToast} />
    </RideContext.Provider>
  );
}

export function useRide() {
  const ctx = useContext(RideContext);
  if (!ctx) {
    throw new Error("useRide must be used within RideProvider");
  }
  return ctx;
}

/** Returns ride context when inside RideProvider; null on other pages. */
export function useRideOptional() {
  return useContext(RideContext);
}
