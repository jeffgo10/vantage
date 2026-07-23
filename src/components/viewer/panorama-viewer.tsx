"use client";

import { useEffect, useRef } from "react";

type HotspotMarker = {
  id: string;
  pitch: number;
  yaw: number;
  text?: string;
  type?: "navigation" | "info";
  onClick?: () => void;
};

type PanoramaViewerProps = {
  imageUrl: string;
  hotspots?: HotspotMarker[];
  className?: string;
};

/**
 * Thin Pannellum wrapper — Phase 2 will flesh out editor + public viewer UX.
 * Requires pannellum CSS/JS loaded via CDN for scaffold simplicity.
 */
export function PanoramaViewer({ imageUrl, hotspots = [], className }: PanoramaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Pannellum.Viewer | null>(null);

  const hotspotsKey = JSON.stringify(
    hotspots.map(({ id, pitch, yaw, text, type }) => ({ id, pitch, yaw, text, type })),
  );

  useEffect(() => {
    let cancelled = false;
    const markers = hotspots;

    async function load() {
      if (!containerRef.current) return;

      await ensurePannellumAssets();
      if (cancelled || !containerRef.current || !window.pannellum) return;

      viewerRef.current?.destroy();

      const config: Pannellum.ConfigOptions = {
        type: "equirectangular",
        panorama: imageUrl,
        autoLoad: true,
        showZoomCtrl: true,
        showFullscreenCtrl: true,
        mouseZoom: true,
        hotSpots: markers.map((h) => ({
          id: h.id,
          pitch: h.pitch,
          yaw: h.yaw,
          type: "info",
          text: h.text ?? (h.type === "navigation" ? "Go" : "Info"),
          cssClass: h.type === "navigation" ? "vantage-hotspot-nav" : "vantage-hotspot-info",
          clickHandlerFunc: h.onClick ? () => h.onClick?.() : undefined,
        })),
      };

      viewerRef.current = window.pannellum.viewer(containerRef.current, config);
    }

    load();

    return () => {
      cancelled = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount on geometry changes only
  }, [imageUrl, hotspotsKey]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-full w-full min-h-[320px] bg-zinc-900"}
      role="img"
      aria-label="360 panorama viewer"
    />
  );
}

function ensurePannellumAssets(): Promise<void> {
  if (window.pannellum) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const cssId = "pannellum-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css";
      document.head.appendChild(link);
    }

    const scriptId = "pannellum-js";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      if (window.pannellum) resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Pannellum"));
    document.body.appendChild(script);
  });
}
