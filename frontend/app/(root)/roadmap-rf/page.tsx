'use client';

import type { ChangeEvent, FormEvent, MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dagre from 'dagre';
import {
  addEdge,
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
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
  ContextMenuLabel,
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
import '@xyflow/react/dist/style.css';
import { Lock, MoreVertical, Type } from 'lucide-react';

import { RoadmapTileNode } from '@/components/roadmap/RoadmapTileNode';
import type { RoadmapNodeData as TileNodeData } from '@/components/roadmap/RoadmapTileNode';
import { presetEdges, presetNodes } from '@/roadmap/configs/presets';

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

type RoadmapNode = Node<TileNodeData>;

type EdgeInspectorState = {
  edgeId: string;
  clientX: number;
  clientY: number;
};

type ContextTarget =
  | { kind: 'pane'; flowPosition: { x: number; y: number } }
  | { kind: 'node'; nodeId: string; flowPosition: { x: number; y: number } }
  | { kind: 'edge'; edgeId: string };

const NODE_WIDTH = 280;
const NODE_HEIGHT = 78;

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
const EDGE_COLOR_SWATCHES: string[][] = [
  ['#ece4a8', '#f8df53', '#bf8900', '#ffffff'],
  ['#efc9ab', '#ffa34d', '#b8610a', '#e6e6e6'],
  ['#f0c2ca', '#ff646a', '#d6030c', '#bfbfbf'],
  ['#9ad9b3', '#34c765', '#0f8b34', '#666666'],
  ['#aebfdf', '#6496e4', '#355faf', '#17181b'],
  ['#c7c1e2', '#8b78dd', '#5f34d6'],
];
const EDGE_INSPECTOR_MARGIN = 16;
const TILE_TEXT_FONT =
  '600 15px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
const TILE_TEXT_HORIZONTAL_MARGIN = 82;
const TILE_MIN_WIDTH = 120;
const TILE_MAX_WIDTH = 560;
const TILE_HEIGHT_SINGLE_LINE = 62;
const TILE_HEIGHT_WITH_META = 80;

let tileMeasureCanvas: HTMLCanvasElement | null = null;

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
}: EdgeProps<Edge>) => {
  const [edgePath, labelX, labelY] =
    type === 'straight'
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

  const labelText = typeof label === 'string' ? label.trim() : '';
  if (!labelText) {
    return <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />;
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
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
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
  const normalizedTitle = step.title.trim() || 'Untitled node';
  const hasMeta = Boolean(step.phase.trim() || step.timeline.trim());

  let textWidth = normalizedTitle.length * 8;

  if (typeof document !== 'undefined') {
    tileMeasureCanvas ??= document.createElement('canvas');
    const context = tileMeasureCanvas.getContext('2d');
    if (context) {
      context.font = TILE_TEXT_FONT;
      textWidth = context.measureText(normalizedTitle).width;
    }
  }

  const width = clamp(
    Math.ceil(textWidth + TILE_TEXT_HORIZONTAL_MARGIN),
    TILE_MIN_WIDTH,
    TILE_MAX_WIDTH
  );
  const height = hasMeta ? TILE_HEIGHT_WITH_META : TILE_HEIGHT_SINGLE_LINE;

  return {
    width,
    height,
  };
};

const createRoadmapNode = (
  id: string,
  step: RoadmapDraft,
  position: { x: number; y: number },
  options?: { tone?: NodeTone; width?: number; height?: number }
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
      tone: options?.tone ?? 'cream',
      width: options?.width ?? autoSize.width,
      height: options?.height ?? autoSize.height,
    },
    position,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  };
};

const createInitialNodes = (): RoadmapNode[] => {
  return presetNodes.map((cfg) => {
    const step: RoadmapDraft = { phase: '', title: cfg.title, timeline: '', summary: '' };
    const autoSize = getTileSizeFromText(step);

    return createRoadmapNode(
      cfg.id,
      step,
      { x: cfg.x, y: cfg.y },
      {
        tone: cfg.tone ?? 'cream',
        width: cfg.width ?? autoSize.width,
        height: cfg.height ?? autoSize.height,
      }
    );
  });
};

const createInitialEdges = (): Edge[] => {
  return presetEdges.map((edge) => ({
    ...createStyledEdge({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      variant: edge.variant,
      type: edge.type,
      color: edge.color,
      ending: edge.ending,
    }),
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  }));
};

const layoutWithDagre = (nodes: RoadmapNode[], edges: Edge[]): RoadmapNode[] => {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: 'LR',
    nodesep: 62,
    ranksep: 96,
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
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      position: {
        x: x - width / 2,
        y: y - height / 2,
      },
    };
  });
};

const RoadmapReactFlowPage = () => {
  const nodeTypes = useMemo(() => ({ roadmapTile: RoadmapTileNode }), []);
  const edgeTypes = useMemo(
    () => ({
      straight: RoadmapConnectionEdge,
      step: RoadmapConnectionEdge,
      bezier: RoadmapConnectionEdge,
    }),
    []
  );

  const initialGraph = useMemo(() => {
    const initialEdges = createInitialEdges();
    const initialNodes = createInitialNodes();

    return {
      nodes: initialNodes,
      edges: initialEdges,
    };
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState<RoadmapNode>(initialGraph.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialGraph.edges);

  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>('');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<RoadmapDraft>(initialDraft);

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

  const nodeCounterRef = useRef(presetNodes.length + 1);
  const edgeCounterRef = useRef(presetEdges.length + 1);
  const unlockHoldRafRef = useRef<number | null>(null);
  const unlockHoldStartedAtRef = useRef<number | null>(null);
  const unlockHoldEdgeIdRef = useRef<string | null>(null);

  const activeInspectorEdge = useMemo(() => {
    if (!edgeInspector) return null;
    return edges.find((edge) => edge.id === edgeInspector.edgeId) ?? null;
  }, [edgeInspector, edges]);

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

  const onEdgeClick = useCallback(
    (event: ReactMouseEvent, edge: Edge) => {
      event.preventDefault();
      event.stopPropagation();
      setContextTarget(null);
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
    [cancelUnlockHold, closeInspectorTooltips, setSelectedEdgeId, setSelectedNodeId]
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
            id: `e-${edgeCounterRef.current++}`,
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
    [setEdges]
  );

  const createNodeAtPosition = useCallback(
    (position: { x: number; y: number }) => {
      const nextNumber = nodeCounterRef.current;
      nodeCounterRef.current += 1;

      const id = `node-${nextNumber}`;
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
    },
    [setNodes]
  );

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
      closeEdgeInspector();
      const flowPosition = getFlowPositionFromClient(event.clientX, event.clientY);
      if (!flowPosition) return;

      setContextTarget({
        kind: 'pane',
        flowPosition,
      });
    },
    [closeEdgeInspector, getFlowPositionFromClient]
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
      setContextTarget({
        kind: 'edge',
        edgeId: edge.id,
      });
    },
    [closeEdgeInspector]
  );

  const onPaneClick = useCallback(() => {
    closeEdgeInspector();
  }, [closeEdgeInspector]);

  const onNodeClick = useCallback(() => {
    closeEdgeInspector();
  }, [closeEdgeInspector]);

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

  const addNodeFromContextMenu = useCallback(() => {
    if (!contextTarget) return;
    if (contextTarget.kind === 'edge') return;

    createNodeAtPosition(contextTarget.flowPosition);
  }, [contextTarget, createNodeAtPosition]);

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

  const canAddNodeFromContext = contextTarget?.kind === 'pane' || contextTarget?.kind === 'node';

  const contextLabel = useMemo(() => {
    if (!contextTarget) return 'Canvas menu';
    if (contextTarget.kind === 'pane') return 'Canvas';
    if (contextTarget.kind === 'node') return 'Node';
    return 'Połączenie';
  }, [contextTarget]);

  const contextNode =
    contextTarget?.kind === 'node' ? nodes.find((node) => node.id === contextTarget.nodeId) : null;

  const contextEdge =
    contextTarget?.kind === 'edge' ? edges.find((edge) => edge.id === contextTarget.edgeId) : null;

  const contextDescription =
    contextTarget?.kind === 'node'
      ? (contextNode?.data.title ?? contextTarget.nodeId)
      : contextTarget?.kind === 'edge'
        ? `${contextEdge?.source ?? ''} -> ${contextEdge?.target ?? ''}`.trim()
        : 'Kliknij PPM na canvasie lub elemencie';

  const deleteLabel = useMemo(() => {
    if (!contextTarget) return 'Usuń zaznaczony element';
    if (contextTarget.kind === 'node') return 'Usuń kafelek (node)';
    if (contextTarget.kind === 'edge') return 'Usuń połączenie';
    if (selectedNodeId) return 'Usuń zaznaczony kafelek';
    if (selectedEdgeId) return 'Usuń zaznaczone połączenie';
    return 'Usuń zaznaczony element';
  }, [contextTarget, selectedEdgeId, selectedNodeId]);

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

      const normalized: RoadmapDraft = {
        phase: editDraft.phase.trim() || 'Custom phase',
        title: editDraft.title.trim() || 'Untitled node',
        timeline: editDraft.timeline.trim() || 'Custom timeline',
        summary: editDraft.summary.trim() || 'Custom roadmap step.',
      };
      const nextSize = getTileSizeFromText(normalized);

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
    [editDraft, editingNodeId, setNodes]
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

  const addNodeLabel = contextTarget?.kind === 'node' ? 'Dodaj kafelek obok noda' : 'Dodaj kafelek';

  const onContextMenuOpenChange = (open: boolean) => {
    if (!open) closeContextMenu();
    if (open) closeEdgeInspector();
  };

  const onAutoLayout = useCallback(() => {
    setNodes((currentNodes) => layoutWithDagre(currentNodes, edges));
  }, [edges, setNodes]);

  const onRestorePresetLayout = useCallback(() => {
    setNodes(createInitialNodes());
    setEdges(createInitialEdges());
    setSelectedNodeId('');
    setSelectedEdgeId('');
    closeEdgeInspector();
    nodeCounterRef.current = presetNodes.length + 1;
    edgeCounterRef.current = presetEdges.length + 1;
  }, [closeEdgeInspector, setEdges, setNodes]);

  return (
    <section className="font-grotesk h-screen w-full bg-white text-slate-950">
      <header className="border-b border-slate-200 px-6 py-4">
        <p className="font-grotesk w-fit rounded-[3px] bg-gray-200 px-2 text-xs font-semibold">
          Roadmap
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Career Path for Gamedeveloper</h1>
      </header>

      <div className="h-[calc(100vh-89px)] w-full">
        <ReactFlowProvider>
          <ContextMenu onOpenChange={onContextMenuOpenChange}>
            <ContextMenuTrigger asChild>
              <div className="h-full w-full">
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
                  <MiniMap
                    pannable
                    zoomable
                    nodeStrokeWidth={2}
                    nodeColor={() => '#f3df9f'}
                    maskColor="rgba(17, 22, 47, 0.18)"
                  />
                  <Controls position="bottom-right" showInteractive={false} />
                  <Background color="#949cb4" gap={36} size={1.4} />
                </ReactFlow>
              </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="font-grotesk w-64">
              <ContextMenuLabel>{contextLabel}</ContextMenuLabel>
              <ContextMenuLabel className="text-muted-foreground text-xs font-normal">
                {contextDescription}
              </ContextMenuLabel>
              <ContextMenuSeparator />

              {canAddNodeFromContext && (
                <ContextMenuItem onSelect={withClose(addNodeFromContextMenu)}>
                  {addNodeLabel}
                </ContextMenuItem>
              )}

              <ContextMenuItem
                disabled={isEditDisabled}
                onSelect={withClose(editNodeFromContextMenu)}
              >
                Edytuj kafelek
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
          </ContextMenu>
        </ReactFlowProvider>
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
        <DialogContent className="font-grotesk sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edytuj kafelek</DialogTitle>
            <DialogDescription>
              Zmien dane noda. Otwarcie: podwójne kliknięcie na kafelku.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveEditedNode} className="space-y-3">
            <input
              value={editDraft.phase}
              onChange={onEditDraftChange('phase')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-500"
              placeholder="Phase"
            />
            <input
              value={editDraft.title}
              onChange={onEditDraftChange('title')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-500"
              placeholder="Title"
              required
            />
            <input
              value={editDraft.timeline}
              onChange={onEditDraftChange('timeline')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-500"
              placeholder="Timeline"
            />
            <textarea
              value={editDraft.summary}
              onChange={onEditDraftChange('summary')}
              className="min-h-24 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-sky-500"
              placeholder="Summary"
            />

            <DialogFooter>
              <button
                type="button"
                onClick={closeEditDialog}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-400 hover:text-sky-700"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="rounded-lg border border-sky-500 bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Zapisz
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default RoadmapReactFlowPage;
