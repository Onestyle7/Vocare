// components/InfiniteDotCanvas.tsx
"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { InfiniteCanvasContext } from "./RoadmapComponents/infiniteCanvasContext";

type Props = {
  className?: string;
  dotColor?: string;
  gap?: number;
  dotSize?: number;
  minScale?: number;
  maxScale?: number;
  children?: React.ReactNode;
};

export const InfiniteDotCanvas: React.FC<Props> = ({
  className,
  dotColor = "#d4d4d4",
  gap = 30,
  dotSize = 1,
  minScale = 0.5,
  maxScale = 3,
  children,
}) => {
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  // czy wolno panować (dziecko może wyłączyć na czas dragowania)
  const panEnabledRef = useRef(true);
  const setPanEnabled = (v: boolean) => { panEnabledRef.current = v; };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!panEnabledRef.current) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!panEnabledRef.current) return;
    if (!isDraggingRef.current || !lastPosRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => ({ x: o.x + dx, y: o.y + dy }));
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!panEnabledRef.current) return;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    isDraggingRef.current = false;
    lastPosRef.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    // Ctrl/Cmd + scroll = zoom
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = 1 + delta * 0.0015;
      setScale((s) => Math.min(maxScale, Math.max(minScale, s * factor)));
    }
  };

  const tile = gap * scale;
  const bx = ((offset.x % tile) + tile) % tile;
  const by = ((offset.y % tile) + tile) % tile;

  return (
    <InfiniteCanvasContext.Provider value={{ scale, setPanEnabled }}>
      <div
        className={cn("relative w-full h-full overflow-hidden select-none", className)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        style={{ cursor: panEnabledRef.current && isDraggingRef.current ? "grabbing" : "grab" }}
      >
        {/* nieskończone kropki */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
            backgroundSize: `${tile}px ${tile}px`,
            backgroundPosition: `${bx}px ${by}px`,
          }}
        />
        {/* warstwa canvas: przesuwa się i skaluje */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          <div className="pointer-events-auto">
            {children}
          </div>
        </div>
      </div>
    </InfiniteCanvasContext.Provider>
  );
};
