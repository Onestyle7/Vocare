'use client';

import { useEffect, useRef, useState } from 'react';

type Point = {
  x: number;
  y: number;
};

const DOT_SIZE = 1;
const DOT_SPACING = 36;
const KEYBOARD_PAN_STEP = 48;
const INITIAL_SCALE = 1;
const MIN_SCALE = 0.4;
const MAX_SCALE = 3;
const ZOOM_STEP = 0.1;

const Roadmap = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<Point>({ x: 0, y: 0 });
  const dragOffsetStartRef = useRef<Point>({ x: 0, y: 0 });
  const positionRef = useRef<Point>({ x: 0, y: 0 });
  const scaleRef = useRef(INITIAL_SCALE);

  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [scale, setScale] = useState(INITIAL_SCALE);
  const [worldCursor, setWorldCursor] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const updatePosition = (next: Point) => {
    positionRef.current = next;
    setPosition(next);
  };

  const updateScale = (next: number) => {
    scaleRef.current = next;
    setScale(next);
  };

  const clampScale = (next: number) => {
    if (next < MIN_SCALE) return MIN_SCALE;
    if (next > MAX_SCALE) return MAX_SCALE;
    return Math.round(next * 100) / 100;
  };

  const getWorldPoint = (clientX: number, clientY: number, offset: Point = positionRef.current) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const currentScale = scaleRef.current;

    return {
      x: Math.round((clientX - rect.left - offset.x) / currentScale),
      y: Math.round((clientY - rect.top - offset.y) / currentScale),
    };
  };

  const zoomAt = (targetScale: number, clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentScale = scaleRef.current;
    const nextScale = clampScale(targetScale);
    if (nextScale === currentScale) return;

    const anchorX = clientX - rect.left;
    const anchorY = clientY - rect.top;
    const worldX = (anchorX - positionRef.current.x) / currentScale;
    const worldY = (anchorY - positionRef.current.y) / currentScale;

    updateScale(nextScale);
    updatePosition({
      x: anchorX - worldX * nextScale,
      y: anchorY - worldY * nextScale,
    });
  };

  const zoomAroundViewportCenter = (delta: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    zoomAt(scaleRef.current + delta, rect.left + rect.width / 2, rect.top + rect.height / 2);
    containerRef.current?.focus();
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = { x: event.clientX, y: event.clientY };
    dragOffsetStartRef.current = positionRef.current;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      setWorldCursor(getWorldPoint(event.clientX, event.clientY));
      return;
    }

    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;
    const nextPosition = {
      x: dragOffsetStartRef.current.x + dx,
      y: dragOffsetStartRef.current.y + dy,
    };

    updatePosition(nextPosition);
    setWorldCursor(getWorldPoint(event.clientX, event.clientY, nextPosition));
  };

  const stopDragging = (event: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      const direction = event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      zoomAt(scaleRef.current + direction, event.clientX, event.clientY);
      return;
    }

    updatePosition({
      x: positionRef.current.x - event.deltaX,
      y: positionRef.current.y - event.deltaY,
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let dx = 0;
    let dy = 0;

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        dy += KEYBOARD_PAN_STEP;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        dy -= KEYBOARD_PAN_STEP;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        dx += KEYBOARD_PAN_STEP;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        dx -= KEYBOARD_PAN_STEP;
        break;
      default:
        return;
    }

    event.preventDefault();
    updatePosition({
      x: positionRef.current.x + dx,
      y: positionRef.current.y + dy,
    });
  };

  const handleResetToCenter = () => {
    updatePosition({ x: 0, y: 0 });
    updateScale(INITIAL_SCALE);
    containerRef.current?.focus();
  };

  return (
    <section className="relative h-screen w-full overflow-hidden bg-white text-slate-900">
      <div
        ref={containerRef}
        tabIndex={0}
        className={`absolute inset-0 touch-none outline-none select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          backgroundColor: '#ffffff',
          backgroundImage: `radial-gradient(circle, rgba(15, 23, 42, 0.3) ${Math.max(0.6, DOT_SIZE * scale)}px, transparent ${Math.max(0.6, DOT_SIZE * scale)}px)`,
          backgroundSize: `${DOT_SPACING * scale}px ${DOT_SPACING * scale}px`,
          backgroundPosition: `${position.x}px ${position.y}px`,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
      />

      <div className="pointer-events-none absolute top-4 left-4 rounded-xl border border-red-500 bg-white px-4 py-3 font-mono text-xs backdrop-blur">
        <p>
          offset.x: <span className="text-sky-300">{Math.round(position.x)}</span>
        </p>
        <p>
          offset.y: <span className="text-sky-300">{Math.round(position.y)}</span>
        </p>
        <p className="mt-2">
          cursor.x: <span className="text-emerald-300">{worldCursor.x}</span>
        </p>
        <p>
          cursor.y: <span className="text-emerald-300">{worldCursor.y}</span>
        </p>
        <p className="mt-2">
          scale: <span className="text-violet-600">{(scale * 100).toFixed(0)}%</span>
        </p>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-xl border border-slate-300 bg-white p-2 shadow-sm">
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100"
          onClick={() => zoomAroundViewportCenter(-ZOOM_STEP)}
        >
          -
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100"
          onClick={() => zoomAroundViewportCenter(ZOOM_STEP)}
        >
          +
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100"
          onClick={handleResetToCenter}
        >
          Reset
        </button>
      </div>
    </section>
  );
};

export default Roadmap;
