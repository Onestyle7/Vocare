'use client';

import type { ChangeEvent, FormEvent, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import dagre from 'dagre';
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
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
import { CircleDot } from 'lucide-react';
import '@xyflow/react/dist/style.css';

type RoadmapStep = {
  id: string;
  phase: string;
  title: string;
  timeline: string;
  summary: string;
};

type RoadmapNodeData = {
  phase: string;
  title: string;
  timeline: string;
  summary: string;
  label: ReactNode;
};

type RoadmapNode = Node<RoadmapNodeData>;
type RoadmapDraft = Omit<RoadmapStep, 'id'>;
type EdgeVariant = 'solid' | 'dotted';
type NodeTone = 'main' | 'cream' | 'neutral';
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
};

const NODE_WIDTH = 280;
const NODE_HEIGHT = 78;
const SOLID_EDGE_COLOR = '#2f6fd6';
const DOTTED_EDGE_COLOR = '#2f6fd6';
const NODE_TONE_COLORS: Record<NodeTone, string> = {
  main: '#f6f804',
  cream: '#f3df9f',
  neutral: '#ececef',
};

const presetNodes: PresetNodeConfig[] = [
  { id: 'client_side', title: 'Client Side Development', x: 760, y: 14, width: 340, tone: 'main' },
  { id: 'server_side', title: 'Server Side', x: 1140, y: 14, width: 230, tone: 'neutral' },
  { id: 'game_math', title: 'Game Mathematics', x: 760, y: 352, width: 340, tone: 'main' },
  { id: 'curve', title: 'Curve', x: 760, y: 520, width: 340, tone: 'neutral' },
  { id: 'spline', title: 'Spline', x: 760, y: 602, width: 164 },
  { id: 'hermite', title: 'Hermite', x: 936, y: 602, width: 164 },
  { id: 'bezier', title: 'Bezier', x: 760, y: 682, width: 164 },
  { id: 'catmull_rom', title: 'Catmull-Rom', x: 936, y: 682, width: 164 },
  { id: 'linear_algebra', title: 'Linear Algebra', x: 138, y: 126, width: 380 },
  { id: 'vector', title: 'Vector', x: 138, y: 204, width: 184 },
  { id: 'matrix', title: 'Matrix', x: 334, y: 204, width: 184 },
  { id: 'linear_transformation', title: 'Linear Transformation', x: 138, y: 282, width: 380 },
  { id: 'geometry', title: 'Geometry', x: 138, y: 360, width: 184 },
  { id: 'affine_space', title: 'Affine Space', x: 334, y: 360, width: 184 },
  { id: 'affine_transformation', title: 'Affine Transformation', x: 138, y: 438, width: 380 },
  { id: 'projection', title: 'Projection', x: 138, y: 516, width: 184, tone: 'neutral' },
  { id: 'orientation', title: 'Orientation', x: 334, y: 516, width: 184, tone: 'neutral' },
  { id: 'perspective', title: 'Perspective', x: 138, y: 594, width: 184 },
  { id: 'quaternion', title: 'Quaternion', x: 334, y: 594, width: 184 },
  { id: 'orthogonal', title: 'Orthogonal', x: 138, y: 672, width: 184 },
  { id: 'euler_angle', title: 'Euler Angle', x: 334, y: 672, width: 184 },
  { id: 'unity3d', title: 'Unity 3D', x: 138, y: 810, width: 216 },
  { id: 'unreal_engine', title: 'Unreal Engine', x: 138, y: 888, width: 216 },
  { id: 'native', title: 'Native', x: 138, y: 966, width: 216 },
  { id: 'game_engine', title: 'Game Engine', x: 500, y: 888, width: 270, tone: 'main' },
  { id: 'center_of_mass', title: 'Center of Mass', x: 1204, y: 190, width: 304 },
  { id: 'moment_of_inertia', title: 'Moment of Inertia', x: 1204, y: 268, width: 304 },
  { id: 'acceleration', title: 'Acceleration', x: 1204, y: 346, width: 148 },
  { id: 'joints', title: 'Joints', x: 1360, y: 346, width: 148 },
  { id: 'restitution', title: 'Restitution', x: 1204, y: 424, width: 148 },
  { id: 'force', title: 'Force', x: 1360, y: 424, width: 148 },
  { id: 'angular_velocity', title: 'Angular Velocity', x: 1204, y: 502, width: 304 },
  { id: 'buoyancy', title: 'Buoyancy', x: 1204, y: 580, width: 148 },
  { id: 'friction', title: 'Friction', x: 1360, y: 580, width: 148 },
  { id: 'linear_velocity', title: 'Linear Velocity', x: 1204, y: 658, width: 304 },
  { id: 'dynamics', title: 'Dynamics', x: 1204, y: 736, width: 304, tone: 'neutral' },
  { id: 'game_physics', title: 'Game Physics', x: 1228, y: 888, width: 304, tone: 'main' },
];

const presetEdges: PresetEdgeConfig[] = [
  { id: 'e-client-server', source: 'client_side', target: 'server_side', variant: 'solid' },
  {
    id: 'e-client-math',
    source: 'client_side',
    target: 'game_math',
    variant: 'solid',
    type: 'step',
  },
  {
    id: 'e-math-physics',
    source: 'game_math',
    target: 'game_physics',
    variant: 'solid',
    type: 'bezier',
  },
  { id: 'e-engine-physics', source: 'game_engine', target: 'game_physics', variant: 'solid' },
  { id: 'e-curve-core', source: 'game_math', target: 'curve', variant: 'dotted', type: 'step' },
  {
    id: 'e-la-core',
    source: 'linear_algebra',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
  },
  { id: 'e-vector-core', source: 'vector', target: 'game_math', variant: 'dotted', type: 'bezier' },
  { id: 'e-matrix-core', source: 'matrix', target: 'game_math', variant: 'dotted', type: 'bezier' },
  {
    id: 'e-lt-core',
    source: 'linear_transformation',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
  },
  {
    id: 'e-geometry-core',
    source: 'geometry',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
  },
  {
    id: 'e-affine-core',
    source: 'affine_space',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
  },
  {
    id: 'e-at-core',
    source: 'affine_transformation',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
  },
  {
    id: 'e-proj-core',
    source: 'projection',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
  },
  {
    id: 'e-orient-core',
    source: 'orientation',
    target: 'game_math',
    variant: 'dotted',
    type: 'bezier',
  },
  {
    id: 'e-unity-engine',
    source: 'unity3d',
    target: 'game_engine',
    variant: 'dotted',
    type: 'bezier',
  },
  {
    id: 'e-unreal-engine',
    source: 'unreal_engine',
    target: 'game_engine',
    variant: 'dotted',
    type: 'bezier',
  },
  {
    id: 'e-native-engine',
    source: 'native',
    target: 'game_engine',
    variant: 'dotted',
    type: 'bezier',
  },
  {
    id: 'e-dynamics-physics',
    source: 'dynamics',
    target: 'game_physics',
    variant: 'dotted',
    type: 'step',
  },
];

const createStyledEdge = ({
  id,
  source,
  target,
  variant = 'solid',
  type = 'smoothstep',
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
  style:
    variant === 'solid'
      ? { stroke: SOLID_EDGE_COLOR, strokeWidth: 3.2 }
      : {
          stroke: DOTTED_EDGE_COLOR,
          strokeWidth: 3,
          strokeDasharray: '1 12',
          strokeLinecap: 'round',
        },
});

const createNodeStyle = ({
  tone = 'cream',
  width = NODE_WIDTH,
  height = NODE_HEIGHT,
}: {
  tone?: NodeTone;
  width?: number;
  height?: number;
}) =>
  ({
    width,
    minHeight: height,
    borderRadius: 12,
    border: '4px solid #11162f',
    background: NODE_TONE_COLORS[tone],
    boxShadow: 'none',
    padding: '0 16px',
    color: '#11162f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    textAlign: 'left',
    fontSize: '16px',
    lineHeight: 1.15,
    fontWeight: 600,
  }) as const;

const initialDraft: RoadmapDraft = {
  phase: 'Phase 07',
  title: 'New roadmap step',
  timeline: 'Weeks 24-28',
  summary: 'Describe what this stage should cover.',
};

const toNodeLabel = (step: RoadmapDraft) => {
  return (
    <span className="flex w-full items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-900/55 bg-white/70">
        <CircleDot className="h-4 w-4 text-slate-900" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1 text-center text-[15px] leading-tight font-semibold">
        {step.title}
      </span>
    </span>
  );
};

const createRoadmapNode = (
  id: string,
  step: RoadmapDraft,
  position: { x: number; y: number }
): RoadmapNode => {
  return {
    id,
    data: {
      phase: step.phase,
      title: step.title,
      timeline: step.timeline,
      summary: step.summary,
      label: toNodeLabel(step),
    },
    position,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: createNodeStyle({ tone: 'cream' }),
  };
};

const createInitialNodes = (): RoadmapNode[] => {
  return presetNodes
    .map((nodeConfig) =>
      createRoadmapNode(
        nodeConfig.id,
        {
          phase: '',
          title: nodeConfig.title,
          timeline: '',
          summary: '',
        },
        { x: nodeConfig.x, y: nodeConfig.y }
      )
    )
    .map((node) => {
      const config = presetNodes.find((item) => item.id === node.id);
      if (!config) return node;

      return {
        ...node,
        style: createNodeStyle({
          tone: config.tone ?? 'cream',
          width: config.width ?? NODE_WIDTH,
          height: config.height ?? NODE_HEIGHT,
        }),
      };
    });
};

const createInitialEdges = (): Edge[] => {
  return presetEdges.map((edge) =>
    createStyledEdge({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      variant: edge.variant,
      type: edge.type,
    })
  );
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
    const width = typeof node.style?.width === 'number' ? node.style.width : NODE_WIDTH;
    const height =
      typeof node.style?.minHeight === 'number'
        ? node.style.minHeight
        : typeof node.style?.height === 'number'
          ? node.style.height
          : NODE_HEIGHT;
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

    const width = typeof node.style?.width === 'number' ? node.style.width : NODE_WIDTH;
    const height =
      typeof node.style?.minHeight === 'number'
        ? node.style.minHeight
        : typeof node.style?.height === 'number'
          ? node.style.height
          : NODE_HEIGHT;

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
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    RoadmapNode,
    Edge
  > | null>(null);
  const nodeCounterRef = useRef(presetNodes.length + 1);
  const edgeCounterRef = useRef(presetEdges.length + 1);

  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target } = connection;
      if (!source || !target || source === target) return;

      setEdges((currentEdges) => {
        const exists = currentEdges.some(
          (edge) => edge.source === source && edge.target === target
        );
        if (exists) return currentEdges;

        const nextEdge = createStyledEdge({
          id: `e-${edgeCounterRef.current++}`,
          source,
          target,
          variant: 'solid',
          type: 'bezier',
        });

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

      const newNode = createRoadmapNode(id, defaultDraft, {
        x: Math.round(position.x),
        y: Math.round(position.y),
      });

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
      const flowPosition = getFlowPositionFromClient(event.clientX, event.clientY);
      if (!flowPosition) return;

      setContextTarget({
        kind: 'pane',
        flowPosition,
      });
    },
    [getFlowPositionFromClient]
  );

  const onNodeContextMenu = useCallback(
    (event: ReactMouseEvent, node: RoadmapNode) => {
      const flowPosition = getFlowPositionFromClient(event.clientX, event.clientY);
      if (!flowPosition) return;

      setContextTarget({
        kind: 'node',
        nodeId: node.id,
        flowPosition,
      });
    },
    [getFlowPositionFromClient]
  );

  const onEdgeContextMenu = useCallback((_: ReactMouseEvent, edge: Edge) => {
    setContextTarget({
      kind: 'edge',
      edgeId: edge.id,
    });
  }, []);

  const deleteEdgeById = useCallback(
    (edgeId: string) => {
      setEdges((currentEdges) => currentEdges.filter((edge) => edge.id !== edgeId));
      setSelectedEdgeId((current) => (current === edgeId ? '' : current));
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
  }, [setEdges, setNodes]);

  const closeContextMenu = useCallback(() => {
    setContextTarget(null);
  }, []);

  const withClose = (action: () => void) => () => {
    action();
    closeContextMenu();
  };

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

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (node.id !== editingNodeId) return node;
          return {
            ...node,
            data: {
              ...node.data,
              ...normalized,
              label: toNodeLabel(normalized),
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
    if (!open) {
      closeContextMenu();
    }
  };

  const onAutoLayout = useCallback(() => {
    setNodes((currentNodes) => layoutWithDagre(currentNodes, edges));
  }, [edges, setNodes]);

  const onRestorePresetLayout = useCallback(() => {
    setNodes(createInitialNodes());
    setEdges(createInitialEdges());
    setSelectedNodeId('');
    setSelectedEdgeId('');
    nodeCounterRef.current = presetNodes.length + 1;
    edgeCounterRef.current = presetEdges.length + 1;
  }, [setEdges, setNodes]);

  return (
    <section className="font-grotesk h-screen w-full bg-white text-slate-950">
      <header className="border-b border-slate-200 px-6 py-4">
        <p className="text-xs font-semibold tracking-[0.16em] text-sky-600 uppercase">
          Roadmap Example
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Career Path with React Flow + Dagre</h1>
      </header>

      <div className="h-[calc(100vh-89px)] w-full">
        <ReactFlowProvider>
          <ContextMenu onOpenChange={onContextMenuOpenChange}>
            <ContextMenuTrigger asChild>
              <div className="h-full w-full">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onInit={(instance) => setReactFlowInstance(instance)}
                  onPaneContextMenu={onPaneContextMenu}
                  onNodeContextMenu={onNodeContextMenu}
                  onNodeDoubleClick={onNodeDoubleClick}
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
