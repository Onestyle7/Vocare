// components/DraggableTile.tsx
"use client";

import React, { useRef, useState } from "react";
import { useInfiniteCanvas } from "./infiniteCanvasContext";

type DraggableTileProps = {
  initialX: number; // pozycja w „świecie” (px)
  initialY: number;
  children: React.ReactNode; // tu wstawisz <Tile .../>
  onChange?: (pos: { x: number; y: number }) => void; // opcjonalny callback
};

const DraggableTile: React.FC<DraggableTileProps> = ({
  initialX,
  initialY,
  children,
  onChange,
}) => {
  const { scale, setPanEnabled } = useInfiniteCanvas();
  const [pos, setPos] = useState({ x: initialX, y: initialY });
  const draggingRef = useRef(false);
  const lastRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setPanEnabled(false);           // wyłącz panning canvasu
    draggingRef.current = true;
    lastRef.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !lastRef.current) return;
    e.stopPropagation();
    const dxScreen = e.clientX - lastRef.current.x;
    const dyScreen = e.clientY - lastRef.current.y;
    lastRef.current = { x: e.clientX, y: e.clientY };

    // przelicz na układ świata: dzielimy przez scale
    const dxWorld = dxScreen / scale;
    const dyWorld = dyScreen / scale;

    setPos((p) => {
      const next = { x: p.x + dxWorld, y: p.y + dyWorld };
      onChange?.(next);
      return next;
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    draggingRef.current = false;
    lastRef.current = null;
    setPanEnabled(true);            // przywróć panning canvasu
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      className="absolute"
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {children}
    </div>
  );
};

export default DraggableTile;
