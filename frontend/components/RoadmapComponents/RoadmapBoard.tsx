"use client";

import { useInfiniteCanvas } from "./infiniteCanvasContext";
import DraggableTile from "./DraggableTile";
import Tile from "./Tile";
import { cn } from "@/lib/utils";
import React, {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Side = "top" | "right" | "bottom" | "left";

type Point = {
  x: number;
  y: number;
};

type RoadmapTileInput = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  className?: string;
  initialX: number;
  initialY: number;
};

type RoadmapTileState = Omit<RoadmapTileInput, "initialX" | "initialY"> & {
  x: number;
  y: number;
};

type ConnectionEndpoint = {
  tileId: string;
  side: Side;
};

type Connection = {
  id: string;
  from: ConnectionEndpoint;
  to: ConnectionEndpoint;
};

type DraftConnection = {
  from: ConnectionEndpoint;
  toPosition: Point;
};

interface RoadmapBoardProps {
  initialTiles: RoadmapTileInput[];
}

const TILE_WIDTH = 175;
const TILE_HEIGHT = 175;
const HANDLE_GAP = 18;
const HANDLE_SIZE = 14;

const handleStyleMap: Record<Side, CSSProperties> = {
  top: {
    top: -HANDLE_GAP - HANDLE_SIZE / 2,
    left: TILE_WIDTH / 2 - HANDLE_SIZE / 2,
  },
  bottom: {
    top: TILE_HEIGHT + HANDLE_GAP - HANDLE_SIZE / 2,
    left: TILE_WIDTH / 2 - HANDLE_SIZE / 2,
  },
  left: {
    left: -HANDLE_GAP - HANDLE_SIZE / 2,
    top: TILE_HEIGHT / 2 - HANDLE_SIZE / 2,
  },
  right: {
    left: TILE_WIDTH + HANDLE_GAP - HANDLE_SIZE / 2,
    top: TILE_HEIGHT / 2 - HANDLE_SIZE / 2,
  },
};

const getHandleWorldPosition = (
  tile: RoadmapTileState,
  side: Side
): Point => {
  switch (side) {
    case "top":
      return { x: tile.x + TILE_WIDTH / 2, y: tile.y - HANDLE_GAP };
    case "bottom":
      return { x: tile.x + TILE_WIDTH / 2, y: tile.y + TILE_HEIGHT + HANDLE_GAP };
    case "left":
      return { x: tile.x - HANDLE_GAP, y: tile.y + TILE_HEIGHT / 2 };
    case "right":
      return { x: tile.x + TILE_WIDTH + HANDLE_GAP, y: tile.y + TILE_HEIGHT / 2 };
    default:
      return { x: tile.x, y: tile.y };
  }
};

const connectionId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const RoadmapBoard: React.FC<RoadmapBoardProps> = ({ initialTiles }) => {
  const [tiles, setTiles] = useState<RoadmapTileState[]>(() =>
    initialTiles.map((tile) => ({
      ...tile,
      x: tile.initialX,
      y: tile.initialY,
    }))
  );
  const [activeTileId, setActiveTileId] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [draftConnection, setDraftConnection] = useState<DraftConnection | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<ConnectionEndpoint | null>(null);
  const { scale, setPanEnabled } = useInfiniteCanvas();
  const pointerStartRef = useRef<Point | null>(null);
  const worldStartRef = useRef<Point | null>(null);
  const draftRef = useRef<DraftConnection | null>(null);
  const hoveredRef = useRef<ConnectionEndpoint | null>(null);
  const isConnecting = Boolean(draftConnection);

  useEffect(() => {
    draftRef.current = draftConnection;
  }, [draftConnection]);

  useEffect(() => {
    hoveredRef.current = hoveredTarget;
  }, [hoveredTarget]);

  const updateTilePosition = useCallback(
    (tileId: string, pos: Point) => {
      setTiles((prev) =>
        prev.map((tile) => (tile.id === tileId ? { ...tile, x: pos.x, y: pos.y } : tile))
      );
    },
    []
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!pointerStartRef.current || !worldStartRef.current) return;
      const dx = (event.clientX - pointerStartRef.current.x) / scale;
      const dy = (event.clientY - pointerStartRef.current.y) / scale;
      const nextPoint = {
        x: worldStartRef.current.x + dx,
        y: worldStartRef.current.y + dy,
      };
      setDraftConnection((current) =>
        current ? { ...current, toPosition: nextPoint } : current
      );
    },
    [scale]
  );

  const finalizeConnection = useCallback(() => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", finalizeConnection);
    const draft = draftRef.current;
    const target = hoveredRef.current;

    if (
      draft &&
      target &&
      !(draft.from.tileId === target.tileId && draft.from.side === target.side)
    ) {
      setConnections((prev) => [
        ...prev,
        { id: connectionId(), from: draft.from, to: target },
      ]);
    }

    pointerStartRef.current = null;
    worldStartRef.current = null;
    setDraftConnection(null);
    setHoveredTarget(null);
    setPanEnabled(true);
  }, [handlePointerMove, setPanEnabled]);

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finalizeConnection);
    };
  }, [handlePointerMove, finalizeConnection]);

  const beginConnection = useCallback(
    (tile: RoadmapTileState, side: Side, handlePoint: Point) => {
      return (event: React.PointerEvent<HTMLDivElement>) => {
        if (draftConnection) return;
        event.stopPropagation();
        setActiveTileId(tile.id);
        pointerStartRef.current = { x: event.clientX, y: event.clientY };
        worldStartRef.current = handlePoint;
        setDraftConnection({ from: { tileId: tile.id, side }, toPosition: handlePoint });
        setPanEnabled(false);
        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", finalizeConnection);
      };
    },
    [draftConnection, finalizeConnection, handlePointerMove, setPanEnabled]
  );

  const maybeSetTarget = useCallback(
    (tileId: string, side: Side) => {
      if (!draftConnection) return;
      if (draftConnection.from.tileId === tileId && draftConnection.from.side === side) return;
      setHoveredTarget({ tileId, side });
    },
    [draftConnection]
  );

  const clearTarget = useCallback(
    (tileId: string, side: Side) => {
      setHoveredTarget((current) => {
        if (!current) return current;
        if (current.tileId === tileId && current.side === side) {
          return null;
        }
        return current;
      });
    },
    []
  );

  const lines = useMemo(() => {
    return connections
      .map((connection) => {
        const fromTile = tiles.find((t) => t.id === connection.from.tileId);
        const toTile = tiles.find((t) => t.id === connection.to.tileId);
        if (!fromTile || !toTile) return null;

        const fromPoint = getHandleWorldPosition(fromTile, connection.from.side);
        const toPoint = getHandleWorldPosition(toTile, connection.to.side);

        return (
          <line
            key={connection.id}
            x1={fromPoint.x}
            y1={fromPoint.y}
            x2={toPoint.x}
            y2={toPoint.y}
            stroke="#2563eb"
            strokeWidth={2}
            strokeLinecap="round"
          />
        );
      })
      .filter(Boolean) as React.ReactNode[];
  }, [connections, tiles]);

  const draftLine = useMemo(() => {
    if (!draftConnection) return null;
    const sourceTile = tiles.find((t) => t.id === draftConnection.from.tileId);
    if (!sourceTile) return null;
    const fromPoint = getHandleWorldPosition(sourceTile, draftConnection.from.side);
    return (
      <line
        x1={fromPoint.x}
        y1={fromPoint.y}
        x2={draftConnection.toPosition.x}
        y2={draftConnection.toPosition.y}
        stroke="#60a5fa"
        strokeWidth={2}
        strokeDasharray="6 4"
        strokeLinecap="round"
      />
    );
  }, [draftConnection, tiles]);

  return (
    <div className="relative w-full h-full">
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: 0, height: 0, overflow: "visible" }}
      >
        {lines}
        {draftLine}
      </svg>
      {tiles.map((tile) => {
        const showHandles = activeTileId === tile.id || isConnecting;
        return (
          <DraggableTile
            key={tile.id}
            initialX={tile.x}
            initialY={tile.y}
            onChange={(pos) => updateTilePosition(tile.id, pos)}
          >
            <div
              className={cn(
                "relative rounded-[36px]",
                activeTileId === tile.id ? "ring-2 ring-blue-400" : "ring-1 ring-transparent"
              )}
              style={{ width: TILE_WIDTH, height: TILE_HEIGHT }}
            >
              <Tile
                title={tile.title}
                description={tile.description}
                imageUrl={tile.imageUrl}
                className={tile.className}
                onClick={() =>
                  setActiveTileId((current) => (current === tile.id ? null : tile.id))
                }
              />
              {showHandles &&
                (["top", "right", "bottom", "left"] as Side[]).map((side) => {
                  const handlePoint = getHandleWorldPosition(tile, side);
                  const isSource =
                    draftConnection?.from.tileId === tile.id &&
                    draftConnection?.from.side === side;
                  const isTarget =
                    hoveredTarget?.tileId === tile.id && hoveredTarget?.side === side;
                  return (
                    <div
                      key={side}
                      className={cn(
                        "absolute border-2 border-blue-500 bg-white transition-colors duration-150",
                        "cursor-pointer",
                        isSource ? "bg-blue-500" : "",
                        isTarget ? "bg-blue-500" : "",
                        !isSource && !isTarget ? "hover:bg-blue-100" : ""
                      )}
                      style={{
                        ...handleStyleMap[side],
                        width: HANDLE_SIZE,
                        height: HANDLE_SIZE,
                        borderRadius: HANDLE_SIZE,
                      }}
                      onPointerDown={beginConnection(tile, side, handlePoint)}
                      onPointerEnter={() => maybeSetTarget(tile.id, side)}
                      onPointerLeave={() => clearTarget(tile.id, side)}
                    />
                  );
                })}
            </div>
          </DraggableTile>
        );
      })}
    </div>
  );
};

export default RoadmapBoard;
