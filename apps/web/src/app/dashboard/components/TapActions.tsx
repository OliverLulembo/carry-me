"use client";

import type { ReactNode } from "react";
import { Loader2, Nfc, Users, X } from "lucide-react";
import { useRide } from "./RideProvider";

export function TapActions() {
  const {
    activeTap,
    loading,
    busy,
    error,
    modal,
    setModal,
    groupSize,
    setGroupSize,
    tapOn,
    tapOff,
    boardingStopName,
    inboundBuses,
    fareHints,
  } = useRide();

  const handleBoardClick = () => {
    const readyBuses = inboundBuses.filter((b) => b.arrivedAtStop);
    if (readyBuses.length === 0) return;
    if (readyBuses.length === 1) {
      void tapOn(readyBuses[0]!.tripId);
      return;
    }
    setModal("board");
  };

  const readyBuses = inboundBuses.filter((b) => b.arrivedAtStop);

  const hintFor = (stopId: string) => fareHints.find((h) => h.stopId === stopId);

  return (
    <>
      <div className="card p-4 sm:p-5">
        <QuickActionsHeader onBoard={!!activeTap} />
        <QuickActionsBody
          activeTap={activeTap}
          loading={loading}
          error={error}
          busy={busy}
          inboundBuses={inboundBuses}
          readyBuses={readyBuses}
          handleBoardClick={handleBoardClick}
          groupSize={groupSize}
          setModal={setModal}
        />
      </div>

      {modal === "board" && (
        <Modal title="Choose your bus" onClose={() => setModal(null)}>
          <p className="text-xs text-ink-500 mb-3">
            Boarding at <span className="font-medium text-brand-deep">{boardingStopName}</span>
          </p>
          <ul className="space-y-2">
            {readyBuses.map((b) => (
              <li key={b.tripId}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => tapOn(b.tripId)}
                  className="w-full text-left p-3 rounded-xl border border-ink-100 hover:border-brand-primary/40 hover:bg-surface-subtle transition disabled:opacity-60"
                >
                  <p className="font-semibold text-brand-deep">{b.busPlate}</p>
                  <p className="text-xs text-ink-500">{b.routeName}</p>
                  <p className="text-xs text-brand-primary mt-1 font-medium">
                    At your stop · {b.seatsAvailable} seats
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {modal === "off" && activeTap && (
        <Modal title="Tap off — where are you getting off?" onClose={() => setModal(null)}>
          <p className="text-xs text-ink-500 mb-3">
            From {activeTap.onStop.name} on {activeTap.route.name}
          </p>
          <ul className="space-y-2 max-h-72 overflow-y-auto">
            {activeTap.route.stops
              .filter((s) => s.id !== activeTap.onStop.id)
              .map((s) => {
                const hint = hintFor(s.id);
                const atStop = activeTap.currentStop?.id === s.id;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={busy || !hint || !atStop}
                      onClick={() => tapOff(s.id)}
                      className="w-full text-left p-3 rounded-xl border border-ink-100 hover:border-brand-primary/40 hover:bg-surface-subtle transition disabled:opacity-60"
                    >
                      <p className="font-semibold text-brand-deep">{s.name}</p>
                      {atStop && hint ? (
                        <p className="text-xs text-brand-primary mt-0.5">
                          Bus is here · {hint.totalCredits} credits
                          {activeTap.groupSize > 1
                            ? ` (${hint.creditsPerPassenger} × ${activeTap.groupSize})`
                            : ""}
                        </p>
                      ) : hint ? (
                        <p className="text-xs text-ink-400 mt-0.5">
                          Wait until the bus arrives at this stop
                        </p>
                      ) : (
                        <p className="text-xs text-ink-400 mt-0.5">Fare not configured</p>
                      )}
                    </button>
                  </li>
                );
              })}
          </ul>
        </Modal>
      )}

      {modal === "group" && (
        <Modal title="Group size" onClose={() => setModal(null)}>
          <p className="text-xs text-ink-500 mb-4">
            Applies to your next tap on. Total fare is multiplied by group size at tap-off.
          </p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setGroupSize(n);
                  setModal(null);
                }}
                className={`w-10 h-10 rounded-xl font-semibold text-sm border transition ${
                  groupSize === n
                    ? "bg-brand-primary text-white border-brand-primary"
                    : "border-ink-100 text-brand-deep hover:border-brand-primary/40"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}

function QuickActionsBody({
  activeTap,
  loading,
  error,
  busy,
  inboundBuses,
  readyBuses,
  handleBoardClick,
  groupSize,
  setModal,
}: {
  activeTap: ReturnType<typeof useRide>["activeTap"];
  loading: boolean;
  error: string | null;
  busy: boolean;
  inboundBuses: ReturnType<typeof useRide>["inboundBuses"];
  readyBuses: ReturnType<typeof useRide>["inboundBuses"];
  handleBoardClick: () => void;
  groupSize: number;
  setModal: ReturnType<typeof useRide>["setModal"];
}) {
  if (activeTap) {
    return (
      <p className="text-xs text-ink-500">
        You&apos;re on board — trip details and tap off are in the trip hero above.
      </p>
    );
  }

  return (
    <>
      {loading ? (
        <p className="text-xs text-ink-500 flex items-center gap-2 mb-3">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Checking ride status…
        </p>
      ) : null}

      {error && (
        <p className="text-xs text-red-600 mb-3" role="alert">
          {error}
        </p>
      )}

      <div className={readyBuses.length > 0 ? "space-y-3" : "grid grid-cols-2 gap-3"}>
        <ActionButton
          icon={Nfc}
          label={readyBuses.length > 0 ? "Tap to board now" : "Tap to board"}
          sub={
            readyBuses.length > 0
              ? `${readyBuses[0]!.busPlate} is at your stop · ${readyBuses.length} bus${readyBuses.length === 1 ? "" : "es"} ready`
              : inboundBuses.length > 0
                ? "Waiting for bus to arrive"
                : "No active buses nearby"
          }
          tone="primary"
          disabled={busy || readyBuses.length === 0}
          onClick={handleBoardClick}
          prominent={readyBuses.length > 0}
        />
        <ActionButton
          icon={Users}
          label="Boarding as a group"
          sub={`${groupSize} passenger${groupSize === 1 ? "" : "s"} selected`}
          tone="secondary"
          disabled={busy}
          onClick={() => setModal("group")}
        />
      </div>
    </>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-brand-deep">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-ink-500 hover:bg-surface-subtle"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  sub,
  tone,
  disabled,
  onClick,
  prominent,
}: {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  sub: string;
  tone: "primary" | "secondary";
  disabled?: boolean;
  onClick?: () => void;
  prominent?: boolean;
}) {
  if (prominent) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-brand-primary bg-brand-primary text-white hover:bg-brand-primary-600 transition text-left disabled:opacity-60 shadow-pop"
      >
        <span className="w-12 h-12 grid place-items-center rounded-xl bg-white/20 shrink-0">
          <Icon className="w-6 h-6" size={24} />
        </span>
        <div className="min-w-0">
          <p className="text-base font-bold">{label}</p>
          <p className="text-sm text-white/80 mt-0.5">{sub}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group flex items-start gap-3 p-4 rounded-2xl border border-ink-100 hover:border-brand-primary/30 hover:bg-surface-subtle transition text-left disabled:opacity-60"
    >
      <span
        className={`w-10 h-10 grid place-items-center rounded-xl shrink-0 ${
          tone === "primary"
            ? "bg-brand-primary text-white"
            : "bg-brand-secondary text-brand-deep"
        }`}
      >
        <Icon className="w-5 h-5" size={20} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-deep">{label}</p>
        <p className="text-xs text-ink-500 mt-0.5">{sub}</p>
      </div>
    </button>
  );
}

function QuickActionsHeader({ onBoard }: { onBoard: boolean }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-brand-deep">Quick actions</h3>
      <p className="text-xs text-ink-500">
        {onBoard ? "Boarding complete" : "Tap on / tap off"}
      </p>
    </div>
  );
}
