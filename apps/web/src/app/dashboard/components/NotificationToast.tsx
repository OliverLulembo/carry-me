"use client";

import { Bus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { PassengerNotification } from "./passenger-notifications";

export function NotificationToast({
  notification,
  onDismiss,
}: {
  notification: PassengerNotification | null;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!notification) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 12_000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification || !visible) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed top-20 right-4 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-96 shadow-lg"
    >
      <div className="rounded-2xl border border-brand-primary/30 bg-white shadow-pop p-4 flex gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-primary/10 grid place-items-center text-brand-primary">
          <Bus className="w-5 h-5" size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink-700 text-sm">{notification.title}</p>
          <p className="mt-1 text-xs text-ink-500 leading-relaxed">{notification.message}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            onDismiss();
          }}
          className="shrink-0 w-8 h-8 grid place-items-center rounded-full text-ink-500 hover:bg-surface-subtle transition"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" size={16} />
        </button>
      </div>
    </div>
  );
}
