'use client';

import Link from 'next/link';
import type { ChangeEvent, FormEvent, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import dagre from 'dagre';
import gsap from 'gsap';
import { motion } from 'motion/react';
import {
  addEdge,
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  getBezierEdgeCenter,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useEdgesState,
  useNodesState,
  Position,
} from '@xyflow/react';
import type { Connection, Edge, EdgeProps, Node, ReactFlowInstance } from '@xyflow/react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, FileText, Lock, MoreVertical, Redo2, Square, Type, Undo2 } from 'lucide-react';

import { RoadmapFreeTextNode } from '@/components/roadmap/RoadmapFreeTextNode';
import { RoadmapNodeDetailsSheet } from '@/components/roadmap/RoadmapNodeDetailsSheet';
import { RoadmapNoteNode } from '@/components/roadmap/RoadmapNoteNode';
import { RoadmapTileNode } from '@/components/roadmap/RoadmapTileNode';
import type {
  NoteThemeId,
  RoadmapNodeData as TileNodeData,
} from '@/components/roadmap/RoadmapTileNode';
import {
  presetEdges,
  presetNodes,
  type PresetEdgeConfig,
  type PresetNodeConfig,
} from '@/roadmap/configs/presets';

type RoadmapStep = {
  id: string;
  phase: string;
  title: string;
  timeline: string;
  summary: string;
};

type RoadmapDraft = Omit<RoadmapStep, 'id'>;

type EdgeVariant = 'solid' | 'dashed' | 'dotted';
type EdgeLineType = 'straight' | 'step' | 'bezier';
type EdgeEnding = 'none' | 'arrow-filled' | 'arrow-filled-thin' | 'arrow-open' | 'arrow-open-thin';
type NodeTone = 'main' | 'cream' | 'neutral';
type LayoutDirection = 'LR' | 'TB';

type RoadmapCanvasNodeData = TileNodeData & {
  persistenceId?: string;
};

type RoadmapNodeCreationOptions = {
  tone?: NodeTone;
  width?: number;
  height?: number;
  description?: RoadmapCanvasNodeData['description'];
  persistenceId?: string;
  nodeKind?: RoadmapCanvasNodeData['nodeKind'];
  phaseTitle?: RoadmapCanvasNodeData['phaseTitle'];
  timeLabel?: RoadmapCanvasNodeData['timeLabel'];
  timeStartMonth?: RoadmapCanvasNodeData['timeStartMonth'];
  timeEndMonth?: RoadmapCanvasNodeData['timeEndMonth'];
  totalMonths?: RoadmapCanvasNodeData['totalMonths'];
  stepType?: RoadmapCanvasNodeData['stepType'];
  stepStatus?: RoadmapCanvasNodeData['stepStatus'];
  phaseStepCount?: RoadmapCanvasNodeData['phaseStepCount'];
  phaseRequiredCount?: RoadmapCanvasNodeData['phaseRequiredCount'];
  phaseOptionalCount?: RoadmapCanvasNodeData['phaseOptionalCount'];
};

type RoadmapNode = Node<RoadmapCanvasNodeData>;
type RoadmapNodeType = RoadmapNode['type'];
type HistorySnapshot = {
  nodes: RoadmapNode[];
  edges: Edge[];
};

type RoadmapEdgeData = {
  variant?: EdgeVariant;
  color?: string;
  ending?: EdgeEnding;
  locked?: boolean;
  labelText?: string;
  labelColor?: string;
  labelSize?: number;
  animateIntro?: boolean;
  introDelayMs?: number;
};

type EdgeInspectorState = {
  edgeId: string;
  clientX: number;
  clientY: number;
};

type ContextTarget =
  | { kind: 'pane'; flowPosition: { x: number; y: number } }
  | { kind: 'node'; nodeId: string; flowPosition: { x: number; y: number } }
  | { kind: 'edge'; edgeId: string };

const NODE_WIDTH = 420;
const NODE_HEIGHT = 88;
const DAGRE_NODE_SEP = 120;
const DAGRE_RANK_SEP = 156;

const SOLID_EDGE_COLOR = '#2f6fd6';
const DOTTED_EDGE_COLOR = '#2f6fd6';
const DASHED_EDGE_COLOR = '#11162f';
const EDGE_INSPECTOR_SCALE = 0.54;
const EDGE_INSPECTOR_BASE_WIDTH = 560;
const EDGE_INSPECTOR_BASE_HEIGHT = 72;
const EDGE_INSPECTOR_WIDTH = EDGE_INSPECTOR_BASE_WIDTH * EDGE_INSPECTOR_SCALE;
const EDGE_INSPECTOR_HEIGHT = EDGE_INSPECTOR_BASE_HEIGHT * EDGE_INSPECTOR_SCALE;
const EDGE_LOCKED_INSPECTOR_BASE_WIDTH = 356;
const EDGE_LOCKED_INSPECTOR_WIDTH = EDGE_LOCKED_INSPECTOR_BASE_WIDTH * EDGE_INSPECTOR_SCALE;
const EDGE_UNLOCK_HOLD_DURATION_MS = 900;
const EDGE_ENDING_BUTTON_CENTER_RATIO = 0.5 / 6.1;
const EDGE_TYPE_BUTTON_CENTER_RATIO = 1.55 / 6.1;
const EDGE_COLOR_BUTTON_CENTER_RATIO = 2.6 / 6.1;
const EDGE_TEXT_BUTTON_CENTER_RATIO = 3.6 / 6.1;
const EDGE_ENDING_PANEL_TOP = EDGE_INSPECTOR_HEIGHT + 6;
const EDGE_ENDING_PANEL_WIDTH = 124;
const EDGE_ENDING_PANEL_HEIGHT = 226;
const EDGE_TYPE_TOOLTIP_TOP = -36;
const EDGE_TYPE_PANEL_TOP = EDGE_INSPECTOR_HEIGHT + 6;
const EDGE_TYPE_PANEL_WIDTH = 208;
const EDGE_TYPE_PANEL_HEIGHT = 156;
const EDGE_COLOR_PANEL_TOP = EDGE_INSPECTOR_HEIGHT + 6;
const EDGE_COLOR_PANEL_WIDTH = 252;
const EDGE_COLOR_PANEL_HEIGHT = 336;
const EDGE_TEXT_PANEL_TOP = EDGE_INSPECTOR_HEIGHT + 6;
const EDGE_TEXT_PANEL_WIDTH = 220;
const EDGE_TEXT_PANEL_HEIGHT = 176;
const DEFAULT_EDGE_LABEL_COLOR = '#9f1d2b';
const DEFAULT_EDGE_LABEL_SIZE = 14;
const EDGE_LABEL_SIZE_OPTIONS = [12, 14, 16, 18];
const EDGE_LABEL_COLOR_OPTIONS = ['#111827', '#9f1d2b', '#2563eb', '#059669', '#d97706', '#7c3aed'];
const EDGE_INTRO_STAGGER_MS = 52;
const EDGE_INTRO_DURATION_MS = 940;
const EDGE_INTRO_CLEANUP_BUFFER_MS = 220;
const HISTORY_LIMIT = 80;
const FLAT_BEZIER_AXIS_THRESHOLD = 18;
const OUTWARD_BEZIER_LIFT_RATIO = 0.18;
const OUTWARD_BEZIER_MIN_LIFT = 24;
const OUTWARD_BEZIER_MAX_LIFT = 72;
const EDGE_COLOR_SWATCHES: string[][] = [
  ['#ece4a8', '#f8df53', '#bf8900', '#ffffff'],
  ['#efc9ab', '#ffa34d', '#b8610a', '#e6e6e6'],
  ['#f0c2ca', '#ff646a', '#d6030c', '#bfbfbf'],
  ['#9ad9b3', '#34c765', '#0f8b34', '#666666'],
  ['#aebfdf', '#6496e4', '#355faf', '#17181b'],
  ['#c7c1e2', '#8b78dd', '#5f34d6'],
];
const EDGE_INSPECTOR_MARGIN = 16;
const FREE_TEXT_NODE_MIN_WIDTH = 120;
const FREE_TEXT_NODE_MAX_WIDTH = 420;
const FREE_TEXT_NODE_MIN_HEIGHT = 48;
const FREE_TEXT_NODE_MAX_HEIGHT = 220;
const NOTE_NODE_MIN_WIDTH = 240;
const NOTE_NODE_MAX_WIDTH = 360;
const NOTE_NODE_MIN_HEIGHT = 120;
const NOTE_NODE_MAX_HEIGHT = 220;
const TOOLBAR_CENTER_OFFSET_X = 18;
const NOTE_THEME_IDS: NoteThemeId[] = ['rose', 'amber', 'mint', 'sky'];
const NOTE_ROTATIONS = [-3.1, -2.4, -1.8, 1.4, 2.1, 2.7] as const;

let freeTextMeasureCanvas: HTMLCanvasElement | null = null;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getDefaultEdgeColor = (variant: EdgeVariant): string => {
  if (variant === 'dashed') return DASHED_EDGE_COLOR;
  if (variant === 'dotted') return DOTTED_EDGE_COLOR;
  return SOLID_EDGE_COLOR;
};

const getEdgeStyle = (variant: EdgeVariant, color: string): Edge['style'] => {
  if (variant === 'solid') {
    return { stroke: color, strokeWidth: 3.2 };
  }

  if (variant === 'dashed') {
    return {
      stroke: color,
      strokeWidth: 3,
      strokeDasharray: '11 8',
      strokeLinecap: 'round',
    };
  }

  return {
    stroke: color,
    strokeWidth: 3,
    strokeDasharray: '1 10',
    strokeLinecap: 'round',
  };
};

const toEdgeType = (edgeType: Edge['type']): EdgeLineType => {
  if (edgeType === 'straight' || edgeType === 'step' || edgeType === 'bezier') return edgeType;
  return 'bezier';
};

const toEdgeVariant = (edge: Edge): EdgeVariant => {
  const variant = (edge.data as { variant?: EdgeVariant } | undefined)?.variant;
  if (variant === 'solid' || variant === 'dashed' || variant === 'dotted') return variant;

  const dash = edge.style?.strokeDasharray;
  if (dash === '11 8') return 'dashed';
  if (dash === '1 10' || dash === '1 12') return 'dotted';

  return 'solid';
};

const toEdgeColor = (edge: Edge): string => {
  const color = (edge.data as { color?: string } | undefined)?.color;
  if (typeof color === 'string' && color.length > 0) return color;

  const styleColor = edge.style?.stroke;
  if (typeof styleColor === 'string' && styleColor.length > 0) return styleColor;

  return getDefaultEdgeColor(toEdgeVariant(edge));
};

const toEdgeLabelText = (edge: Edge): string => {
  const text = (edge.data as { labelText?: string } | undefined)?.labelText;
  if (typeof text === 'string') return text;

  if (typeof edge.label === 'string') return edge.label;
  return '';
};

const toEdgeLabelColor = (edge: Edge): string => {
  const color = (edge.data as { labelColor?: string } | undefined)?.labelColor;
  if (typeof color === 'string' && color.length > 0) return color;

  const fill = edge.labelStyle?.fill;
  if (typeof fill === 'string' && fill.length > 0) return fill;

  return DEFAULT_EDGE_LABEL_COLOR;
};

const toEdgeLabelSize = (edge: Edge): number => {
  const size = (edge.data as { labelSize?: number } | undefined)?.labelSize;
  if (typeof size === 'number' && Number.isFinite(size)) return size;

  const labelStyleSize = edge.labelStyle?.fontSize;
  if (typeof labelStyleSize === 'number' && Number.isFinite(labelStyleSize)) return labelStyleSize;
  if (typeof labelStyleSize === 'string') {
    const parsed = Number.parseFloat(labelStyleSize);
    if (Number.isFinite(parsed)) return parsed;
  }

  return DEFAULT_EDGE_LABEL_SIZE;
};

const toEdgeLocked = (edge: Edge): boolean =>
  (edge.data as { locked?: boolean } | undefined)?.locked === true;

const getEdgeLabelStyle = (color: string, size: number): Edge['labelStyle'] => ({
  fill: color,
  fontSize: size,
  fontWeight: 600,
});

const getPathDirection = (path: string, fallbackDx: number, fallbackDy: number) => {
  const fallbackLength = Math.hypot(fallbackDx, fallbackDy) || 1;
  const fallback = {
    tangentX: fallbackDx / fallbackLength,
    tangentY: fallbackDy / fallbackLength,
  };

  if (typeof document === 'undefined') return fallback;

  try {
    const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svgPath.setAttribute('d', path);

    const totalLength = svgPath.getTotalLength();
    if (!Number.isFinite(totalLength) || totalLength <= 0) return fallback;

    const center = totalLength / 2;
    const sampleLength = Math.min(10, Math.max(2, totalLength / 8));
    const prevPoint = svgPath.getPointAtLength(Math.max(0, center - sampleLength));
    const nextPoint = svgPath.getPointAtLength(Math.min(totalLength, center + sampleLength));

    const dx = nextPoint.x - prevPoint.x;
    const dy = nextPoint.y - prevPoint.y;
    const length = Math.hypot(dx, dy);
    if (!Number.isFinite(length) || length <= 0.001) return fallback;

    return {
      tangentX: dx / length,
      tangentY: dy / length,
    };
  } catch {
    return fallback;
  }
};

const getOutwardBezierPath = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  position,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  position: Position.Top | Position.Bottom;
}) => {
  const horizontalDistance = Math.abs(targetX - sourceX);
  const lift = clamp(
    horizontalDistance * OUTWARD_BEZIER_LIFT_RATIO,
    OUTWARD_BEZIER_MIN_LIFT,
    OUTWARD_BEZIER_MAX_LIFT
  );
  const controlY =
    position === Position.Top
      ? Math.min(sourceY, targetY) - lift
      : Math.max(sourceY, targetY) + lift;

  const sourceControlX = sourceX;
  const sourceControlY = controlY;
  const targetControlX = targetX;
  const targetControlY = controlY;

  const path = `M ${sourceX},${sourceY} C ${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`;
  const [labelX, labelY] = getBezierEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourceControlX,
    sourceControlY,
    targetControlX,
    targetControlY,
  });

  return [path, labelX, labelY] as const;
};

const RoadmapConnectionEdge = ({
  id,
  type,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  label,
  labelStyle,
  data,
}: EdgeProps<Edge>) => {
  const shouldUseOutwardBezier =
    type === 'bezier' &&
    sourcePosition === targetPosition &&
    (sourcePosition === Position.Top || sourcePosition === Position.Bottom) &&
    Math.abs(sourceY - targetY) <= FLAT_BEZIER_AXIS_THRESHOLD;

  const [edgePath, labelX, labelY] = shouldUseOutwardBezier
    ? getOutwardBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        position: sourcePosition,
      })
    : type === 'straight'
      ? getStraightPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
        })
      : type === 'step'
        ? getSmoothStepPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
            borderRadius: 0,
          })
        : getBezierPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
          });

  const edgeData = (data ?? {}) as RoadmapEdgeData;
  const shouldAnimateIntro = edgeData.animateIntro === true;
  const [isIntroComplete, setIsIntroComplete] = useState(!shouldAnimateIntro);
  const introPathRef = useRef<SVGPathElement | null>(null);
  const hasPlayedIntroRef = useRef(false);
  const introMaskId = useId().replace(/:/g, '-');

  const introDelayMs =
    typeof edgeData.introDelayMs === 'number' && Number.isFinite(edgeData.introDelayMs)
      ? Math.max(0, edgeData.introDelayMs)
      : 0;
  const introColor =
    typeof edgeData.color === 'string' && edgeData.color.length > 0
      ? edgeData.color
      : typeof style?.stroke === 'string' && style.stroke.length > 0
        ? style.stroke
        : SOLID_EDGE_COLOR;
  const strokeWidthValue = style?.strokeWidth;
  const introStrokeWidth =
    (typeof strokeWidthValue === 'number'
      ? strokeWidthValue
      : typeof strokeWidthValue === 'string'
        ? Number.parseFloat(strokeWidthValue)
        : 3.2) + 0.4;
  const introRevealStrokeWidth = Math.max(introStrokeWidth + 10, introStrokeWidth * 2.8);
  const introStrokeLinecap =
    typeof style?.strokeLinecap === 'string' &&
    (style.strokeLinecap === 'inherit' ||
      style.strokeLinecap === 'butt' ||
      style.strokeLinecap === 'round' ||
      style.strokeLinecap === 'square')
      ? style.strokeLinecap
      : 'round';
  const isIntroActive = shouldAnimateIntro && !isIntroComplete;
  const introMaskBounds = {
    x: Math.min(sourceX, targetX) - 220,
    y: Math.min(sourceY, targetY) - 220,
    width: Math.abs(targetX - sourceX) + 440,
    height: Math.abs(targetY - sourceY) + 440,
  };

  useEffect(() => {
    if (!shouldAnimateIntro) {
      setIsIntroComplete(true);
      return;
    }

    if (hasPlayedIntroRef.current) return;

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      hasPlayedIntroRef.current = true;
      setIsIntroComplete(true);
      return;
    }
    let frameId = 0;
    let attempts = 0;
    let timeline: gsap.core.Timeline | null = null;

    const startIntro = () => {
      const introPath = introPathRef.current;

      if (!introPath || edgePath.includes('NaN')) {
        attempts += 1;
        if (attempts <= 24) {
          frameId = window.requestAnimationFrame(startIntro);
          return;
        }

        setIsIntroComplete(true);
        return;
      }

      const totalLength = introPath.getTotalLength();
      if (!Number.isFinite(totalLength) || totalLength <= 0) {
        attempts += 1;
        if (attempts <= 24) {
          frameId = window.requestAnimationFrame(startIntro);
          return;
        }

        setIsIntroComplete(true);
        return;
      }

      hasPlayedIntroRef.current = true;
      setIsIntroComplete(false);

      gsap.set(introPath, {
        strokeDasharray: totalLength,
        strokeDashoffset: totalLength,
      });
      const introDurationSeconds = EDGE_INTRO_DURATION_MS / 1000;
      timeline = gsap.timeline({
        delay: introDelayMs / 1000,
        onComplete: () => {
          setIsIntroComplete(true);
        },
      });

      timeline.to(
        introPath,
        {
          strokeDashoffset: 0,
          duration: introDurationSeconds,
          ease: 'power3.out',
        },
        0
      );
    };

    frameId = window.requestAnimationFrame(startIntro);

    return () => {
      window.cancelAnimationFrame(frameId);
      timeline?.kill();
    };
  }, [edgePath, introDelayMs, shouldAnimateIntro]);

  const labelText = typeof label === 'string' ? label.trim() : '';
  const edgeStyleDuringIntro = isIntroActive
    ? {
        ...style,
        stroke: 'rgba(17, 22, 47, 0.001)',
        strokeOpacity: 0.001,
      }
    : style;

  if (!labelText) {
    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          style={edgeStyleDuringIntro}
          markerEnd={isIntroActive ? undefined : markerEnd}
        />
        {isIntroActive ? (
          <>
            <mask
              id={introMaskId}
              maskUnits="userSpaceOnUse"
              maskContentUnits="userSpaceOnUse"
              x={introMaskBounds.x}
              y={introMaskBounds.y}
              width={introMaskBounds.width}
              height={introMaskBounds.height}
            >
              <rect
                x={introMaskBounds.x}
                y={introMaskBounds.y}
                width={introMaskBounds.width}
                height={introMaskBounds.height}
                fill="black"
              />
              <path
                ref={introPathRef}
                d={edgePath}
                fill="none"
                stroke="white"
                strokeWidth={introRevealStrokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: 'none' }}
              />
            </mask>
            <path
              d={edgePath}
              fill="none"
              stroke={introColor}
              strokeWidth={style?.strokeWidth}
              strokeDasharray={style?.strokeDasharray}
              strokeLinecap={introStrokeLinecap}
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
              mask={`url(#${introMaskId})`}
            />
          </>
        ) : null}
      </>
    );
  }

  const fill = typeof labelStyle?.fill === 'string' ? labelStyle.fill : DEFAULT_EDGE_LABEL_COLOR;
  const fontSizeValue = labelStyle?.fontSize;
  const fontSize =
    typeof fontSizeValue === 'number'
      ? fontSizeValue
      : typeof fontSizeValue === 'string'
        ? Number.parseFloat(fontSizeValue) || DEFAULT_EDGE_LABEL_SIZE
        : DEFAULT_EDGE_LABEL_SIZE;
  const fontWeight = labelStyle?.fontWeight ?? 600;

  const pathDirection = getPathDirection(edgePath, targetX - sourceX, targetY - sourceY);
  const normalX = -pathDirection.tangentY;
  const normalY = pathDirection.tangentX;
  const labelOffset = Math.max(12, fontSize * 0.95 + 2);
  const positionedLabelX = labelX + normalX * labelOffset;
  const positionedLabelY = labelY + normalY * labelOffset;

  let angle = (Math.atan2(pathDirection.tangentY, pathDirection.tangentX) * 180) / Math.PI;
  if (angle > 90 || angle < -90) angle += 180;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={edgeStyleDuringIntro}
        markerEnd={isIntroActive ? undefined : markerEnd}
      />
      {isIntroActive ? (
        <>
          <mask
            id={introMaskId}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x={introMaskBounds.x}
            y={introMaskBounds.y}
            width={introMaskBounds.width}
            height={introMaskBounds.height}
          >
            <rect
              x={introMaskBounds.x}
              y={introMaskBounds.y}
              width={introMaskBounds.width}
              height={introMaskBounds.height}
              fill="black"
            />
            <path
              ref={introPathRef}
              d={edgePath}
              fill="none"
              stroke="white"
              strokeWidth={introRevealStrokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
            />
          </mask>
          <path
            d={edgePath}
            fill="none"
            stroke={introColor}
            strokeWidth={style?.strokeWidth}
            strokeDasharray={style?.strokeDasharray}
            strokeLinecap={introStrokeLinecap}
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
            mask={`url(#${introMaskId})`}
          />
        </>
      ) : (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute select-none"
            style={{
              transform: `translate(-50%, -50%) translate(${positionedLabelX}px, ${positionedLabelY}px) rotate(${angle}deg)`,
              transformOrigin: 'center',
              color: fill,
              fontSize,
              fontWeight,
              lineHeight: 1,
              whiteSpace: 'nowrap',
            }}
          >
            {labelText}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const getEdgeMarkerEnd = (ending: EdgeEnding, color: string): Edge['markerEnd'] => {
  if (ending === 'none') return undefined;

  if (ending === 'arrow-filled') {
    return { type: MarkerType.ArrowClosed, color, width: 20, height: 20 };
  }

  if (ending === 'arrow-filled-thin') {
    return { type: MarkerType.ArrowClosed, color, width: 14, height: 14 };
  }

  if (ending === 'arrow-open') {
    return { type: MarkerType.Arrow, color, width: 20, height: 20 };
  }

  return { type: MarkerType.Arrow, color, width: 14, height: 14 };
};

const toEdgeEnding = (edge: Edge): EdgeEnding => {
  const ending = (edge.data as { ending?: EdgeEnding } | undefined)?.ending;
  if (
    ending === 'none' ||
    ending === 'arrow-filled' ||
    ending === 'arrow-filled-thin' ||
    ending === 'arrow-open' ||
    ending === 'arrow-open-thin'
  ) {
    return ending;
  }

  const marker = edge.markerEnd;
  if (!marker) return 'none';
  if (typeof marker === 'string') return 'none';

  if (marker.type === MarkerType.ArrowClosed) {
    const width = marker.width ?? 20;
    return width <= 14 ? 'arrow-filled-thin' : 'arrow-filled';
  }

  if (marker.type === MarkerType.Arrow) {
    const width = marker.width ?? 20;
    return width <= 14 ? 'arrow-open-thin' : 'arrow-open';
  }

  return 'none';
};

const getEdgeInspectorPosition = (
  clientX: number,
  clientY: number,
  bounds: { width: number; height: number }
) => {
  if (typeof window === 'undefined') {
    return { left: clientX, top: clientY };
  }

  const boundedWidth = Math.max(
    180,
    Math.min(bounds.width, window.innerWidth - EDGE_INSPECTOR_MARGIN * 2)
  );
  const boundedHeight = Math.max(
    44,
    Math.min(bounds.height, window.innerHeight - EDGE_INSPECTOR_MARGIN * 2)
  );

  return {
    left: clamp(
      clientX + 14,
      EDGE_INSPECTOR_MARGIN,
      window.innerWidth - boundedWidth - EDGE_INSPECTOR_MARGIN
    ),
    top: clamp(
      clientY + 14,
      EDGE_INSPECTOR_MARGIN,
      window.innerHeight - boundedHeight - EDGE_INSPECTOR_MARGIN
    ),
  };
};

const renderEdgeTypeIcon = (type: EdgeLineType, isActive = false) => {
  const stroke = isActive ? '#2f6fd6' : '#11162f';

  return (
    <svg viewBox="0 0 72 24" className="h-5 w-14">
      {type === 'straight' ? (
        <line
          x1="8"
          y1="16"
          x2="64"
          y2="8"
          stroke={stroke}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      ) : null}
      {type === 'step' ? (
        <polyline
          points="16,16 36,16 36,8 56,8"
          fill="none"
          stroke={stroke}
          strokeWidth="3.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}
      {type === 'bezier' ? (
        <path
          d="M 8 16 C 20 4, 44 20, 64 8"
          fill="none"
          stroke={stroke}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
};

const renderEdgeVariantIcon = (variant: EdgeVariant, isActive = false) => {
  const stroke = isActive ? '#2f6fd6' : '#11162f';
  const strokeDasharray = variant === 'dashed' ? '11 8' : variant === 'dotted' ? '1 10' : undefined;

  return (
    <svg viewBox="0 0 72 24" className="h-5 w-14">
      <line
        x1="8"
        y1="12"
        x2="64"
        y2="12"
        stroke={stroke}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray={strokeDasharray}
      />
    </svg>
  );
};

const renderEdgeEndingIcon = (ending: EdgeEnding, color = '#11162f') => {
  return (
    <svg viewBox="0 0 72 24" className="h-5 w-14">
      <line x1="8" y1="12" x2="56" y2="12" stroke={color} strokeWidth="3.2" strokeLinecap="round" />

      {ending === 'arrow-filled' ? <polygon points="63,12 50,5 50,19" fill={color} /> : null}

      {ending === 'arrow-filled-thin' ? <polygon points="62,12 53,8 53,16" fill={color} /> : null}

      {ending === 'arrow-open' ? (
        <>
          <line
            x1="62"
            y1="12"
            x2="50"
            y2="5"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <line
            x1="62"
            y1="12"
            x2="50"
            y2="19"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : null}

      {ending === 'arrow-open-thin' ? (
        <>
          <line
            x1="61"
            y1="12"
            x2="53"
            y2="8"
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <line
            x1="61"
            y1="12"
            x2="53"
            y2="16"
            stroke={color}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      ) : null}
    </svg>
  );
};

const EDGE_ENDING_OPTIONS: Array<{ value: EdgeEnding; label: string }> = [
  { value: 'none', label: 'Bez koncowki' },
  { value: 'arrow-filled', label: 'Pelna' },
  { value: 'arrow-filled-thin', label: 'Pelna cienka' },
  { value: 'arrow-open', label: 'Kontur' },
  { value: 'arrow-open-thin', label: 'Kontur cienki' },
];

const EDGE_TYPE_OPTIONS: Array<{ value: EdgeLineType; label: string }> = [
  { value: 'straight', label: 'Linia' },
  { value: 'step', label: 'Schodkowa' },
  { value: 'bezier', label: 'Krzywa' },
];

const EDGE_VARIANT_OPTIONS: Array<{ value: EdgeVariant; label: string }> = [
  { value: 'solid', label: 'Ciągła' },
  { value: 'dashed', label: 'Przerywana' },
  { value: 'dotted', label: 'Kropkowana' },
];

const createStyledEdge = ({
  id,
  source,
  target,
  variant = 'solid',
  type = 'bezier',
  color,
  ending = 'none',
  locked = false,
  labelText = '',
  labelColor = DEFAULT_EDGE_LABEL_COLOR,
  labelSize = DEFAULT_EDGE_LABEL_SIZE,
  animateIntro = false,
  introDelayMs = 0,
}: {
  id: string;
  source: string;
  target: string;
  variant?: EdgeVariant;
  type?: Edge['type'];
  color?: string;
  ending?: EdgeEnding;
  locked?: boolean;
  labelText?: string;
  labelColor?: string;
  labelSize?: number;
  animateIntro?: boolean;
  introDelayMs?: number;
}): Edge => ({
  id,
  source,
  target,
  type,
  label: labelText.trim() ? labelText : undefined,
  labelStyle: getEdgeLabelStyle(labelColor, labelSize),
  labelShowBg: false,
  data: {
    variant,
    color: color ?? getDefaultEdgeColor(variant),
    ending,
    locked,
    labelText,
    labelColor,
    labelSize,
    animateIntro,
    introDelayMs,
  },
  style: getEdgeStyle(variant, color ?? getDefaultEdgeColor(variant)),
  markerEnd: getEdgeMarkerEnd(ending, color ?? getDefaultEdgeColor(variant)),
});

const initialDraft: RoadmapDraft = {
  phase: 'Phase 07',
  title: 'New roadmap step',
  timeline: 'Weeks 24-28',
  summary: 'Describe what this stage should cover.',
};

const getTileSizeFromText = (step: Pick<RoadmapDraft, 'title' | 'phase' | 'timeline'>) => {
  void step;

  return {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  };
};

const getFreeTextNodeSize = (text: string) => {
  const normalizedText = text.trim() || 'Nowy tekst';
  const lines = normalizedText.split(/\r?\n/).filter(Boolean);
  const longestLine = lines.reduce(
    (current, line) => (line.length > current.length ? line : current),
    lines[0] ?? normalizedText
  );

  let textWidth = Math.max(80, longestLine.length * 13);

  if (typeof document !== 'undefined') {
    freeTextMeasureCanvas ??= document.createElement('canvas');
    const context = freeTextMeasureCanvas.getContext('2d');
    if (context) {
      context.font = '600 24px Poppins, ui-sans-serif, system-ui, sans-serif';
      textWidth = Math.max(80, context.measureText(longestLine).width);
    }
  }

  const width = clamp(
    Math.ceil(textWidth + 18),
    FREE_TEXT_NODE_MIN_WIDTH,
    FREE_TEXT_NODE_MAX_WIDTH
  );
  const height = clamp(
    lines.length * 30 + 18,
    FREE_TEXT_NODE_MIN_HEIGHT,
    FREE_TEXT_NODE_MAX_HEIGHT
  );

  return { width, height };
};

const getNoteNodeSize = (draft: Pick<RoadmapDraft, 'title' | 'summary'>) => {
  const title = draft.title.trim() || 'Nowa notatka';
  const summary = draft.summary.trim();
  const summaryLines = summary ? Math.max(2, Math.ceil(summary.length / 34)) : 2;
  const titleWidth = Math.max(title.length * 9, 160);
  const width = clamp(Math.ceil(titleWidth + 54), NOTE_NODE_MIN_WIDTH, NOTE_NODE_MAX_WIDTH);
  const height = clamp(76 + summaryLines * 18, NOTE_NODE_MIN_HEIGHT, NOTE_NODE_MAX_HEIGHT);

  return { width, height };
};

const pickRandomDifferent = <T,>(items: readonly T[], previous: T | null) => {
  if (items.length === 0) {
    throw new Error('pickRandomDifferent requires at least one item');
  }

  const availableItems = previous === null ? items : items.filter((item) => item !== previous);
  const source = availableItems.length > 0 ? availableItems : items;

  return source[Math.floor(Math.random() * source.length)];
};

const cloneHistorySnapshot = (nodes: RoadmapNode[], edges: Edge[]): HistorySnapshot =>
  structuredClone({
    nodes: nodes.map((node) => ({
      ...node,
      selected: false,
      dragging: false,
    })),
    edges: edges.map((edge) => ({
      ...edge,
      selected: false,
    })),
  });

const getHistorySnapshotKey = (nodes: RoadmapNode[], edges: Edge[]) =>
  JSON.stringify({
    nodes: nodes.map((node) => {
      const snapshotNode = { ...node };
      delete snapshotNode.selected;
      delete snapshotNode.dragging;
      delete snapshotNode.resizing;
      delete snapshotNode.zIndex;

      return {
        ...snapshotNode,
        data: snapshotNode.data,
        position: {
          x: Number(snapshotNode.position.x.toFixed(2)),
          y: Number(snapshotNode.position.y.toFixed(2)),
        },
      };
    }),
    edges: edges.map((edge) => {
      const snapshotEdge = { ...edge };
      delete snapshotEdge.selected;
      delete snapshotEdge.zIndex;

      return {
        ...snapshotEdge,
        data: snapshotEdge.data,
        style: snapshotEdge.style,
        markerEnd: snapshotEdge.markerEnd,
        markerStart: snapshotEdge.markerStart,
        labelStyle: snapshotEdge.labelStyle,
      };
    }),
  });

const createRoadmapNode = (
  id: string,
  step: RoadmapDraft,
  position: { x: number; y: number },
  options?: RoadmapNodeCreationOptions
): RoadmapNode => {
  const autoSize = getTileSizeFromText(step);

  return {
    id,
    type: 'roadmapTile',
    data: {
      phase: step.phase,
      title: step.title,
      timeline: step.timeline,
      summary: step.summary,
      description: options?.description ?? step.summary,
      tone: options?.tone ?? 'cream',
      width: options?.width ?? autoSize.width,
      height: options?.height ?? autoSize.height,
      persistenceId: options?.persistenceId,
      nodeKind: options?.nodeKind ?? 'step',
      phaseTitle: options?.phaseTitle,
      timeLabel: options?.timeLabel,
      timeStartMonth: options?.timeStartMonth,
      timeEndMonth: options?.timeEndMonth,
      totalMonths: options?.totalMonths,
      stepType: options?.stepType,
      stepStatus: options?.stepStatus,
      phaseStepCount: options?.phaseStepCount,
      phaseRequiredCount: options?.phaseRequiredCount,
      phaseOptionalCount: options?.phaseOptionalCount,
    },
    position,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  };
};

const createFreeTextNode = (
  id: string,
  text: string,
  position: { x: number; y: number }
): RoadmapNode => {
  const size = getFreeTextNodeSize(text);

  return {
    id,
    type: 'roadmapText',
    data: {
      phase: '',
      title: text,
      timeline: '',
      summary: '',
      tone: 'neutral',
      width: size.width,
      height: size.height,
      nodeKind: 'text',
    },
    position,
    draggable: true,
    selectable: true,
  };
};

const createNoteNode = (
  id: string,
  draft: Pick<RoadmapDraft, 'title' | 'summary'>,
  position: { x: number; y: number },
  options?: {
    noteTheme?: NoteThemeId;
    noteRotation?: number;
  }
): RoadmapNode => {
  const size = getNoteNodeSize(draft);

  return {
    id,
    type: 'roadmapNote',
    data: {
      phase: '',
      title: draft.title,
      timeline: '',
      summary: draft.summary,
      tone: 'neutral',
      width: size.width,
      height: size.height,
      noteTheme: options?.noteTheme,
      noteRotation: options?.noteRotation,
      nodeKind: 'note',
    },
    position,
    draggable: true,
    selectable: true,
  };
};

const createInitialNodes = (nodeConfigs: PresetNodeConfig[] = presetNodes): RoadmapNode[] => {
  return nodeConfigs.map((cfg) => {
    const step: RoadmapDraft = {
      phase: cfg.phase ?? '',
      title: cfg.title,
      timeline: cfg.timeline ?? '',
      summary: cfg.summary ?? '',
    };
    const autoSize = getTileSizeFromText(step);

    return createRoadmapNode(
      cfg.id,
      step,
      { x: cfg.x, y: cfg.y },
      {
        tone: cfg.tone ?? 'cream',
        width: cfg.width ?? autoSize.width,
        height: cfg.height ?? autoSize.height,
        description: cfg.description,
        persistenceId: cfg.persistenceId,
        nodeKind: cfg.nodeKind ?? 'step',
        phaseTitle: cfg.phaseTitle,
        timeLabel: cfg.timeLabel,
        timeStartMonth: cfg.timeStartMonth,
        timeEndMonth: cfg.timeEndMonth,
        totalMonths: cfg.totalMonths,
        stepType: cfg.stepType,
        stepStatus: cfg.stepStatus,
        phaseStepCount: cfg.phaseStepCount,
        phaseRequiredCount: cfg.phaseRequiredCount,
        phaseOptionalCount: cfg.phaseOptionalCount,
      }
    );
  });
};

const createInitialEdges = (edgeConfigs: PresetEdgeConfig[] = presetEdges): Edge[] => {
  return edgeConfigs.map((edge, index) => ({
    ...createStyledEdge({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      variant: edge.variant,
      type: edge.type,
      color: edge.color,
      ending: edge.ending,
      animateIntro: true,
      introDelayMs: index * EDGE_INTRO_STAGGER_MS,
    }),
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  }));
};

const layoutWithDagre = (
  nodes: RoadmapNode[],
  edges: Edge[],
  direction: LayoutDirection = 'LR'
): RoadmapNode[] => {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: direction,
    nodesep: DAGRE_NODE_SEP,
    ranksep: DAGRE_RANK_SEP,
    marginx: 24,
    marginy: 24,
  });

  nodes.forEach((node) => {
    const width = node.data.width ?? NODE_WIDTH;
    const height = node.data.height ?? NODE_HEIGHT;
    graph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    const nodePosition = graph.node(node.id) as { x?: number; y?: number } | undefined;
    const x = nodePosition?.x ?? 0;
    const y = nodePosition?.y ?? 0;

    const width = node.data.width ?? NODE_WIDTH;
    const height = node.data.height ?? NODE_HEIGHT;

    return {
      ...node,
      sourcePosition: direction === 'TB' ? Position.Bottom : Position.Right,
      targetPosition: direction === 'TB' ? Position.Top : Position.Left,
      position: {
        x: x - width / 2,
        y: y - height / 2,
      },
    };
  });
};

type RoadmapReactFlowPageProps = {
  title?: string;
  backHref?: string;
  initialNodeConfigs?: PresetNodeConfig[];
  initialEdgeConfigs?: PresetEdgeConfig[];
  layoutDirection?: LayoutDirection;
  headerActions?: ReactNode;
  onPersistNodePositions?: (
    positions: Array<{ persistenceId: string; x: number; y: number }>
  ) => void | Promise<void>;
};

export const RoadmapReactFlowPage = ({
  title = 'Career Path for Gamedeveloper',
  backHref = '/',
  initialNodeConfigs = presetNodes,
  initialEdgeConfigs = presetEdges,
  layoutDirection = 'LR',
  headerActions,
  onPersistNodePositions,
}: RoadmapReactFlowPageProps) => {
  const nodeTypes = useMemo(
    () => ({
      roadmapTile: RoadmapTileNode,
      roadmapText: RoadmapFreeTextNode,
      roadmapNote: RoadmapNoteNode,
    }),
    []
  );
  const edgeTypes = useMemo(
    () => ({
      straight: RoadmapConnectionEdge,
      step: RoadmapConnectionEdge,
      bezier: RoadmapConnectionEdge,
    }),
    []
  );

  const initialGraph = useMemo(() => {
    const initialEdges = createInitialEdges(initialEdgeConfigs);
    const initialNodes = createInitialNodes(initialNodeConfigs);

    return {
      nodes: initialNodes,
      edges: initialEdges,
    };
  }, [initialEdgeConfigs, initialNodeConfigs]);

  const [nodes, setNodes, onNodesChange] = useNodesState<RoadmapNode>(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialGraph.edges);

  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>('');
  const [isNodeDetailsOpen, setIsNodeDetailsOpen] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<RoadmapDraft>(initialDraft);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [contextTarget, setContextTarget] = useState<ContextTarget | null>(null);
  const [edgeInspector, setEdgeInspector] = useState<EdgeInspectorState | null>(null);
  const [isEndingTooltipOpen, setIsEndingTooltipOpen] = useState(false);
  const [isLineTooltipOpen, setIsLineTooltipOpen] = useState(false);
  const [isColorTooltipOpen, setIsColorTooltipOpen] = useState(false);
  const [isTextTooltipOpen, setIsTextTooltipOpen] = useState(false);
  const [unlockHoldProgress, setUnlockHoldProgress] = useState(0);

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    RoadmapNode,
    Edge
  > | null>(null);

  const nodeCounterRef = useRef(initialNodeConfigs.length + 1);
  const edgeCounterRef = useRef(initialEdgeConfigs.length + 1);
  const unlockHoldRafRef = useRef<number | null>(null);
  const unlockHoldStartedAtRef = useRef<number | null>(null);
  const unlockHoldEdgeIdRef = useRef<string | null>(null);
  const flowCanvasRef = useRef<HTMLDivElement | null>(null);
  const undoStackRef = useRef<HistorySnapshot[]>([]);
  const redoStackRef = useRef<HistorySnapshot[]>([]);
  const isRestoringHistoryRef = useRef(false);
  const lastNoteThemeRef = useRef<NoteThemeId | null>(null);
  const lastNoteRotationRef = useRef<number | null>(null);
  const lastCommittedSnapshotRef = useRef<HistorySnapshot>(
    cloneHistorySnapshot(initialGraph.nodes, initialGraph.edges)
  );
  const lastCommittedKeyRef = useRef(getHistorySnapshotKey(initialGraph.nodes, initialGraph.edges));

  useEffect(() => {
    const introCleanupDelayMs =
      Math.max(0, (initialEdgeConfigs.length - 1) * EDGE_INTRO_STAGGER_MS) +
      EDGE_INTRO_DURATION_MS +
      EDGE_INTRO_CLEANUP_BUFFER_MS;

    const timeoutId = window.setTimeout(() => {
      setEdges((currentEdges) =>
        currentEdges.map((edge) => {
          const edgeData = (edge.data ?? {}) as RoadmapEdgeData;
          if (edgeData.animateIntro !== true && !edgeData.introDelayMs) return edge;

          return {
            ...edge,
            data: {
              ...edgeData,
              animateIntro: false,
              introDelayMs: 0,
            },
          };
        })
      );
    }, introCleanupDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [initialEdgeConfigs.length, setEdges]);

  const activeInspectorEdge = useMemo(() => {
    if (!edgeInspector) return null;
    return edges.find((edge) => edge.id === edgeInspector.edgeId) ?? null;
  }, [edgeInspector, edges]);

  const editingNode = useMemo(
    () => (editingNodeId ? (nodes.find((node) => node.id === editingNodeId) ?? null) : null),
    [editingNodeId, nodes]
  );
  const editingNodeType: RoadmapNodeType = editingNode?.type ?? 'roadmapTile';
  const selectedNode = useMemo(
    () => (selectedNodeId ? (nodes.find((node) => node.id === selectedNodeId) ?? null) : null),
    [nodes, selectedNodeId]
  );
  const activeNodeDetailsData = useMemo(() => {
    if (!isNodeDetailsOpen || selectedNode?.type !== 'roadmapTile') return null;
    return selectedNode.data;
  }, [isNodeDetailsOpen, selectedNode]);

  useEffect(() => {
    if (!editingNodeId) return;
    if (nodes.some((node) => node.id === editingNodeId)) return;
    setEditingNodeId(null);
  }, [editingNodeId, nodes]);

  useEffect(() => {
    if (!selectedNodeId) return;
    if (nodes.some((node) => node.id === selectedNodeId)) return;
    setSelectedNodeId('');
  }, [nodes, selectedNodeId]);

  useEffect(() => {
    if (selectedNodeId) return;
    setIsNodeDetailsOpen(false);
  }, [selectedNodeId]);

  const activeInspectorEdgeLocked = useMemo(() => {
    if (!activeInspectorEdge) return false;
    return toEdgeLocked(activeInspectorEdge);
  }, [activeInspectorEdge]);

  const edgeInspectorPosition = useMemo(() => {
    if (!edgeInspector) return null;

    if (activeInspectorEdgeLocked) {
      return getEdgeInspectorPosition(edgeInspector.clientX, edgeInspector.clientY, {
        width: EDGE_LOCKED_INSPECTOR_WIDTH,
        height: EDGE_INSPECTOR_HEIGHT,
      });
    }

    const endingPanelHeight = isEndingTooltipOpen
      ? EDGE_INSPECTOR_HEIGHT + EDGE_ENDING_PANEL_TOP + EDGE_ENDING_PANEL_HEIGHT
      : EDGE_INSPECTOR_HEIGHT;
    const linePanelHeight = isLineTooltipOpen
      ? EDGE_INSPECTOR_HEIGHT + EDGE_TYPE_PANEL_TOP + EDGE_TYPE_PANEL_HEIGHT
      : EDGE_INSPECTOR_HEIGHT;
    const colorPanelHeight = isColorTooltipOpen
      ? EDGE_INSPECTOR_HEIGHT + EDGE_COLOR_PANEL_TOP + EDGE_COLOR_PANEL_HEIGHT
      : EDGE_INSPECTOR_HEIGHT;
    const textPanelHeight = isTextTooltipOpen
      ? EDGE_INSPECTOR_HEIGHT + EDGE_TEXT_PANEL_TOP + EDGE_TEXT_PANEL_HEIGHT
      : EDGE_INSPECTOR_HEIGHT;

    return getEdgeInspectorPosition(edgeInspector.clientX, edgeInspector.clientY, {
      width: EDGE_INSPECTOR_WIDTH,
      height: Math.max(endingPanelHeight, linePanelHeight, colorPanelHeight, textPanelHeight),
    });
  }, [
    activeInspectorEdgeLocked,
    edgeInspector,
    isColorTooltipOpen,
    isEndingTooltipOpen,
    isLineTooltipOpen,
    isTextTooltipOpen,
  ]);

  const activeInspectorEdgeType = useMemo(() => {
    if (!activeInspectorEdge) return null;
    return toEdgeType(activeInspectorEdge.type);
  }, [activeInspectorEdge]);

  const activeInspectorEdgeVariant = useMemo(() => {
    if (!activeInspectorEdge) return null;
    return toEdgeVariant(activeInspectorEdge);
  }, [activeInspectorEdge]);

  const activeInspectorEdgeEnding = useMemo(() => {
    if (!activeInspectorEdge) return null;
    return toEdgeEnding(activeInspectorEdge);
  }, [activeInspectorEdge]);

  const activeInspectorEdgeColor = useMemo(() => {
    if (!activeInspectorEdge) return null;
    return toEdgeColor(activeInspectorEdge);
  }, [activeInspectorEdge]);

  const activeInspectorEdgeLabelText = useMemo(() => {
    if (!activeInspectorEdge) return '';
    return toEdgeLabelText(activeInspectorEdge);
  }, [activeInspectorEdge]);

  const activeInspectorEdgeLabelColor = useMemo(() => {
    if (!activeInspectorEdge) return DEFAULT_EDGE_LABEL_COLOR;
    return toEdgeLabelColor(activeInspectorEdge);
  }, [activeInspectorEdge]);

  const activeInspectorEdgeLabelSize = useMemo(() => {
    if (!activeInspectorEdge) return DEFAULT_EDGE_LABEL_SIZE;
    return toEdgeLabelSize(activeInspectorEdge);
  }, [activeInspectorEdge]);

  const syncHistoryAvailability = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  const closeInspectorTooltips = useCallback(() => {
    setIsEndingTooltipOpen(false);
    setIsLineTooltipOpen(false);
    setIsColorTooltipOpen(false);
    setIsTextTooltipOpen(false);
  }, []);

  const cancelUnlockHold = useCallback(() => {
    if (unlockHoldRafRef.current !== null) {
      window.cancelAnimationFrame(unlockHoldRafRef.current);
      unlockHoldRafRef.current = null;
    }

    unlockHoldStartedAtRef.current = null;
    unlockHoldEdgeIdRef.current = null;
    setUnlockHoldProgress(0);
  }, []);

  const closeEdgeInspector = useCallback(() => {
    setEdgeInspector(null);
    closeInspectorTooltips();
    cancelUnlockHold();
  }, [cancelUnlockHold, closeInspectorTooltips]);

  useEffect(() => {
    if (!edgeInspector || activeInspectorEdge) return;
    closeEdgeInspector();
  }, [activeInspectorEdge, closeEdgeInspector, edgeInspector]);

  useEffect(() => {
    if (!edgeInspector) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeEdgeInspector();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeEdgeInspector, edgeInspector]);

  useEffect(() => {
    if (!activeInspectorEdgeLocked) return;
    closeInspectorTooltips();
  }, [activeInspectorEdgeLocked, closeInspectorTooltips]);

  useEffect(() => {
    if (activeInspectorEdgeLocked) return;
    cancelUnlockHold();
  }, [activeInspectorEdgeLocked, cancelUnlockHold]);

  useEffect(() => {
    cancelUnlockHold();
  }, [cancelUnlockHold, edgeInspector?.edgeId]);

  useEffect(() => {
    return () => {
      if (unlockHoldRafRef.current !== null) {
        window.cancelAnimationFrame(unlockHoldRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isRestoringHistoryRef.current && nodes.some((node) => node.dragging || node.resizing)) {
      return;
    }

    const nextKey = getHistorySnapshotKey(nodes, edges);
    if (nextKey === lastCommittedKeyRef.current) return;

    if (isRestoringHistoryRef.current) {
      isRestoringHistoryRef.current = false;
      lastCommittedKeyRef.current = nextKey;
      lastCommittedSnapshotRef.current = cloneHistorySnapshot(nodes, edges);
      syncHistoryAvailability();
      return;
    }

    undoStackRef.current.push(lastCommittedSnapshotRef.current);
    if (undoStackRef.current.length > HISTORY_LIMIT) {
      undoStackRef.current.shift();
    }
    redoStackRef.current = [];
    lastCommittedKeyRef.current = nextKey;
    lastCommittedSnapshotRef.current = cloneHistorySnapshot(nodes, edges);
    syncHistoryAvailability();
  }, [edges, nodes, syncHistoryAvailability]);

  const updateEdgeAppearance = useCallback(
    (
      edgeId: string,
      updates: {
        type?: EdgeLineType;
        variant?: EdgeVariant;
        color?: string;
        ending?: EdgeEnding;
        locked?: boolean;
        labelText?: string;
        labelColor?: string;
        labelSize?: number;
      }
    ) => {
      setEdges((currentEdges) =>
        currentEdges.map((edge) => {
          if (edge.id !== edgeId) return edge;

          const nextType = updates.type ?? toEdgeType(edge.type);
          const nextVariant = updates.variant ?? toEdgeVariant(edge);
          const nextColor = updates.color ?? toEdgeColor(edge);
          const nextEnding = updates.ending ?? toEdgeEnding(edge);
          const nextLocked = updates.locked ?? toEdgeLocked(edge);
          const nextLabelText = updates.labelText ?? toEdgeLabelText(edge);
          const nextLabelColor = updates.labelColor ?? toEdgeLabelColor(edge);
          const nextLabelSize = updates.labelSize ?? toEdgeLabelSize(edge);

          return {
            ...edge,
            type: nextType,
            label: nextLabelText.trim() ? nextLabelText : undefined,
            labelStyle: getEdgeLabelStyle(nextLabelColor, nextLabelSize),
            labelShowBg: false,
            style: getEdgeStyle(nextVariant, nextColor),
            markerEnd: getEdgeMarkerEnd(nextEnding, nextColor),
            data: {
              ...((edge.data ?? {}) as Record<string, unknown>),
              variant: nextVariant,
              color: nextColor,
              ending: nextEnding,
              locked: nextLocked,
              labelText: nextLabelText,
              labelColor: nextLabelColor,
              labelSize: nextLabelSize,
            },
          };
        })
      );
    },
    [setEdges]
  );

  const getCanvasViewportCenter = useCallback(
    (offset?: { x?: number; y?: number }) => {
      if (!reactFlowInstance || !flowCanvasRef.current) {
        return {
          x: 360 + (offset?.x ?? 0),
          y: 220 + (offset?.y ?? 0),
        };
      }

      const bounds = flowCanvasRef.current.getBoundingClientRect();
      return reactFlowInstance.screenToFlowPosition({
        x: bounds.left + bounds.width / 2 + TOOLBAR_CENTER_OFFSET_X + (offset?.x ?? 0),
        y: bounds.top + bounds.height / 2 + (offset?.y ?? 0),
      });
    },
    [reactFlowInstance]
  );

  const getNextNodeId = useCallback(
    (prefix: 'node' | 'text' | 'note') => {
      let candidate = `${prefix}-${nodeCounterRef.current++}`;
      while (nodes.some((node) => node.id === candidate)) {
        candidate = `${prefix}-${nodeCounterRef.current++}`;
      }
      return candidate;
    },
    [nodes]
  );

  const getNextEdgeId = useCallback(() => {
    let candidate = `e-${edgeCounterRef.current++}`;
    while (edges.some((edge) => edge.id === candidate)) {
      candidate = `e-${edgeCounterRef.current++}`;
    }
    return candidate;
  }, [edges]);

  const getNextNoteStyle = useCallback(() => {
    const noteTheme = pickRandomDifferent(NOTE_THEME_IDS, lastNoteThemeRef.current);
    const noteRotation = pickRandomDifferent(NOTE_ROTATIONS, lastNoteRotationRef.current);

    lastNoteThemeRef.current = noteTheme;
    lastNoteRotationRef.current = noteRotation;

    return {
      noteTheme,
      noteRotation,
    };
  }, []);

  const onEdgeClick = useCallback(
    (event: ReactMouseEvent, edge: Edge) => {
      event.preventDefault();
      event.stopPropagation();
      setContextTarget(null);
      setIsNodeDetailsOpen(false);
      setSelectedNodeId('');
      setSelectedEdgeId(edge.id);
      closeInspectorTooltips();
      cancelUnlockHold();
      setEdgeInspector({
        edgeId: edge.id,
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    [
      cancelUnlockHold,
      closeInspectorTooltips,
      setSelectedEdgeId,
      setSelectedNodeId,
      setIsNodeDetailsOpen,
    ]
  );

  const setInspectorEdgeType = useCallback(
    (edgeType: EdgeLineType) => {
      if (!edgeInspector) return;
      updateEdgeAppearance(edgeInspector.edgeId, { type: edgeType });
    },
    [edgeInspector, updateEdgeAppearance]
  );

  const setInspectorEdgeVariant = useCallback(
    (variant: EdgeVariant) => {
      if (!edgeInspector) return;
      updateEdgeAppearance(edgeInspector.edgeId, { variant });
    },
    [edgeInspector, updateEdgeAppearance]
  );

  const setInspectorEdgeEnding = useCallback(
    (ending: EdgeEnding) => {
      if (!edgeInspector) return;
      updateEdgeAppearance(edgeInspector.edgeId, { ending });
    },
    [edgeInspector, updateEdgeAppearance]
  );

  const setInspectorEdgeColor = useCallback(
    (color: string) => {
      if (!edgeInspector) return;
      updateEdgeAppearance(edgeInspector.edgeId, { color });
    },
    [edgeInspector, updateEdgeAppearance]
  );

  const setInspectorEdgeLabelText = useCallback(
    (text: string) => {
      if (!edgeInspector) return;
      updateEdgeAppearance(edgeInspector.edgeId, { labelText: text });
    },
    [edgeInspector, updateEdgeAppearance]
  );

  const setInspectorEdgeLabelColor = useCallback(
    (color: string) => {
      if (!edgeInspector) return;
      updateEdgeAppearance(edgeInspector.edgeId, { labelColor: color });
    },
    [edgeInspector, updateEdgeAppearance]
  );

  const setInspectorEdgeLabelSize = useCallback(
    (size: number) => {
      if (!edgeInspector) return;
      updateEdgeAppearance(edgeInspector.edgeId, { labelSize: size });
    },
    [edgeInspector, updateEdgeAppearance]
  );

  const setInspectorEdgeLocked = useCallback(
    (locked: boolean) => {
      if (!edgeInspector) return;
      updateEdgeAppearance(edgeInspector.edgeId, { locked });
    },
    [edgeInspector, updateEdgeAppearance]
  );

  const startUnlockHold = useCallback(() => {
    if (!edgeInspector || !activeInspectorEdgeLocked) return;

    const currentEdgeId = edgeInspector.edgeId;
    if (unlockHoldEdgeIdRef.current === currentEdgeId && unlockHoldRafRef.current !== null) return;

    cancelUnlockHold();
    unlockHoldEdgeIdRef.current = currentEdgeId;
    unlockHoldStartedAtRef.current = null;

    const tick = (frameTime: number) => {
      if (unlockHoldEdgeIdRef.current !== currentEdgeId) return;

      if (unlockHoldStartedAtRef.current === null) {
        unlockHoldStartedAtRef.current = frameTime;
      }

      const elapsed = frameTime - unlockHoldStartedAtRef.current;
      const progress = Math.min(1, elapsed / EDGE_UNLOCK_HOLD_DURATION_MS);
      setUnlockHoldProgress(progress);

      if (progress >= 1) {
        setInspectorEdgeLocked(false);
        cancelUnlockHold();
        return;
      }

      unlockHoldRafRef.current = window.requestAnimationFrame(tick);
    };

    unlockHoldRafRef.current = window.requestAnimationFrame(tick);
  }, [activeInspectorEdgeLocked, cancelUnlockHold, edgeInspector, setInspectorEdgeLocked]);

  const onMockToolbarAction = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      closeInspectorTooltips();
    },
    [closeInspectorTooltips]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target, sourceHandle, targetHandle } = connection;
      if (!source || !target || source === target) return;

      setEdges((currentEdges) => {
        const exists = currentEdges.some(
          (edge) =>
            edge.source === source &&
            edge.target === target &&
            edge.sourceHandle === sourceHandle &&
            edge.targetHandle === targetHandle
        );
        if (exists) return currentEdges;

        const nextEdge: Edge = {
          ...createStyledEdge({
            id: getNextEdgeId(),
            source,
            target,
            variant: 'solid',
            type: 'bezier',
          }),
          sourceHandle,
          targetHandle,
        };

        return addEdge(nextEdge, currentEdges);
      });
    },
    [getNextEdgeId, setEdges]
  );

  const createNodeAtPosition = useCallback(
    (position: { x: number; y: number }) => {
      const nextNumber = nodeCounterRef.current;
      const id = getNextNodeId('node');
      const defaultDraft: RoadmapDraft = {
        phase: `Phase ${String(nextNumber).padStart(2, '0')}`,
        title: `New roadmap step ${nextNumber}`,
        timeline: 'Custom timeline',
        summary: 'Custom roadmap step.',
      };

      const newNode = createRoadmapNode(
        id,
        defaultDraft,
        { x: Math.round(position.x), y: Math.round(position.y) },
        { tone: 'cream' }
      );

      setNodes((currentNodes) => [...currentNodes, newNode]);
      setSelectedNodeId(id);
      setSelectedEdgeId('');
      setIsNodeDetailsOpen(false);
    },
    [getNextNodeId, setNodes]
  );

  const createFreeTextAtPosition = useCallback(
    (position: { x: number; y: number }, openEditor = true) => {
      const id = getNextNodeId('text');
      const draft: RoadmapDraft = {
        phase: '',
        title: 'Nowy tekst',
        timeline: '',
        summary: '',
      };

      const newNode = createFreeTextNode(id, draft.title, {
        x: Math.round(position.x),
        y: Math.round(position.y),
      });

      setNodes((currentNodes) => [...currentNodes, newNode]);
      setSelectedNodeId(id);
      setSelectedEdgeId('');
      setIsNodeDetailsOpen(false);

      if (openEditor) {
        setEditingNodeId(id);
        setEditDraft(draft);
      }
    },
    [getNextNodeId, setNodes]
  );

  const createNoteAtPosition = useCallback(
    (position: { x: number; y: number }, openEditor = true) => {
      const id = getNextNodeId('note');
      const draft: RoadmapDraft = {
        phase: '',
        title: 'Nowa notatka',
        timeline: '',
        summary: 'Dodaj krótką notatkę do tego miejsca na roadmapie.',
      };
      const noteStyle = getNextNoteStyle();

      const newNode = createNoteNode(
        id,
        draft,
        { x: Math.round(position.x), y: Math.round(position.y) },
        noteStyle
      );

      setNodes((currentNodes) => [...currentNodes, newNode]);
      setSelectedNodeId(id);
      setSelectedEdgeId('');
      setIsNodeDetailsOpen(false);

      if (openEditor) {
        setEditingNodeId(id);
        setEditDraft(draft);
      }
    },
    [getNextNodeId, getNextNoteStyle, setNodes]
  );

  const restoreHistorySnapshot = useCallback(
    (snapshot: HistorySnapshot) => {
      isRestoringHistoryRef.current = true;
      closeEdgeInspector();
      setContextTarget(null);
      setEditingNodeId(null);
      setSelectedNodeId('');
      setSelectedEdgeId('');
      setNodes(snapshot.nodes);
      setEdges(snapshot.edges);
    },
    [closeEdgeInspector, setEdges, setNodes]
  );

  const onUndo = useCallback(() => {
    const previousSnapshot = undoStackRef.current.pop();
    if (!previousSnapshot) return;

    redoStackRef.current.push(cloneHistorySnapshot(nodes, edges));
    syncHistoryAvailability();
    restoreHistorySnapshot(previousSnapshot);
  }, [edges, nodes, restoreHistorySnapshot, syncHistoryAvailability]);

  const onRedo = useCallback(() => {
    const nextSnapshot = redoStackRef.current.pop();
    if (!nextSnapshot) return;

    undoStackRef.current.push(cloneHistorySnapshot(nodes, edges));
    syncHistoryAvailability();
    restoreHistorySnapshot(nextSnapshot);
  }, [edges, nodes, restoreHistorySnapshot, syncHistoryAvailability]);

  const addFreeTextFromToolbar = useCallback(() => {
    closeEdgeInspector();
    setContextTarget(null);
    createFreeTextAtPosition(getCanvasViewportCenter({ x: -30, y: -58 }));
  }, [closeEdgeInspector, createFreeTextAtPosition, getCanvasViewportCenter]);

  const addNodeFromToolbar = useCallback(() => {
    closeEdgeInspector();
    setContextTarget(null);
    createNodeAtPosition(
      getCanvasViewportCenter({
        x: -(NODE_WIDTH / 2),
        y: -(NODE_HEIGHT / 2),
      })
    );
  }, [closeEdgeInspector, createNodeAtPosition, getCanvasViewportCenter]);

  const addNoteFromToolbar = useCallback(() => {
    closeEdgeInspector();
    setContextTarget(null);
    createNoteAtPosition(getCanvasViewportCenter({ x: -10, y: 24 }));
  }, [closeEdgeInspector, createNoteAtPosition, getCanvasViewportCenter]);

  const getFlowPositionFromClient = useCallback(
    (clientX: number, clientY: number) => {
      if (!reactFlowInstance) return null;

      return reactFlowInstance.screenToFlowPosition({
        x: clientX,
        y: clientY,
      });
    },
    [reactFlowInstance]
  );

  const onPaneContextMenu = useCallback(
    (event: ReactMouseEvent | MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      closeEdgeInspector();
      setIsNodeDetailsOpen(false);
      setContextTarget(null);
    },
    [closeEdgeInspector]
  );

  const onNodeContextMenu = useCallback(
    (event: ReactMouseEvent, node: RoadmapNode) => {
      closeEdgeInspector();
      const flowPosition = getFlowPositionFromClient(event.clientX, event.clientY);
      if (!flowPosition) return;

      setContextTarget({
        kind: 'node',
        nodeId: node.id,
        flowPosition,
      });
    },
    [closeEdgeInspector, getFlowPositionFromClient]
  );

  const onEdgeContextMenu = useCallback(
    (_: ReactMouseEvent, edge: Edge) => {
      closeEdgeInspector();
      setIsNodeDetailsOpen(false);
      setContextTarget({
        kind: 'edge',
        edgeId: edge.id,
      });
    },
    [closeEdgeInspector]
  );

  const onPaneClick = useCallback(() => {
    closeEdgeInspector();
    setIsNodeDetailsOpen(false);
  }, [closeEdgeInspector]);

  const onNodeClick = useCallback((_: ReactMouseEvent, node: RoadmapNode) => {
    closeEdgeInspector();
    setSelectedNodeId(node.id);
    setSelectedEdgeId('');
    setIsNodeDetailsOpen(node.type === 'roadmapTile');
  }, [closeEdgeInspector, setSelectedEdgeId, setSelectedNodeId]);

  const persistCurrentNodePositions = useCallback(
    async (currentNodes: RoadmapNode[]) => {
      if (!onPersistNodePositions) return;

      const positions = currentNodes.flatMap((node) => {
        const persistenceId = node.data.persistenceId;
        if (!persistenceId) return [];

        return [
          {
            persistenceId,
            x: Math.round(node.position.x),
            y: Math.round(node.position.y),
          },
        ];
      });

      if (positions.length === 0) return;

      try {
        await onPersistNodePositions(positions);
      } catch (error) {
        console.error('Failed to persist node positions', error);
      }
    },
    [onPersistNodePositions]
  );

  const onNodeDragStop = useCallback(
    (_event: ReactMouseEvent | MouseEvent, node: RoadmapNode) => {
      const persistenceId = node.data.persistenceId;
      if (!persistenceId) return;

      setNodes((currentNodes) => {
        const nextNodes = currentNodes.map((currentNode) =>
          currentNode.id === node.id ? { ...currentNode, position: node.position } : currentNode
        );

        void persistCurrentNodePositions(nextNodes);

        return nextNodes;
      });
    },
    [persistCurrentNodePositions, setNodes]
  );

  const deleteEdgeById = useCallback(
    (edgeId: string) => {
      setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== edgeId));
      setSelectedEdgeId((current) => (current === edgeId ? '' : current));
      setEdgeInspector((current) => (current?.edgeId === edgeId ? null : current));
    },
    [setEdges]
  );

  const deleteNodeById = useCallback(
    (nodeId: string) => {
      setEdges((currentEdges) => {
        const updatedEdges = currentEdges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        );

        setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));

        return updatedEdges;
      });

      setSelectedNodeId((current) => (current === nodeId ? '' : current));
    },
    [setEdges, setNodes]
  );

  const deleteFromContextMenu = useCallback(() => {
    if (!contextTarget) return;

    if (contextTarget.kind === 'node') {
      deleteNodeById(contextTarget.nodeId);
      return;
    }

    if (contextTarget.kind === 'edge') {
      deleteEdgeById(contextTarget.edgeId);
      return;
    }

    if (selectedNodeId) {
      deleteNodeById(selectedNodeId);
      return;
    }

    if (selectedEdgeId) {
      deleteEdgeById(selectedEdgeId);
    }
  }, [contextTarget, deleteEdgeById, deleteNodeById, selectedEdgeId, selectedNodeId]);

  const canDeleteFromContext =
    (contextTarget?.kind === 'node' && Boolean(contextTarget.nodeId)) ||
    (contextTarget?.kind === 'edge' && Boolean(contextTarget.edgeId)) ||
    (contextTarget?.kind === 'pane' && (Boolean(selectedNodeId) || Boolean(selectedEdgeId)));

  const contextNode =
    contextTarget?.kind === 'node' ? nodes.find((node) => node.id === contextTarget.nodeId) : null;

  const deleteLabel = useMemo(() => {
    if (!contextTarget) return 'Usuń zaznaczony element';
    if (contextTarget.kind === 'node') {
      if (contextNode?.type === 'roadmapText') return 'Usuń tekst';
      if (contextNode?.type === 'roadmapNote') return 'Usuń notatkę';
      return 'Usuń kafelek';
    }
    if (contextTarget.kind === 'edge') return 'Usuń połączenie';
    if (selectedNodeId) {
      if (selectedNode?.type === 'roadmapText') return 'Usuń zaznaczony tekst';
      if (selectedNode?.type === 'roadmapNote') return 'Usuń zaznaczoną notatkę';
      return 'Usuń zaznaczony kafelek';
    }
    if (selectedEdgeId) return 'Usuń zaznaczone połączenie';
    return 'Usuń zaznaczony element';
  }, [contextNode?.type, contextTarget, selectedEdgeId, selectedNode?.type, selectedNodeId]);

  const editLabel =
    contextNode?.type === 'roadmapText'
      ? 'Edytuj tekst'
      : contextNode?.type === 'roadmapNote'
        ? 'Edytuj notatkę'
        : 'Edytuj kafelek';

  const hasAnySelection = Boolean(selectedNodeId) || Boolean(selectedEdgeId);

  const clearSelection = useCallback(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        selected: false,
      }))
    );
    setEdges((currentEdges) =>
      currentEdges.map((edge) => ({
        ...edge,
        selected: false,
      }))
    );
    setSelectedNodeId('');
    setSelectedEdgeId('');
    setIsNodeDetailsOpen(false);
    closeEdgeInspector();
  }, [closeEdgeInspector, setEdges, setNodes]);

  const closeContextMenu = useCallback(() => {
    setContextTarget(null);
  }, []);

  const withClose = (action: () => void) => () => {
    action();
    closeContextMenu();
  };

  const openEditNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((item) => item.id === nodeId);
      if (!node) return;

      setEditingNodeId(nodeId);
      setEditDraft({
        phase: node.data.phase ?? '',
        title: node.data.title ?? '',
        timeline: node.data.timeline ?? '',
        summary: node.data.summary ?? '',
      });
    },
    [nodes]
  );

  const onNodeDoubleClick = useCallback(
    (_event: ReactMouseEvent, node: RoadmapNode) => {
      openEditNode(node.id);
    },
    [openEditNode]
  );

  const onEditDraftChange =
    (field: keyof RoadmapDraft) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setEditDraft((current) => ({
        ...current,
        [field]: value,
      }));
    };

  const saveEditedNode = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!editingNodeId) return;

      const normalized =
        editingNodeType === 'roadmapText'
          ? {
              phase: '',
              title: editDraft.title.trim() || 'Nowy tekst',
              timeline: '',
              summary: '',
            }
          : editingNodeType === 'roadmapNote'
            ? {
                phase: '',
                title: editDraft.title.trim() || 'Nowa notatka',
                timeline: '',
                summary: editDraft.summary.trim() || 'Dodaj krótką notatkę do tego miejsca.',
              }
            : {
                phase: editDraft.phase.trim() || 'Custom phase',
                title: editDraft.title.trim() || 'Untitled node',
                timeline: editDraft.timeline.trim() || 'Custom timeline',
                summary: editDraft.summary.trim() || 'Custom roadmap step.',
              };
      const nextSize =
        editingNodeType === 'roadmapText'
          ? getFreeTextNodeSize(normalized.title)
          : editingNodeType === 'roadmapNote'
            ? getNoteNodeSize(normalized)
            : getTileSizeFromText(normalized);

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id !== editingNodeId) return node;
          return {
            ...node,
            data: {
              ...node.data,
              ...normalized,
              width: nextSize.width,
              height: nextSize.height,
            },
          };
        })
      );

      setEditingNodeId(null);
    },
    [editDraft, editingNodeId, editingNodeType, setNodes]
  );

  const closeEditDialog = useCallback(() => {
    setEditingNodeId(null);
  }, []);

  const editNodeFromContextMenu = useCallback(() => {
    if (contextTarget?.kind !== 'node') return;
    openEditNode(contextTarget.nodeId);
  }, [contextTarget, openEditNode]);

  const isClearSelectionDisabled =
    contextTarget?.kind === 'node' || contextTarget?.kind === 'edge' || !hasAnySelection;

  const isDeleteDisabled = !canDeleteFromContext;
  const isEditDisabled = contextTarget?.kind !== 'node';
  const editDialogTitle =
    editingNodeType === 'roadmapText'
      ? 'Edytuj tekst'
      : editingNodeType === 'roadmapNote'
        ? 'Edytuj notatkę'
        : 'Edytuj kafelek';
  const editDialogDescription =
    editingNodeType === 'roadmapText'
      ? 'Wpisz swobodny tekst, który ma działać jako adnotacja na roadmapie.'
      : editingNodeType === 'roadmapNote'
        ? 'Uzupełnij nagłówek i treść notatki przypiętej do canvasu.'
        : 'Prosty edytor treści kafelka. Zmień nazwę, metadane i krótki opis etapu.';

  const onContextMenuOpenChange = (open: boolean) => {
    if (!open) closeContextMenu();
    if (open) closeEdgeInspector();
  };

  const onAutoLayout = useCallback(() => {
    setNodes((currentNodes) => layoutWithDagre(currentNodes, edges, layoutDirection));
  }, [edges, layoutDirection, setNodes]);

  const onRestorePresetLayout = useCallback(() => {
    setNodes(createInitialNodes(initialNodeConfigs));
    setEdges(createInitialEdges(initialEdgeConfigs));
    setSelectedNodeId('');
    setSelectedEdgeId('');
    setIsNodeDetailsOpen(false);
    closeEdgeInspector();
    nodeCounterRef.current = initialNodeConfigs.length + 1;
    edgeCounterRef.current = initialEdgeConfigs.length + 1;
  }, [closeEdgeInspector, initialEdgeConfigs, initialNodeConfigs, setEdges, setNodes]);

  return (
    <section className="font-grotesk h-screen w-full bg-white text-slate-950">
      <header className="border-b border-slate-200 px-6 py-4">
        <motion.div
          className="flex flex-wrap items-start justify-between gap-4"
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-start gap-3">
            <motion.div
              whileHover={{ x: -3 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            >
              <Button
                asChild
                variant="outline"
                size="icon"
                className="mt-0.5 h-11 w-11 rounded-2xl border-slate-200 bg-white text-slate-700 shadow-none transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
              >
                <Link href={backHref} aria-label="Wróć do strony głównej">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-grotesk w-fit rounded-[3px] bg-gray-200 px-2 text-xs font-semibold">
                Roadmap
              </p>
              <h1 className="font-poppins mt-1 text-2xl font-semibold">
                {title}
              </h1>
            </motion.div>
          </div>

          {headerActions ? <div className="flex items-center gap-2">{headerActions}</div> : null}
        </motion.div>
      </header>

      <div className="relative h-[calc(100vh-89px)] w-full">
        <ReactFlowProvider>
          <ContextMenu onOpenChange={onContextMenuOpenChange}>
            <ContextMenuTrigger asChild>
              <div ref={flowCanvasRef} className="h-full w-full">
                <ReactFlow
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onInit={(instance) => setReactFlowInstance(instance)}
                  onPaneClick={onPaneClick}
                  onPaneContextMenu={onPaneContextMenu}
                  onNodeClick={onNodeClick}
                  onNodeDragStop={onNodeDragStop}
                  onNodeContextMenu={onNodeContextMenu}
                  onNodeDoubleClick={onNodeDoubleClick}
                  onEdgeClick={onEdgeClick}
                  onEdgeContextMenu={onEdgeContextMenu}
                  onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) => {
                    const firstSelectedNode = selectedNodes[0]?.id ?? '';
                    const firstSelectedEdge = selectedEdges[0]?.id ?? '';
                    setSelectedNodeId(firstSelectedNode);
                    setSelectedEdgeId(firstSelectedEdge);
                  }}
                  fitView
                  fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
                  defaultEdgeOptions={{
                    type: 'bezier',
                    style: { stroke: SOLID_EDGE_COLOR, strokeWidth: 3.2 },
                  }}
                  connectionLineStyle={{ stroke: SOLID_EDGE_COLOR, strokeWidth: 3.2 }}
                  deleteKeyCode={['Backspace', 'Delete']}
                  nodesDraggable
                  nodesConnectable
                  elementsSelectable
                  proOptions={{ hideAttribution: true }}
                  className="bg-[#e6e7ea]"
                >
                  <Controls position="bottom-right" showInteractive={false} />
                  <Background color="#949cb4" gap={36} size={1.4} />
                </ReactFlow>
              </div>
            </ContextMenuTrigger>

            {contextTarget?.kind && contextTarget.kind !== 'pane' ? (
              <ContextMenuContent className="font-grotesk w-64">
                <ContextMenuItem
                  disabled={isEditDisabled}
                  onSelect={withClose(editNodeFromContextMenu)}
                >
                  {editLabel}
                </ContextMenuItem>

                <ContextMenuItem
                  disabled={isDeleteDisabled}
                  variant="destructive"
                  onSelect={withClose(deleteFromContextMenu)}
                >
                  {deleteLabel}
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem onSelect={withClose(onRestorePresetLayout)}>
                  Odtworz layout z obrazka
                </ContextMenuItem>
                <ContextMenuItem onSelect={withClose(onAutoLayout)}>
                  Auto layout (dagre)
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem
                  disabled={isClearSelectionDisabled}
                  onSelect={withClose(clearSelection)}
                >
                  Wyczysc zaznaczenie
                </ContextMenuItem>
              </ContextMenuContent>
            ) : null}
          </ContextMenu>
        </ReactFlowProvider>

        <motion.aside
          className="pointer-events-none absolute top-1/2 left-4 z-20 -translate-y-1/2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.18, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="pointer-events-auto flex flex-col items-center gap-2 rounded-[22px] border border-slate-200/90 bg-white/92 px-2 py-2 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.32)] backdrop-blur-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={addNodeFromToolbar}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                  aria-label="Dodaj kafelek"
                >
                  <Square className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                Dodaj kafelek
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={addFreeTextFromToolbar}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                  aria-label="Dodaj wolny tekst"
                >
                  <Type className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                Dodaj wolny tekst
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={addNoteFromToolbar}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                  aria-label="Dodaj notatkę"
                >
                  <FileText className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                Dodaj notatkę
              </TooltipContent>
            </Tooltip>

            <div className="h-px w-6 bg-slate-200" />

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-700"
                  aria-label="Cofnij"
                >
                  <Undo2 className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                Cofnij
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-slate-700"
                  aria-label="Ponów"
                >
                  <Redo2 className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                Ponów
              </TooltipContent>
            </Tooltip>
          </div>
        </motion.aside>

        <RoadmapNodeDetailsSheet
          data={activeNodeDetailsData}
          open={Boolean(activeNodeDetailsData) && isNodeDetailsOpen}
          onOpenChange={setIsNodeDetailsOpen}
        />
      </div>

      {edgeInspector && activeInspectorEdge && edgeInspectorPosition && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Zamknij panel krawedzi"
            className="absolute inset-0 h-full w-full bg-transparent"
            onClick={closeEdgeInspector}
          />

          <div
            className="pointer-events-auto absolute"
            style={{ left: edgeInspectorPosition.left, top: edgeInspectorPosition.top }}
            onClick={(event) => event.stopPropagation()}
          >
            <div
              className="relative"
              style={{
                width: activeInspectorEdgeLocked
                  ? EDGE_LOCKED_INSPECTOR_WIDTH
                  : EDGE_INSPECTOR_WIDTH,
                height: EDGE_INSPECTOR_HEIGHT,
              }}
            >
              {!activeInspectorEdgeLocked && isLineTooltipOpen && (
                <div
                  className="pointer-events-none absolute z-40 -translate-x-1/2"
                  style={{
                    left: EDGE_INSPECTOR_WIDTH * EDGE_TYPE_BUTTON_CENTER_RATIO,
                    top: EDGE_TYPE_TOOLTIP_TOP,
                  }}
                >
                  <div className="rounded-xl bg-[#1f232d] px-2.5 py-1 text-[10px] font-medium text-white shadow-[0_8px_18px_rgba(15,23,42,0.38)]">
                    Line type
                  </div>
                  <div className="mx-auto h-0 w-0 border-x-[5px] border-t-[5px] border-x-transparent border-t-[#1f232d]" />
                </div>
              )}

              {!activeInspectorEdgeLocked && isEndingTooltipOpen && (
                <div
                  className="absolute z-40 -translate-x-1/2"
                  style={{
                    left: EDGE_INSPECTOR_WIDTH * EDGE_ENDING_BUTTON_CENTER_RATIO,
                    top: EDGE_ENDING_PANEL_TOP,
                  }}
                >
                  <div
                    className="rounded-[14px] border border-[#d7d8dd] bg-[#f3f3f4]/98 p-2 shadow-[0_12px_24px_rgba(15,23,42,0.2)]"
                    style={{ width: EDGE_ENDING_PANEL_WIDTH }}
                  >
                    {EDGE_ENDING_OPTIONS.map((option) => {
                      const isActive = activeInspectorEdgeEnding === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setInspectorEdgeEnding(option.value);
                            setIsEndingTooltipOpen(false);
                          }}
                          className={[
                            'flex h-10 w-full items-center justify-center rounded-[10px] transition',
                            isActive ? 'bg-[#e6ebfa]' : 'hover:bg-white/70',
                          ].join(' ')}
                          title={option.label}
                        >
                          {renderEdgeEndingIcon(option.value)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!activeInspectorEdgeLocked && isLineTooltipOpen && (
                <div
                  className="absolute z-40 -translate-x-1/2"
                  style={{
                    left: EDGE_INSPECTOR_WIDTH * EDGE_TYPE_BUTTON_CENTER_RATIO,
                    top: EDGE_TYPE_PANEL_TOP,
                  }}
                >
                  <div
                    className="rounded-[12px] border border-[#d7d8dd] bg-[#f3f3f4]/98 p-2.5 shadow-[0_12px_24px_rgba(15,23,42,0.2)]"
                    style={{ width: EDGE_TYPE_PANEL_WIDTH }}
                  >
                    <div className="mb-2 grid grid-cols-3 gap-1">
                      {EDGE_TYPE_OPTIONS.map((option) => {
                        const isActive = activeInspectorEdgeType === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setInspectorEdgeType(option.value)}
                            className={[
                              'flex h-8 items-center justify-center rounded-[10px] transition',
                              isActive ? 'bg-[#e6ebfa]' : 'hover:bg-white/70',
                            ].join(' ')}
                            title={`Typ: ${option.label}`}
                          >
                            <span className="scale-[0.82]">
                              {renderEdgeTypeIcon(option.value, isActive)}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                      {EDGE_VARIANT_OPTIONS.map((option) => {
                        const isActive = activeInspectorEdgeVariant === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setInspectorEdgeVariant(option.value)}
                            className={[
                              'flex h-8 items-center justify-center rounded-[10px] transition',
                              isActive ? 'bg-[#e6ebfa]' : 'hover:bg-white/70',
                            ].join(' ')}
                            title={`Styl: ${option.label}`}
                          >
                            <span className="scale-[0.82]">
                              {renderEdgeVariantIcon(option.value, isActive)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {!activeInspectorEdgeLocked && isColorTooltipOpen && (
                <div
                  className="absolute z-40 -translate-x-1/2"
                  style={{
                    left: EDGE_INSPECTOR_WIDTH * EDGE_COLOR_BUTTON_CENTER_RATIO,
                    top: EDGE_COLOR_PANEL_TOP,
                  }}
                >
                  <div
                    className="rounded-[16px] border border-[#d7d8dd] bg-[#f3f3f4]/98 p-4 shadow-[0_16px_32px_rgba(15,23,42,0.22)]"
                    style={{ width: EDGE_COLOR_PANEL_WIDTH }}
                  >
                    <p className="mb-2 text-[12px] font-medium text-slate-500">All colors</p>

                    <div className="grid grid-cols-4 gap-2.5">
                      {EDGE_COLOR_SWATCHES.flat().map((color) => {
                        const isActive = activeInspectorEdgeColor === color;
                        const isLight =
                          color === '#ffffff' || color === '#e6e6e6' || color === '#ece4a8';

                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setInspectorEdgeColor(color)}
                            className={[
                              'h-9 w-9 rounded-full border transition hover:scale-105',
                              isActive ? 'ring-2 ring-[#94a3ff] ring-offset-1' : '',
                              isLight ? 'border-slate-300' : 'border-black/22',
                            ].join(' ')}
                            style={{ backgroundColor: color }}
                            aria-label={`Kolor linii ${color}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {!activeInspectorEdgeLocked && isTextTooltipOpen && (
                <div
                  className="absolute z-40 -translate-x-1/2"
                  style={{
                    left: EDGE_INSPECTOR_WIDTH * EDGE_TEXT_BUTTON_CENTER_RATIO,
                    top: EDGE_TEXT_PANEL_TOP,
                  }}
                >
                  <div
                    className="rounded-[14px] border border-[#d7d8dd] bg-[#f3f3f4]/98 p-3 shadow-[0_14px_28px_rgba(15,23,42,0.22)]"
                    style={{ width: EDGE_TEXT_PANEL_WIDTH }}
                  >
                    <p className="font-grotesk mb-2 text-[12px] font-medium text-slate-600">
                      Tekst na linii
                    </p>

                    <input
                      value={activeInspectorEdgeLabelText}
                      onChange={(event) => setInspectorEdgeLabelText(event.target.value)}
                      className="mb-3 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[12px] text-slate-800 outline-none focus:border-sky-500"
                      placeholder="Wpisz tekst..."
                    />

                    <p className="font-grotesk mb-1 text-[11px] font-medium text-slate-500">
                      Rozmiar
                    </p>
                    <div className="mb-3 grid grid-cols-4 gap-1">
                      {EDGE_LABEL_SIZE_OPTIONS.map((size) => {
                        const isActive = activeInspectorEdgeLabelSize === size;

                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setInspectorEdgeLabelSize(size)}
                            className={[
                              'flex h-7 items-center justify-center rounded-md text-[11px] font-semibold transition',
                              isActive
                                ? 'bg-[#e6ebfa] text-[#2f47bf]'
                                : 'bg-white text-slate-600 hover:bg-slate-100/80',
                            ].join(' ')}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>

                    <p className="font-grotesk mb-1 text-[11px] font-medium text-slate-500">
                      Kolor tekstu
                    </p>
                    <div className="grid grid-cols-6 gap-1.5">
                      {EDGE_LABEL_COLOR_OPTIONS.map((color) => {
                        const isActive = activeInspectorEdgeLabelColor === color;

                        return (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setInspectorEdgeLabelColor(color)}
                            className={[
                              'h-6 w-6 rounded-full border transition',
                              isActive ? 'ring-2 ring-[#94a3ff] ring-offset-1' : '',
                              color === '#ffffff' ? 'border-slate-300' : 'border-black/25',
                            ].join(' ')}
                            style={{ backgroundColor: color }}
                            aria-label={`Kolor tekstu ${color}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeInspectorEdgeLocked ? (
                <div
                  className="origin-top-left"
                  style={{
                    width: EDGE_LOCKED_INSPECTOR_BASE_WIDTH,
                    height: EDGE_INSPECTOR_BASE_HEIGHT,
                    transform: `scale(${EDGE_INSPECTOR_SCALE})`,
                  }}
                >
                  <div className="grid h-full w-full grid-cols-[1fr_2.5fr] overflow-hidden rounded-[14px] border border-[#d7d8dd] bg-[#efeff1]/95 shadow-[0_10px_22px_rgba(15,23,42,0.16)] backdrop-blur-xl">
                    <button
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        startUnlockHold();
                      }}
                      onPointerUp={cancelUnlockHold}
                      onPointerLeave={cancelUnlockHold}
                      onPointerCancel={cancelUnlockHold}
                      className="relative isolate flex items-center justify-center border-r border-[#d7d8dd] text-slate-900"
                      aria-label="Przytrzymaj, aby odblokować linie"
                    >
                      <span
                        className="pointer-events-none absolute inset-0 origin-left bg-[#dde4f6]"
                        style={{
                          transform: `scaleX(${unlockHoldProgress})`,
                          opacity: unlockHoldProgress > 0 ? 1 : 0.46,
                          transition:
                            unlockHoldProgress > 0
                              ? 'none'
                              : 'transform 180ms ease-out, opacity 180ms ease-out',
                        }}
                      />
                      <Lock className="relative z-10 h-7 w-7 stroke-[2.2]" />
                    </button>

                    <div className="flex items-center justify-center px-3 text-center text-[13px] font-semibold tracking-[0.01em] text-slate-600 select-none">
                      Przytrzymaj, aby odblokować
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="origin-top-left"
                  style={{
                    width: EDGE_INSPECTOR_BASE_WIDTH,
                    height: EDGE_INSPECTOR_BASE_HEIGHT,
                    transform: `scale(${EDGE_INSPECTOR_SCALE})`,
                  }}
                >
                  <div className="grid h-full w-full grid-cols-[1fr_1.1fr_1fr_1fr_1fr_1fr] overflow-visible rounded-[14px] border border-[#d7d8dd] bg-[#efeff1]/95 shadow-[0_10px_22px_rgba(15,23,42,0.16)] backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEndingTooltipOpen((current) => !current);
                        setIsLineTooltipOpen(false);
                        setIsColorTooltipOpen(false);
                        setIsTextTooltipOpen(false);
                      }}
                      className={[
                        'flex items-center justify-center border-r border-[#d7d8dd] text-slate-900 transition hover:bg-white/55',
                        isEndingTooltipOpen ? 'bg-[#dfe2e9]' : '',
                      ].join(' ')}
                      aria-label="Zakonczenie linii"
                    >
                      <span className="scale-[0.9]">
                        {renderEdgeEndingIcon(
                          activeInspectorEdgeEnding ?? 'none',
                          activeInspectorEdgeColor ?? '#11162f'
                        )}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsLineTooltipOpen((current) => !current);
                        setIsEndingTooltipOpen(false);
                        setIsColorTooltipOpen(false);
                        setIsTextTooltipOpen(false);
                      }}
                      className={[
                        'flex h-full w-full flex-col items-center justify-center gap-0.5 border-r border-[#d7d8dd] text-slate-900 transition hover:bg-white/55',
                        isLineTooltipOpen ? 'bg-[#dfe2e9]' : '',
                      ].join(' ')}
                      aria-label="Typ linii"
                    >
                      {renderEdgeTypeIcon(activeInspectorEdgeType ?? 'bezier', true)}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsColorTooltipOpen((current) => !current);
                        setIsEndingTooltipOpen(false);
                        setIsLineTooltipOpen(false);
                        setIsTextTooltipOpen(false);
                      }}
                      className={[
                        'flex items-center justify-center border-r border-[#d7d8dd] transition hover:bg-white/55',
                        isColorTooltipOpen ? 'bg-[#dfe2e9]' : '',
                      ].join(' ')}
                      aria-label="Kolor linii"
                    >
                      <span
                        className="h-7 w-7 rounded-full border border-slate-400/65"
                        style={{ backgroundColor: activeInspectorEdgeColor ?? SOLID_EDGE_COLOR }}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsTextTooltipOpen((current) => !current);
                        setIsEndingTooltipOpen(false);
                        setIsLineTooltipOpen(false);
                        setIsColorTooltipOpen(false);
                      }}
                      className="relative flex items-center justify-center border-r border-[#d7d8dd] text-slate-900 transition hover:bg-white/55"
                      aria-label="Tekst linii"
                    >
                      <span className="relative inline-flex h-7 w-7 items-center justify-center">
                        <Type className="h-[32px] w-[32px] stroke-[2.3]" />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute top-[66%] left-[94%] -translate-x-1/2 -translate-y-1/2 scale-150 text-[13px] leading-none font-black text-slate-900"
                        >
                          +
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        closeInspectorTooltips();
                        setInspectorEdgeLocked(true);
                      }}
                      className="flex items-center justify-center border-r border-[#d7d8dd] text-slate-900 transition hover:bg-white/55"
                      aria-label="Zablokuj linie"
                    >
                      <Lock className="h-7 w-7 stroke-[2.2]" />
                    </button>

                    <button
                      type="button"
                      onClick={onMockToolbarAction}
                      className="flex items-center justify-center text-slate-900 transition hover:bg-white/55"
                      aria-label="Mock: wiecej"
                    >
                      <MoreVertical className="h-7 w-7 stroke-[2.4]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={Boolean(editingNodeId)}
        onOpenChange={(open) => {
          if (!open) closeEditDialog();
        }}
      >
        <DialogContent className="font-poppins flex max-h-[calc(100vh-1rem)] w-[min(680px,calc(100vw-1rem))] max-w-none flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 shadow-[0_28px_90px_-36px_rgba(15,23,42,0.35)]">
          <form onSubmit={saveEditedNode} className="flex min-h-0 flex-1 flex-col">
            <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-7">
              <DialogHeader className="relative items-start gap-3 pr-10 text-left">
                <div>
                  <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-950">
                    {editDialogTitle}
                  </DialogTitle>
                  <DialogDescription className="mt-2 max-w-[44ch] text-sm leading-6 text-slate-600">
                    {editDialogDescription}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="relative mt-6 space-y-5">
                {editingNodeType === 'roadmapTile' ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="roadmap-node-phase" className="text-xs text-black/70">
                          Faza
                        </Label>
                        <Input
                          id="roadmap-node-phase"
                          value={editDraft.phase}
                          onChange={onEditDraftChange('phase')}
                          className="rounded-xl border border-slate-200 bg-white! text-black! shadow-none focus-visible:border-gray-500 focus-visible:ring-sky-100"
                          placeholder="Phase 07"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="roadmap-node-timeline" className="text-xs text-black/70">
                          Czas
                        </Label>
                        <Input
                          id="roadmap-node-timeline"
                          value={editDraft.timeline}
                          onChange={onEditDraftChange('timeline')}
                          className="rounded-xl border border-slate-200 bg-white! text-black! shadow-none focus-visible:border-gray-500 focus-visible:ring-sky-100"
                          placeholder="Weeks 24-28"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roadmap-node-title" className="text-xs text-black/70">
                        Tytuł
                      </Label>
                      <Input
                        id="roadmap-node-title"
                        value={editDraft.title}
                        onChange={onEditDraftChange('title')}
                        className="rounded-xl border border-slate-200 bg-white! text-black! shadow-none focus-visible:border-gray-500 focus-visible:ring-sky-100"
                        placeholder="Server Side"
                        autoFocus
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roadmap-node-summary" className="text-xs text-black/70">
                        Opis
                      </Label>
                      <Textarea
                        id="roadmap-node-summary"
                        value={editDraft.summary}
                        onChange={onEditDraftChange('summary')}
                        className="min-h-28 rounded-xl border border-slate-200 bg-white! text-black! shadow-none focus-visible:border-slate-200 focus-visible:ring-0 sm:min-h-32"
                        placeholder="Opisz co ten fragment powinien pokryć"
                      />
                    </div>
                  </>
                ) : null}

                {editingNodeType === 'roadmapNote' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="roadmap-note-title" className="text-xs text-black/70">
                        Nagłówek notatki
                      </Label>
                      <Input
                        id="roadmap-note-title"
                        value={editDraft.title}
                        onChange={onEditDraftChange('title')}
                        className="rounded-xl border border-slate-200 bg-white! text-black! shadow-none focus-visible:border-gray-500 focus-visible:ring-sky-100"
                        placeholder="Nowa notatka"
                        autoFocus
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="roadmap-note-summary" className="text-xs text-black/70">
                        Treść
                      </Label>
                      <Textarea
                        id="roadmap-note-summary"
                        value={editDraft.summary}
                        onChange={onEditDraftChange('summary')}
                        className="min-h-32 rounded-xl border border-slate-200 bg-white! text-black! shadow-none focus-visible:border-slate-200 focus-visible:ring-0"
                        placeholder="Zapisz ważną notatkę do tego miejsca."
                      />
                    </div>
                  </>
                ) : null}

                {editingNodeType === 'roadmapText' ? (
                  <div className="space-y-2">
                    <Label htmlFor="roadmap-free-text" className="text-xs text-black/70">
                      Treść tekstu
                    </Label>
                    <Textarea
                      id="roadmap-free-text"
                      value={editDraft.title}
                      onChange={onEditDraftChange('title')}
                      className="min-h-40 rounded-xl border border-slate-200 bg-white! text-black! shadow-none focus-visible:border-slate-200 focus-visible:ring-0"
                      placeholder="Wpisz swobodny tekst..."
                      autoFocus
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-slate-50/70 px-5 py-4 sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <DialogFooter className="sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeEditDialog}
                    className="h-11 rounded-xl border-slate-200 px-5 text-slate-700"
                  >
                    Anuluj
                  </Button>
                  <Button
                    type="submit"
                    className="h-11 rounded-xl bg-slate-950 px-5 text-white hover:bg-slate-800"
                  >
                    Zapisz zmiany
                  </Button>
                </DialogFooter>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default RoadmapReactFlowPage;
