import type { StepStatus, StepType } from '@/lib/types/roadmap';

export type PresetNodeConfig = {
  id: string;
  title: string;
  x: number;
  y: number;
  persistenceId?: string;
  phase?: string;
  timeline?: string;
  summary?: string;
  width?: number;
  height?: number;
  tone?: 'main' | 'cream' | 'neutral';
  nodeKind?: 'phase' | 'step' | 'text' | 'note';
  phaseTitle?: string;
  timeLabel?: string;
  timeStartMonth?: number;
  timeEndMonth?: number;
  totalMonths?: number;
  stepType?: StepType;
  stepStatus?: StepStatus;
};

export type PresetEdgeConfig = {
  id: string;
  source: string;
  target: string;
  variant?: 'solid' | 'dashed' | 'dotted';
  type?: 'straight' | 'step' | 'bezier';
  color?: string;
  ending?: 'none' | 'arrow-filled' | 'arrow-filled-thin' | 'arrow-open' | 'arrow-open-thin';
  sourceHandle?: string;
  targetHandle?: string;
};

export const presetNodes: PresetNodeConfig[] = [
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

export const presetEdges: PresetEdgeConfig[] = [
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
