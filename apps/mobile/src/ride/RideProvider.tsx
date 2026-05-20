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
import type { InboundBus } from "@/api/client";
import {
  getActiveTap,
  getInboundBuses,
  tapOff,
  tapOn,
  type ActiveTap,
  type FareHint,
} from "@/api/endpoints";
import { useAuth } from "@/auth/session";
import {
  createBoardingNotification,
  type PassengerNotification,
} from "@/lib/passenger-notifications";
import { NotificationToast } from "@/components/NotificationToast";

export type RideModal = null | "board" | "off" | "group";

export type BoardingContext = {
  boardingStopId: string | null;
  boardingStopName: string;
  destinationStopId: string | null;
  isWaitingAtStop: boolean;
  inboundBuses: InboundBus[];
};

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
  syncBoardingContext: (ctx: BoardingContext) => void;
};

const RideContext = createContext<RideContextValue | null>(null);

const defaultBoarding: BoardingContext = {
  boardingStopId: null,
  boardingStopName: "Nearest stop",
  destinationStopId: null,
  isWaitingAtStop: false,
  inboundBuses: [],
};

export function RideProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [boarding, setBoarding] = useState<BoardingContext>(defaultBoarding);
  const [activeTap, setActiveTap] = useState<ActiveTap | null>(null);
  const [fareHints, setFareHints] = useState<FareHint[]>([]);
  const [inboundBusesState, setInboundBusesState] = useState<InboundBus[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<RideModal>(null);
  const [groupSize, setGroupSize] = useState(1);
  const [notifications, setNotifications] = useState<PassengerNotification[]>([]);
  const [latestToast, setLatestToast] = useState<PassengerNotification | null>(null);
  const knownReadyTripIdsRef = useRef<Set<string> | null>(null);

  const {
    boardingStopId,
    boardingStopName,
    destinationStopId,
    isWaitingAtStop,
    inboundBuses,
  } = boarding;

  const syncBoardingContext = useCallback((ctx: BoardingContext) => {
    setBoarding(ctx);
  }, []);

  const notifyBusBoarding = useCallback(
    (bus: InboundBus) => {
      const notification = createBoardingNotification({
        tripId: bus.tripId,
        busPlate: bus.busPlate,
        routeName: bus.route.name,
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
      } else if (isWaitingAtStop) {
        for (const bus of buses) {
          if (bus.arrivedAtStop && !knownReadyTripIdsRef.current.has(bus.tripId)) {
            notifyBusBoarding(bus);
          }
        }
        knownReadyTripIdsRef.current = readyIds;
      }

      setInboundBusesState(buses);
    },
    [isWaitingAtStop, notifyBusBoarding],
  );

  const refreshActive = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!token) return;
      if (!opts?.silent) setLoading(true);
      try {
        const data = await getActiveTap(token);
        setActiveTap(data.tap ?? null);
        setFareHints(data.fareHints ?? []);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load ride status");
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    processInboundBuses(inboundBuses);
  }, [inboundBuses, processInboundBuses]);

  useEffect(() => {
    knownReadyTripIdsRef.current = null;
    setLatestToast(null);
  }, [boardingStopId]);

  const refreshInboundBuses = useCallback(async () => {
    if (!token || !boardingStopId) return;
    try {
      const data = await getInboundBuses(token, boardingStopId);
      processInboundBuses(data.buses);
    } catch {
      /* keep last known buses */
    }
  }, [token, boardingStopId, processInboundBuses]);

  useEffect(() => {
    if (token) void refreshActive();
  }, [token, refreshActive]);

  useEffect(() => {
    if (activeTap || !boardingStopId || !token) return;
    void refreshInboundBuses();
    const id = setInterval(() => {
      void refreshInboundBuses();
    }, 10_000);
    return () => clearInterval(id);
  }, [activeTap, boardingStopId, token, refreshInboundBuses]);

  useEffect(() => {
    if (!activeTap || !token) return;
    const id = setInterval(() => {
      void refreshActive({ silent: true });
    }, 10_000);
    return () => clearInterval(id);
  }, [activeTap, token, refreshActive]);

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

  const handleTapOn = useCallback(
    async (tripId: string) => {
      if (!token) return;
      if (!boardingStopId) {
        setError("Log your arrival at a stop first, or pick a stop below.");
        return;
      }
      setBusy(true);
      setError(null);
      try {
        await tapOn(token, {
          tripId,
          stopId: boardingStopId,
          destinationStopId,
          groupSize,
        });
        setModal(null);
        await refreshActive();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not board");
      } finally {
        setBusy(false);
      }
    },
    [token, boardingStopId, destinationStopId, groupSize, refreshActive],
  );

  const handleTapOff = useCallback(
    async (stopId: string) => {
      if (!token) return;
      setBusy(true);
      setError(null);
      try {
        await tapOff(token, { stopId, tapId: activeTap?.id });
        setModal(null);
        setActiveTap(null);
        setFareHints([]);
        await refreshActive();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update ride");
      } finally {
        setBusy(false);
      }
    },
    [token, activeTap?.id, refreshActive],
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
      tapOn: handleTapOn,
      tapOff: handleTapOff,
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
      syncBoardingContext,
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
      handleTapOn,
      handleTapOff,
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
      syncBoardingContext,
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

export function useRideOptional() {
  return useContext(RideContext);
}

/** Syncs dashboard boarding context into RideProvider (call from home screen). */
export function RideSync({ context }: { context: BoardingContext }) {
  const syncBoardingContext = useRide().syncBoardingContext;
  useEffect(() => {
    syncBoardingContext(context);
  }, [
    context.boardingStopId,
    context.boardingStopName,
    context.destinationStopId,
    context.isWaitingAtStop,
    context.inboundBuses,
    syncBoardingContext,
  ]);
  return null;
}
