'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import dagre from 'dagre';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

import { RoadmapReactFlowPage } from '@/app/(root)/roadmap-rf/page';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  archiveRoadmap,
  getRoadmapById,
  updateRoadmapStepPositions,
  updateRoadmapStepStatus,
} from '@/lib/api/roadmap';
import type { RoadmapDetailsDto } from '@/lib/types/roadmap';
import type { PresetEdgeConfig, PresetNodeConfig } from '@/roadmap/configs/presets';

const NODE_WIDTH = 420;
const NODE_HEIGHT = 88;
const PHASE_OFFSET_Y = 140;
const PHASE_HORIZONTAL_GAP = 72;
const DAGRE_NODE_SEP = 120;
const DAGRE_RANK_SEP = 156;
const NODE_COLLISION_GAP = 24;

const estimateTileSize = (node: Pick<PresetNodeConfig, 'title' | 'phase' | 'timeline'>) => {
  void node;

  return {
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
  };
};

const withMeasuredSize = (node: PresetNodeConfig): PresetNodeConfig & { width: number; height: number } => {
  const size = estimateTileSize(node);

  return {
    ...node,
    width: node.width ?? size.width ?? NODE_WIDTH,
    height: node.height ?? size.height ?? NODE_HEIGHT,
  };
};

const hasOverlappingNodes = (
  nodeConfigs: Array<PresetNodeConfig & { width: number; height: number }>
): boolean => {
  for (let index = 0; index < nodeConfigs.length; index += 1) {
    const currentNode = nodeConfigs[index];
    const currentLeft = currentNode.x - NODE_COLLISION_GAP / 2;
    const currentTop = currentNode.y - NODE_COLLISION_GAP / 2;
    const currentRight = currentNode.x + currentNode.width + NODE_COLLISION_GAP / 2;
    const currentBottom = currentNode.y + currentNode.height + NODE_COLLISION_GAP / 2;

    for (let otherIndex = index + 1; otherIndex < nodeConfigs.length; otherIndex += 1) {
      const otherNode = nodeConfigs[otherIndex];
      const otherLeft = otherNode.x - NODE_COLLISION_GAP / 2;
      const otherTop = otherNode.y - NODE_COLLISION_GAP / 2;
      const otherRight = otherNode.x + otherNode.width + NODE_COLLISION_GAP / 2;
      const otherBottom = otherNode.y + otherNode.height + NODE_COLLISION_GAP / 2;

      const overlapsHorizontally = currentLeft < otherRight && currentRight > otherLeft;
      const overlapsVertically = currentTop < otherBottom && currentBottom > otherTop;

      if (overlapsHorizontally && overlapsVertically) {
        return true;
      }
    }
  }

  return false;
};

const positionPhaseNodes = (
  nodeConfigs: Array<PresetNodeConfig & { width: number; height: number }>,
  edgeConfigs: PresetEdgeConfig[]
): Array<PresetNodeConfig & { width: number; height: number }> => {
  const nodesById = new Map(nodeConfigs.map((node) => [node.id, node]));
  const nextPhasePositions = new Map<string, { x: number; y: number }>();
  const phaseNodes = nodeConfigs.filter((node) => node.nodeKind === 'phase');

  let previousPhaseRight = Number.NEGATIVE_INFINITY;

  phaseNodes.forEach((node) => {
    const anchorNodes = edgeConfigs
      .filter((edge) => edge.source === node.id)
      .map((edge) => nodesById.get(edge.target))
      .filter((targetNode): targetNode is PresetNodeConfig & { width: number; height: number } =>
        targetNode != null && targetNode.nodeKind === 'step'
      );

    if (anchorNodes.length === 0) {
      nextPhasePositions.set(node.id, { x: node.x, y: node.y });
      previousPhaseRight = node.x + node.width;
      return;
    }

    const minY = Math.min(...anchorNodes.map((anchorNode) => anchorNode.y));
    const averageCenterX =
      anchorNodes.reduce(
        (sum, anchorNode) => sum + anchorNode.x + anchorNode.width / 2,
        0
      ) / anchorNodes.length;
    const desiredX = averageCenterX - node.width / 2;
    const minX =
      previousPhaseRight === Number.NEGATIVE_INFINITY
        ? desiredX
        : previousPhaseRight + PHASE_HORIZONTAL_GAP;
    const x = Math.max(desiredX, minX);

    nextPhasePositions.set(node.id, {
      x,
      y: minY - node.height - PHASE_OFFSET_Y,
    });
    previousPhaseRight = x + node.width;
  });

  return nodeConfigs.map((node) => {
    const nextPosition = nextPhasePositions.get(node.id);

    if (!nextPosition) {
      return node;
    }

    return {
      ...node,
      x: nextPosition.x,
      y: nextPosition.y,
    };
  });
};

const formatPhaseBadge = (index: number) => `Phase ${String(index + 1).padStart(2, '0')}`;

const getPhaseTimelineMeta = (
  phase: Pick<RoadmapDetailsDto['phases'][number], 'startMonth' | 'endMonth'>,
  phaseIndex: number,
  totalPhases: number,
  totalMonths: number
) => {
  const startMonth = phase.startMonth;
  const endMonth = phase.endMonth;

  if (
    Number.isFinite(startMonth) &&
    Number.isFinite(endMonth) &&
    startMonth > 0 &&
    endMonth >= startMonth
  ) {
    return {
      label: startMonth === endMonth ? `M${startMonth}` : `M${startMonth}-${endMonth}`,
      startMonth,
      endMonth,
    };
  }

  if (totalPhases <= 0 || totalMonths <= 0) {
    return {
      label: '',
      startMonth: null,
      endMonth: null,
    };
  }

  const fallbackStartMonth = Math.floor((phaseIndex * totalMonths) / totalPhases) + 1;
  const fallbackEndMonth = Math.max(
    fallbackStartMonth,
    Math.ceil(((phaseIndex + 1) * totalMonths) / totalPhases)
  );

  return {
    label:
      fallbackStartMonth === fallbackEndMonth
        ? `M${fallbackStartMonth}`
        : `M${fallbackStartMonth}-${fallbackEndMonth}`,
    startMonth: fallbackStartMonth,
    endMonth: fallbackEndMonth,
  };
};

const layoutNodeConfigs = (
  nodeConfigs: Array<PresetNodeConfig & { width?: number; height?: number }>,
  edgeConfigs: PresetEdgeConfig[]
): PresetNodeConfig[] => {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: 'TB',
    nodesep: DAGRE_NODE_SEP,
    ranksep: DAGRE_RANK_SEP,
    marginx: 24,
    marginy: 24,
  });

  nodeConfigs.forEach((node) => {
    const size = estimateTileSize(node);
    graph.setNode(node.id, {
      width: node.width ?? size.width ?? NODE_WIDTH,
      height: node.height ?? size.height ?? NODE_HEIGHT,
    });
  });

  edgeConfigs.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  const laidOutNodes = nodeConfigs.map((node) => {
    const dagreNode = graph.node(node.id) as { x?: number; y?: number } | undefined;
    const size = estimateTileSize(node);
    const width = node.width ?? size.width ?? NODE_WIDTH;
    const height = node.height ?? size.height ?? NODE_HEIGHT;

    return {
      ...node,
      width,
      height,
      x: (dagreNode?.x ?? 0) - width / 2,
      y: (dagreNode?.y ?? 0) - height / 2,
    };
  });

  return positionPhaseNodes(laidOutNodes, edgeConfigs);
};

const applyStoredLayout = (
  nodeConfigs: PresetNodeConfig[],
  edgeConfigs: PresetEdgeConfig[]
): Array<PresetNodeConfig & { width: number; height: number }> => {
  const measuredNodes = nodeConfigs.map(withMeasuredSize);

  return positionPhaseNodes(measuredNodes, edgeConfigs);
};

const getInitialLayout = (
  nodeConfigs: PresetNodeConfig[],
  edgeConfigs: PresetEdgeConfig[],
  hasStoredPositions: boolean
): PresetNodeConfig[] => {
  if (!hasStoredPositions) {
    return layoutNodeConfigs(nodeConfigs, edgeConfigs);
  }

  const storedLayout = applyStoredLayout(nodeConfigs, edgeConfigs);

  if (hasOverlappingNodes(storedLayout)) {
    return layoutNodeConfigs(nodeConfigs, edgeConfigs);
  }

  return storedLayout;
};

const buildCanvasGraph = (
  roadmap: RoadmapDetailsDto
): {
  nodeConfigs: PresetNodeConfig[];
  edgeConfigs: PresetEdgeConfig[];
} => {
  const phases = [...roadmap.phases].sort((left, right) => left.orderIndex - right.orderIndex);
  const childCountByStepId = new Map<string, number>();
  const nodeConfigs: PresetNodeConfig[] = [];
  const edgeConfigs: PresetEdgeConfig[] = [];
  const stepNodeIdByStepId = new Map<string, string>();
  const hasStoredPositions =
    phases.length > 0 &&
    phases.some((phase) => phase.steps.length > 0) &&
    phases.every((phase) =>
      phase.steps.every((step) => step.positionX != null && step.positionY != null)
    );

  phases.forEach((phase) => {
    phase.steps.forEach((step) => {
      if (!step.parentStepId) return;
      childCountByStepId.set(
        step.parentStepId,
        (childCountByStepId.get(step.parentStepId) ?? 0) + 1
      );
    });
  });

  phases.forEach((phase, phaseIndex) => {
    const orderedSteps = [...phase.steps].sort((left, right) => left.orderIndex - right.orderIndex);
    const requiredCount = orderedSteps.filter((step) => step.stepType === 'Required').length;
    const optionalCount = orderedSteps.length - requiredCount;
    const phaseTimeline = getPhaseTimelineMeta(
      phase,
      phaseIndex,
      phases.length,
      roadmap.timeHorizonMonths
    );

    nodeConfigs.push({
      id: `phase-${phase.id}`,
      title: phase.title,
      phase: formatPhaseBadge(phaseIndex),
      timeline: phaseTimeline.label,
      summary: '',
      x: 0,
      y: 0,
      tone: 'main',
      nodeKind: 'phase',
      phaseTitle: phase.title,
      timeLabel: phaseTimeline.label,
      timeStartMonth: phaseTimeline.startMonth ?? undefined,
      timeEndMonth: phaseTimeline.endMonth ?? undefined,
      totalMonths: roadmap.timeHorizonMonths,
      phaseStepCount: orderedSteps.length,
      phaseRequiredCount: requiredCount,
      phaseOptionalCount: optionalCount,
      phaseSteps: orderedSteps.map((step) => ({
        id: step.id,
        title: step.title,
        stepType: step.stepType,
        status: step.status,
      })),
    });

    orderedSteps.forEach((step) => {
      const topicsSummary =
        step.topics.length > 0 ? ` Topics: ${step.topics.slice(0, 4).join(', ')}.` : '';
      const childCount = childCountByStepId.get(step.id) ?? 0;
      const statusLabel =
        step.status === 'Completed'
          ? 'Completed'
          : step.status === 'InProgress'
            ? 'In progress'
            : 'Not started';
      const typeLabel = step.stepType === 'Optional' ? 'Optional' : 'Required';
      const nodeId = `step-${step.id}`;

      stepNodeIdByStepId.set(step.id, nodeId);
      nodeConfigs.push({
        id: nodeId,
        persistenceId: step.id,
        title: step.title,
        phase: formatPhaseBadge(phaseIndex),
        timeline: `${typeLabel} • ${statusLabel}`,
        subtitle: step.subTitle?.trim() || '',
        description: step.description?.trim() || '',
        summary:
          step.description?.trim() ||
          `Step ${step.orderIndex + 1}.${topicsSummary}${childCount > 0 ? ` ${childCount} follow-up.` : ''}`,
        topics: step.topics,
        x: step.positionX ?? 0,
        y: step.positionY ?? 0,
        tone: step.stepType === 'Optional' ? 'neutral' : 'cream',
        nodeKind: 'step',
        phaseTitle: phase.title,
        timeLabel: phaseTimeline.label,
        timeStartMonth: phaseTimeline.startMonth ?? undefined,
        timeEndMonth: phaseTimeline.endMonth ?? undefined,
        totalMonths: roadmap.timeHorizonMonths,
        stepType: step.stepType,
        stepStatus: step.status,
      });
    });
  });

  phases.forEach((phase, phaseIndex) => {
    const currentPhaseId = `phase-${phase.id}`;
    const previousPhase = phases[phaseIndex - 1];
    const orderedSteps = [...phase.steps].sort((left, right) => left.orderIndex - right.orderIndex);
    const rootSteps = orderedSteps.filter(
      (step) => !step.parentStepId || !stepNodeIdByStepId.has(step.parentStepId)
    );

    if (previousPhase) {
      edgeConfigs.push({
        id: `phase-link-${previousPhase.id}-${phase.id}`,
        source: `phase-${previousPhase.id}`,
        target: currentPhaseId,
        variant: 'solid',
        type: 'step',
        ending: 'none',
        sourceHandle: 's-bottom',
        targetHandle: 't-top',
      });
    }

    rootSteps.forEach((step, rootIndex) => {
      edgeConfigs.push({
        id: `phase-root-${phase.id}-${step.id}`,
        source: currentPhaseId,
        target: stepNodeIdByStepId.get(step.id)!,
        variant: 'dotted',
        type: rootIndex % 2 === 0 ? 'bezier' : 'step',
        ending: 'none',
        sourceHandle: 's-bottom',
        targetHandle: 't-top',
      });
    });

    orderedSteps.forEach((step) => {
      if (!step.parentStepId) return;

      const parentNodeId = stepNodeIdByStepId.get(step.parentStepId);
      const currentNodeId = stepNodeIdByStepId.get(step.id);

      if (!parentNodeId || !currentNodeId) return;

      edgeConfigs.push({
        id: `step-link-${step.parentStepId}-${step.id}`,
        source: parentNodeId,
        target: currentNodeId,
        variant: step.stepType === 'Optional' ? 'dashed' : 'solid',
        type: 'bezier',
        ending: 'none',
        sourceHandle: 's-bottom',
        targetHandle: 't-top',
      });
    });
  });

  return {
    nodeConfigs: getInitialLayout(nodeConfigs, edgeConfigs, hasStoredPositions),
    edgeConfigs,
  };
};

const normalizeErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const payload = error.response?.data as
      | { Error?: string; error?: string; detail?: string }
      | string
      | undefined;

    if (typeof payload === 'string' && payload.trim()) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      return payload.Error || payload.error || payload.detail || 'Request failed.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Wystapil nieoczekiwany blad.';
};

export default function RoadmapDetailsPage({ roadmapId }: { roadmapId: string }) {
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<RoadmapDetailsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingRoadmap, setIsDeletingRoadmap] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roadmapId) {
      setRoadmap(null);
      setError('Brakuje identyfikatora roadmapy.');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchRoadmap = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getRoadmapById(roadmapId, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setRoadmap(data);
      } catch (fetchError) {
        if ((fetchError as DOMException)?.name === 'CanceledError' || controller.signal.aborted) {
          return;
        }

        setRoadmap(null);
        setError(normalizeErrorMessage(fetchError));
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void fetchRoadmap();

    return () => controller.abort();
  }, [roadmapId]);

  const graph = useMemo(() => {
    if (!roadmap) return null;
    return buildCanvasGraph(roadmap);
  }, [roadmap]);

  const handleRetry = async () => {
    if (!roadmapId) {
      setRoadmap(null);
      setError('Brakuje identyfikatora roadmapy.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getRoadmapById(roadmapId);
      setRoadmap(data);
    } catch (fetchError) {
      setRoadmap(null);
      setError(normalizeErrorMessage(fetchError));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoadmap = async () => {
    setIsDeletingRoadmap(true);

    try {
      await archiveRoadmap(roadmapId);
      toast.success('Roadmapa zostala usunieta');
      router.push('/dashboard');
      router.refresh();
    } catch (deleteError) {
      toast.error('Nie udalo sie usunac roadmapy', {
        description: normalizeErrorMessage(deleteError),
      });
    } finally {
      setIsDeletingRoadmap(false);
    }
  };

  if (isLoading) {
    return (
      <section className="flex h-[100svh] w-full items-center justify-center bg-white px-4 text-slate-950">
        <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="mt-5 h-10 w-2/3 animate-pulse rounded bg-slate-200" />
          <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
        </div>
      </section>
    );
  }

  if (error || !roadmap || !graph) {
    return (
      <section className="flex h-[100svh] w-full items-center justify-center bg-white px-4 text-slate-950">
        <div className="w-full max-w-xl rounded-[32px] border border-rose-200 bg-white p-8 shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-rose-600">Blad</p>
          <h2 className="mt-4 text-3xl font-semibold text-slate-950">
            Nie udalo sie pobrac roadmapy
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-600">
            {error || 'Brakuje danych roadmapy.'}
          </p>
          <div className="mt-6">
            <Button
              type="button"
              onClick={() => void handleRetry()}
              className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
            >
              Sprobuj ponownie
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <RoadmapReactFlowPage
      key={roadmap.id}
      title={roadmap.title}
      backHref="/dashboard"
      headerActions={
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isDeletingRoadmap}
              className="rounded-full border-rose-200 bg-rose-50 text-rose-700 shadow-none hover:border-rose-300 hover:bg-rose-100 hover:text-rose-800"
            >
              <Trash2 className="h-4 w-4" />
              {isDeletingRoadmap ? 'Usuwanie...' : 'Usun'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="font-grotesk max-w-md rounded-2xl border-slate-200">
            <AlertDialogHeader>
              <AlertDialogTitle>Usunac te roadmape?</AlertDialogTitle>
              <AlertDialogDescription>
                Roadmapa zostanie zarchiwizowana i po chwili przeniesiemy Cie z powrotem do
                dashboardu.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row justify-end gap-3 sm:flex-row">
              <AlertDialogCancel className="rounded-full">Anuluj</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-full bg-rose-600 text-white hover:bg-rose-700"
                onClick={() => void handleDeleteRoadmap()}
              >
                Usun
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      }
      initialNodeConfigs={graph.nodeConfigs}
      initialEdgeConfigs={graph.edgeConfigs}
      layoutDirection="TB"
      onPersistNodePositions={async (positions) => {
        await updateRoadmapStepPositions({
          positions: positions.map((position) => ({
            stepId: position.persistenceId,
            x: position.x,
            y: position.y,
          })),
        });
      }}
      onUpdateStepStatus={async ({ stepId, status }) => updateRoadmapStepStatus(stepId, status)}
    />
  );
}
