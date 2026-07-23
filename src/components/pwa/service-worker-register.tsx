"use client";

import { useEffect } from "react";

/** Registers the service worker for PWA install / offline shell. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Non-fatal during early scaffold
    });
  }, []);

  return null;
}
