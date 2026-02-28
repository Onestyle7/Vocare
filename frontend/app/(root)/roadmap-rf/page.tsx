'use client';

import type { ChangeEvent, FormEvent, MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dagre from 'dagre';
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  Position,
} from '@xyflow/react';
import type { Connection, Edge, Node, ReactFlowInstance } from '@xyflow/react';
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

import { RoadmapTileNode } from '@/components/roadmap/RoadmapTileNode';
import type { RoadmapNodeData as TileNodeData } from '@/components/roadmap/RoadmapTileNode';

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

type PresetNodeConfig = {
  id: string;
  title: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  tone?: NodeTone;
};

type PresetEdgeConfig = {
  id: string;
  source: string;
  target: string;
  variant?: EdgeVariant;
  type?: Edge['type'];
  sourceHandle?: string;
  targetHandle?: string;
};

const NODE_WIDTH = 280;
const NODE_HEIGHT = 78;

const SOLID_EDGE_COLOR = '#2f6fd6';
const DOTTED_EDGE_COLOR = '#2f6fd6';
const DASHED_EDGE_COLOR = '#11162f';
const EDGE_INSPECTOR_WIDTH = 360;
const EDGE_INSPECTOR_HEIGHT = 84;
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

const getEdgeStyle = (variant: EdgeVariant): Edge['style'] => {
  if (variant === 'solid') {
    return { stroke: SOLID_EDGE_COLOR, strokeWidth: 3.2 };
  }

  if (variant === 'dashed') {
    return {
      stroke: DASHED_EDGE_COLOR,
      strokeWidth: 3,
      strokeDasharray: '11 8',
      strokeLinecap: 'round',
    };
  }

  return {
    stroke: DOTTED_EDGE_COLOR,
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

const getEdgeInspectorPosition = (clientX: number, clientY: number) => {
  if (typeof window === 'undefined') {
    return { left: clientX, top: clientY };
  }

  const boundedWidth = Math.max(
    180,
    Math.min(EDGE_INSPECTOR_WIDTH, window.innerWidth - EDGE_INSPECTOR_MARGIN * 2)
  );
  const boundedHeight = Math.max(
    44,
    Math.min(EDGE_INSPECTOR_HEIGHT, window.innerHeight - EDGE_INSPECTOR_MARGIN * 2)
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

const presetNodes: PresetNodeConfig[] = [
  { id: 'client_side', title: 'Client Side Development', x: 760, y: 14, tone: 'main' },
  { id: 'server_side', title: 'Server Side', x: 1140, y: 14, tone: 'neutral' },
  { id: 'game_math', title: 'Game Mathematics', x: 760, y: 352, tone: 'main' },
  { id: 'curve', title: 'Curve', x: 760, y: 520, tone: 'neutral' },
  { id: 'spline', title: 'Spline', x: 760, y: 602 },
  { id: 'hermite', title: 'Hermite', x: 936, y: 602 },
  { id: 'bezier', title: 'Bezier', x: 760, y: 682 },
  { id: 'catmull_rom', title: 'Catmull-Rom', x: 936, y: 682 },
  { id: 'linear_algebra', title: 'Linear Algebra', x: 138, y: 126 },
  { id: 'vector', title: 'Vector', x: 138, y: 204 },
  { id: 'matrix', title: 'Matrix', x: 334, y: 204 },
  { id: 'linear_transformation', title: 'Linear Transformation', x: 138, y: 282 },
  { id: 'geometry', title: 'Geometry', x: 138, y: 360 },
  { id: 'affine_space', title: 'Affine Space', x: 334, y: 360 },
  { id: 'affine_transformation', title: 'Affine Transformation', x: 138, y: 438 },
  { id: 'projection', title: 'Projection', x: 138, y: 516, tone: 'neutral' },
  { id: 'orientation', title: 'Orientation', x: 334, y: 516, tone: 'neutral' },
  { id: 'perspective', title: 'Perspective', x: 138, y: 594 },
  { id: 'quaternion', title: 'Quaternion', x: 334, y: 594 },
  { id: 'orthogonal', title: 'Orthogonal', x: 138, y: 672 },
  { id: 'euler_angle', title: 'Euler Angle', x: 334, y: 672 },
  { id: 'unity3d', title: 'Unity 3D', x: 138, y: 810 },
  { id: 'unreal_engine', title: 'Unreal Engine', x: 138, y: 888 },
  { id: 'native', title: 'Native', x: 138, y: 966 },
  { id: 'game_engine', title: 'Game Engine', x: 500, y: 888, tone: 'main' },
  { id: 'center_of_mass', title: 'Center of Mass', x: 1204, y: 190 },
  { id: 'moment_of_inertia', title: 'Moment of Inertia', x: 1204, y: 268 },
  { id: 'acceleration', title: 'Acceleration', x: 1204, y: 346 },
  { id: 'joints', title: 'Joints', x: 1360, y: 346 },
  { id: 'restitution', title: 'Restitution', x: 1204, y: 424 },
  { id: 'force', title: 'Force', x: 1360, y: 424 },
  { id: 'angular_velocity', title: 'Angular Velocity', x: 1204, y: 502 },
  { id: 'buoyancy', title: 'Buoyancy', x: 1204, y: 580 },
  { id: 'friction', title: 'Friction', x: 1360, y: 580 },
  { id: 'linear_velocity', title: 'Linear Velocity', x: 1204, y: 658 },
  { id: 'dynamics', title: 'Dynamics', x: 1204, y: 736, tone: 'neutral' },
  { id: 'game_physics', title: 'Game Physics', x: 1228, y: 888, tone: 'main' },
];

const presetEdges: PresetEdgeConfig[] = [
  {
    id: 'e-client-server',
    source: 'client_side',
    target: 'server_side',
    variant: 'solid',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },

  {
    id: 'e-client-math',
    source: 'client_side',
    target: 'game_math',
    variant: 'solid',
    type: 'step',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },
  {
    id: 'e-math-physics',
    source: 'game_math',
    target: 'game_physics',
    variant: 'solid',
    type: 'bezier',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },
  {
    id: 'e-engine-physics',
    source: 'game_engine',
    target: 'game_physics',
    variant: 'solid',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },

  {
    id: 'e-curve-core',
    source: 'game_math',
    target: 'curve',
    variant: 'dotted',
    type: 'step',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },

  // --- TO jest kluczowe: wszystkie te idą w t-left game_math ---
  {
    id: 'e-la-core',
    source: 'linear_algebra',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },
  {
    id: 'e-vector-core',
    source: 'vector',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },
  {
    id: 'e-matrix-core',
    source: 'matrix',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },
  {
    id: 'e-lt-core',
    source: 'linear_transformation',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },
  {
    id: 'e-geometry-core',
    source: 'geometry',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },
  {
    id: 'e-affine-core',
    source: 'affine_space',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },
  {
    id: 'e-at-core',
    source: 'affine_transformation',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },
  {
    id: 'e-proj-core',
    source: 'projection',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },
  {
    id: 'e-orient-core',
    source: 'orientation',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },

  {
    id: 'e-unity-engine',
    source: 'unity3d',
    target: 'game_engine',
    variant: 'dotted',
    type: 'bezier',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },
  {
    id: 'e-unreal-engine',
    source: 'unreal_engine',
    target: 'game_engine',
    variant: 'dotted',
    type: 'bezier',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },
  {
    id: 'e-native-engine',
    source: 'native',
    target: 'game_engine',
    variant: 'dotted',
    type: 'bezier',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },

  {
    id: 'e-dynamics-physics',
    source: 'dynamics',
    target: 'game_physics',
    variant: 'dotted',
    type: 'step',
    sourceHandle: 's-right',
    targetHandle: 't-left',
  },
];

const createStyledEdge = ({
  id,
  source,
  target,
  variant = 'solid',
  type = 'bezier',
}: {
  id: string;
  source: string;
  target: string;
  variant?: EdgeVariant;
  type?: Edge['type'];
}): Edge => ({
  id,
  source,
  target,
  type,
  data: { variant },
  style: getEdgeStyle(variant),
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

    return createRoadmapNode(cfg.id, step, { x: cfg.x, y: cfg.y }, {
      tone: cfg.tone ?? 'cream',
      width: cfg.width ?? autoSize.width,
      height: cfg.height ?? autoSize.height,
    });
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

  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    RoadmapNode,
    Edge
  > | null>(null);

  const nodeCounterRef = useRef(presetNodes.length + 1);
  const edgeCounterRef = useRef(presetEdges.length + 1);

  const activeInspectorEdge = useMemo(() => {
    if (!edgeInspector) return null;
    return edges.find((edge) => edge.id === edgeInspector.edgeId) ?? null;
  }, [edgeInspector, edges]);

  const edgeInspectorPosition = useMemo(() => {
    if (!edgeInspector) return null;
    return getEdgeInspectorPosition(edgeInspector.clientX, edgeInspector.clientY);
  }, [edgeInspector]);

  const activeInspectorEdgeType = useMemo(() => {
    if (!activeInspectorEdge) return null;
    return toEdgeType(activeInspectorEdge.type);
  }, [activeInspectorEdge]);

  const activeInspectorEdgeVariant = useMemo(() => {
    if (!activeInspectorEdge) return null;
    return toEdgeVariant(activeInspectorEdge);
  }, [activeInspectorEdge]);

  const closeEdgeInspector = useCallback(() => {
    setEdgeInspector(null);
  }, []);

  useEffect(() => {
    if (!edgeInspector || activeInspectorEdge) return;
    setEdgeInspector(null);
  }, [activeInspectorEdge, edgeInspector]);

  useEffect(() => {
    if (!edgeInspector) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEdgeInspector(null);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [edgeInspector]);

  const updateEdgeAppearance = useCallback(
    (edgeId: string, updates: { type?: EdgeLineType; variant?: EdgeVariant }) => {
      setEdges((currentEdges) =>
        currentEdges.map((edge) => {
          if (edge.id !== edgeId) return edge;

          const nextType = updates.type ?? toEdgeType(edge.type);
          const nextVariant = updates.variant ?? toEdgeVariant(edge);

          return {
            ...edge,
            type: nextType,
            style: getEdgeStyle(nextVariant),
            data: {
              ...((edge.data ?? {}) as Record<string, unknown>),
              variant: nextVariant,
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
      setEdgeInspector({
        edgeId: edge.id,
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    [setSelectedEdgeId, setSelectedNodeId]
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
        <div className="pointer-events-none fixed inset-0 z-50">
          <div
            className="pointer-events-auto absolute flex w-[360px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-lg border border-slate-300/85 bg-[#f3f3f4] shadow-[0_8px_18px_rgba(15,23,42,0.14)]"
            style={{ left: edgeInspectorPosition.left, top: edgeInspectorPosition.top }}
          >
            <div className="flex h-11 items-stretch">
              {EDGE_VARIANT_OPTIONS.map((option, index) => {
                const isActive = activeInspectorEdgeVariant === option.value;
                const stroke = option.value === 'solid' ? '#2f6fd6' : '#11162f';
                const strokeDasharray =
                  option.value === 'dashed' ? '11 8' : option.value === 'dotted' ? '1 10' : undefined;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setInspectorEdgeVariant(option.value)}
                    className={[
                      'flex min-w-[44px] flex-1 items-center justify-center border-slate-300/85 px-1.5 transition',
                      index < EDGE_VARIANT_OPTIONS.length - 1 ? 'border-r' : '',
                      isActive ? 'bg-blue-50' : 'hover:bg-slate-200/75',
                    ].join(' ')}
                    title={`Styl: ${option.label}`}
                  >
                    <svg viewBox="0 0 72 24" className="h-3.5 w-8">
                      <line
                        x1="8"
                        y1="12"
                        x2="64"
                        y2="12"
                        stroke={stroke}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={strokeDasharray}
                      />
                    </svg>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => deleteEdgeById(activeInspectorEdge.id)}
                className="flex w-11 shrink-0 items-center justify-center border-l border-slate-300/85 text-rose-600 transition hover:bg-rose-50"
                title="Usuń połączenie"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>

              <button
                type="button"
                onClick={closeEdgeInspector}
                className="flex w-10 shrink-0 items-center justify-center border-l border-slate-300/85 text-slate-700 transition hover:bg-slate-200/75"
                title="Zamknij"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <circle cx="12" cy="5" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="12" cy="19" r="1.8" />
                </svg>
              </button>
            </div>

            <div className="h-px bg-slate-300/85" />

            <div className="flex h-10 items-stretch">
              {EDGE_TYPE_OPTIONS.map((option, index) => {
                const isActive = activeInspectorEdgeType === option.value;
                const stroke = isActive ? '#2f6fd6' : '#11162f';

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setInspectorEdgeType(option.value)}
                    className={[
                      'flex flex-1 items-center justify-center border-slate-300/85 px-1.5 transition',
                      index < EDGE_TYPE_OPTIONS.length - 1 ? 'border-r' : '',
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-900 hover:bg-slate-200/75',
                    ].join(' ')}
                    title={`Typ: ${option.label}`}
                  >
                    <svg viewBox="0 0 72 24" className="h-3.5 w-8">
                      {option.value === 'straight' ? (
                        <line x1="8" y1="16" x2="64" y2="8" stroke={stroke} strokeWidth="3" />
                      ) : null}
                      {option.value === 'step' ? (
                        <polyline
                          points="16,16 36,16 36,8 56,8"
                          fill="none"
                          stroke={stroke}
                          strokeWidth="3"
                          strokeLinejoin="round"
                        />
                      ) : null}
                      {option.value === 'bezier' ? (
                        <path
                          d="M 8 16 C 20 4, 44 20, 64 8"
                          fill="none"
                          stroke={stroke}
                          strokeWidth="3"
                        />
                      ) : null}
                    </svg>
                  </button>
                );
              })}
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
