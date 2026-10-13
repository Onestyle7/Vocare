import 'dart:math' as math;
import 'dart:ui' show PathMetric;

import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../data/roadmap_models.dart';

/// A line occupying one lane at a row edge. [dashed] marks an edge that leads
/// to an optional step (the web canvas draws those dashed too).
typedef GraphLine = ({int lane, bool dashed});

/// Where one step sits in the phase graph and which lines cross its row.
class GraphRow {
  const GraphRow({
    required this.step,
    required this.lane,
    required this.top,
    required this.bottom,
    required this.forks,
    required this.incoming,
    required this.continued,
    this.externalParent,
    this.continuesElsewhere = false,
  });

  final RoadmapStep step;

  /// Lane of the step's node.
  final int lane;

  /// Lanes with a line at the row's top / bottom edge.
  final List<GraphLine> top;
  final List<GraphLine> bottom;

  /// New lanes that branch off this node (curve out, then run down).
  final List<GraphLine> forks;

  /// The line arriving into the node from above (its parent's edge).
  final GraphLine? incoming;

  /// The line leaving the node downwards in its own lane.
  final GraphLine? continued;

  /// Parent lives in another phase: drawn as a dashed lead-in.
  final String? externalParent;

  /// A child lives in another phase: drawn as a dashed tail.
  final bool continuesElsewhere;
}

class StepGraph {
  const StepGraph({required this.rows, required this.laneCount});

  final List<GraphRow> rows;
  final int laneCount;

  /// Lays out one phase like a Git commit graph, top to bottom:
  ///
  /// 1. Steps are ordered topologically (a parent is always above its
  ///    children), ties broken by `orderIndex`. Cycles and dangling parents
  ///    cannot break it — the offending step simply starts a new line.
  /// 2. A placed node hands its lane to its *continuation* child (the first
  ///    required one, else the first), so a chain stays one straight line.
  /// 3. Every other child branches into the leftmost free lane right at the
  ///    parent's node and runs down to its own row, like a Git branch.
  /// 4. A leaf ends its lane; freed lanes are reused, keeping the graph narrow.
  ///
  /// [externalParents] maps step id → label for parents found in another
  /// phase of the roadmap; [externalChildren] lists steps continued there.
  static StepGraph layout(
    List<RoadmapStep> steps, {
    Map<String, String> externalParents = const {},
    Set<String> externalChildren = const {},
  }) {
    final parents = _resolveParents(steps);
    String? parentOf(RoadmapStep s) => parents[s.id];

    final order = _topologicalOrder(steps, parentOf);
    final children = <String, List<RoadmapStep>>{};
    for (final s in order) {
      final p = parentOf(s);
      if (p != null) (children[p] ??= []).add(s);
    }

    final lanes = <({String target, bool dashed})?>[];
    final placed = <String>{};
    final rows = <GraphRow>[];
    var laneCount = 0;

    int freeLane() {
      final i = lanes.indexOf(null);
      if (i != -1) return i;
      lanes.add(null);
      return lanes.length - 1;
    }

    List<GraphLine> snapshot() => [
      for (var i = 0; i < lanes.length; i++)
        if (lanes[i] != null) (lane: i, dashed: lanes[i]!.dashed),
    ];

    for (final step in order) {
      var lane = lanes.indexWhere((l) => l?.target == step.id);
      final GraphLine? incoming = lane == -1
          ? null
          : (lane: lane, dashed: lanes[lane]!.dashed);
      if (lane == -1) lane = freeLane();
      final top = snapshot();

      lanes[lane] = null;
      // Children placed earlier (only possible when a cycle was broken)
      // must not reserve lanes they would never consume.
      final kids = [
        for (final k in children[step.id] ?? const <RoadmapStep>[])
          if (!placed.contains(k.id)) k,
      ];
      final forks = <GraphLine>[];
      GraphLine? continued;
      if (kids.isNotEmpty) {
        final main = kids.firstWhere(
          (k) => k.required,
          orElse: () => kids.first,
        );
        lanes[lane] = (target: main.id, dashed: !main.required);
        continued = (lane: lane, dashed: !main.required);
        for (final k in kids) {
          if (identical(k, main)) continue;
          final j = freeLane();
          lanes[j] = (target: k.id, dashed: !k.required);
          forks.add((lane: j, dashed: !k.required));
        }
      }
      placed.add(step.id);
      while (lanes.isNotEmpty && lanes.last == null) {
        lanes.removeLast();
      }

      final bottom = snapshot();
      laneCount = [
        laneCount,
        lane + 1,
        for (final l in [...top, ...bottom]) l.lane + 1,
      ].reduce(math.max);

      rows.add(
        GraphRow(
          step: step,
          lane: lane,
          top: top,
          bottom: bottom,
          forks: forks,
          incoming: incoming,
          continued: continued,
          externalParent: incoming == null ? externalParents[step.id] : null,
          continuesElsewhere:
              continued == null && externalChildren.contains(step.id),
        ),
      );
    }
    return StepGraph(rows: rows, laneCount: math.max(laneCount, 1));
  }

  /// Parent links usable for drawing: only parents inside this phase, and
  /// every parent cycle (corrupt data) cut at its earliest step, which then
  /// starts its own line.
  static Map<String, String?> _resolveParents(List<RoadmapStep> steps) {
    final ids = {for (final s in steps) s.id};
    final parents = <String, String?>{
      for (final s in steps)
        s.id: ids.contains(s.parentStepId) && s.parentStepId != s.id
            ? s.parentStepId
            : null,
    };
    final rank = {
      for (final s in steps) s.id: (s.orderIndex, steps.indexOf(s)),
    };
    int byRank(String a, String b) {
      final (oa, ia) = rank[a]!;
      final (ob, ib) = rank[b]!;
      return oa != ob ? oa.compareTo(ob) : ia.compareTo(ib);
    }

    for (final s in steps) {
      final path = <String>[];
      final seenAt = <String, int>{};
      String? current = s.id;
      while (current != null && !seenAt.containsKey(current)) {
        seenAt[current] = path.length;
        path.add(current);
        current = parents[current];
      }
      if (current != null) {
        final cycle = path.sublist(seenAt[current]!)..sort(byRank);
        parents[cycle.first] = null;
      }
    }
    return parents;
  }

  /// Kahn's algorithm with `orderIndex` priority; each step has at most one
  /// parent, so a child becomes ready the moment its parent is emitted.
  static List<RoadmapStep> _topologicalOrder(
    List<RoadmapStep> steps,
    String? Function(RoadmapStep) parentOf,
  ) {
    final position = {for (var i = 0; i < steps.length; i++) steps[i].id: i};
    int compare(RoadmapStep a, RoadmapStep b) {
      final byOrder = a.orderIndex.compareTo(b.orderIndex);
      return byOrder != 0
          ? byOrder
          : position[a.id]!.compareTo(position[b.id]!);
    }

    final waiting = <String, List<RoadmapStep>>{};
    final ready = <RoadmapStep>[];
    for (final s in steps) {
      final p = parentOf(s);
      p == null ? ready.add(s) : (waiting[p] ??= []).add(s);
    }

    final emitted = <String>{};
    final result = <RoadmapStep>[];
    while (result.length < steps.length) {
      if (ready.isEmpty) {
        // Unreachable after _resolveParents; kept as a guard against hangs.
        ready.add(
          steps
              .where((s) => !emitted.contains(s.id))
              .reduce((a, b) => compare(a, b) <= 0 ? a : b),
        );
      }
      ready.sort(compare);
      final next = ready.removeAt(0);
      if (!emitted.add(next.id)) continue;
      result.add(next);
      for (final child in waiting.remove(next.id) ?? const <RoadmapStep>[]) {
        if (!emitted.contains(child.id)) ready.add(child);
      }
    }
    return result;
  }
}

/// Links between phases (the backend allows them: AI `ParentRef`s and the
/// manual "add step"): children labelled with their parent, and the set of
/// parents whose line continues in a later phase.
({Map<String, String> parents, Set<String> children}) crossPhaseLinks(
  List<RoadmapPhase> phases,
) {
  final parents = crossPhaseParents(phases);
  final byId = {
    for (final p in phases)
      for (final s in p.steps) s.id: s,
  };
  return (
    parents: parents,
    children: {for (final id in parents.keys) byId[id]!.parentStepId!},
  );
}

/// Steps whose parent sits in a different phase, with a label naming it.
Map<String, String> crossPhaseParents(List<RoadmapPhase> phases) {
  final home = <String, (int, RoadmapStep)>{
    for (var i = 0; i < phases.length; i++)
      for (final s in phases[i].steps) s.id: (i, s),
  };
  return {
    for (var i = 0; i < phases.length; i++)
      for (final s in phases[i].steps)
        if (home[s.parentStepId] case (
          final phase,
          final parent,
        ) when phase != i)
          s.id: 'Po kroku „${parent.title}” · Faza ${phase + 1}',
  };
}

/// Geometry shared by the painter and the row layout.
class GraphMetrics {
  const GraphMetrics._(this.laneWidth, this.laneCount);

  /// Lanes shrink when a phase branches a lot, so the text keeps its room.
  factory GraphMetrics(int laneCount) {
    final width = laneCount <= 4 ? 20.0 : math.max(12.0, 80 / laneCount);
    return GraphMetrics._(width, laneCount);
  }

  static const leading = 10.0;
  static const trailing = 8.0;

  /// Node centre, level with the first line of the step title.
  static const nodeY = 21.0;
  static const nodeRadius = 8.0;

  /// Vertical distance a branch needs to swing into its lane.
  static const forkDrop = 24.0;

  final double laneWidth;
  final int laneCount;

  double get width => leading + laneWidth * laneCount + trailing;

  double x(int lane) => leading + laneWidth * (lane + 0.5);
}

/// Git-graph style lane colours; lane 0 is the brand line.
Color laneColor(int lane) =>
    AppColors.graphLanes[lane % AppColors.graphLanes.length];

/// Paints one row of the phase graph: pass-through lines, the incoming and
/// continuing edge, branch curves and the status node on top.
class GraphRowPainter extends CustomPainter {
  const GraphRowPainter({
    required this.row,
    required this.metrics,
    this.press = 0,
  });

  final GraphRow row;
  final GraphMetrics metrics;

  /// 0 → 1 while the row is held (it may overshoot on release, which gives
  /// the line a small spring). The node leans towards the finger and grows;
  /// the lane line bends into it but stays in its lane at the row edges, so
  /// the graph never comes apart.
  final double press;

  static const _lean = 6.0;

  /// Height over which the line bends back into its lane below the node.
  static const _bend = 28.0;

  @override
  void paint(Canvas canvas, Size size) {
    final m = metrics;
    final laneX = m.x(row.lane);
    final nodeX = laneX + _lean * press;
    const nodeY = GraphMetrics.nodeY;
    final bendEnd = math.min(nodeY + _bend, size.height);

    Paint stroke(int lane) => Paint()
      ..color = laneColor(lane).withValues(alpha: 0.9)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    Paint faint() =>
        stroke(row.lane)..color = laneColor(row.lane).withValues(alpha: 0.45);

    // Into the node: from the lane at the top edge, bending to the node.
    Path incoming() => Path()
      ..moveTo(laneX, 0)
      ..cubicTo(laneX, nodeY * 0.55, nodeX, nodeY * 0.45, nodeX, nodeY);

    // Out of the node: bending back into the lane, then straight down.
    Path outgoing() => Path()
      ..moveTo(nodeX, nodeY)
      ..cubicTo(
        nodeX,
        nodeY + (bendEnd - nodeY) * 0.5,
        laneX,
        nodeY + (bendEnd - nodeY) * 0.5,
        laneX,
        bendEnd,
      )
      ..lineTo(laneX, size.height);

    // Lines of other branches crossing this row.
    for (final line in row.top) {
      if (line.lane == row.lane) continue;
      final x = m.x(line.lane);
      _draw(
        canvas,
        Path()
          ..moveTo(x, 0)
          ..lineTo(x, size.height),
        stroke(line.lane),
        line.dashed,
      );
    }

    if (row.incoming case final line?) {
      _draw(canvas, incoming(), stroke(line.lane), line.dashed);
    } else if (row.externalParent != null) {
      // Continues a step from another phase: a faint dashed lead-in.
      _draw(canvas, incoming(), faint(), true);
    }

    if (row.continuesElsewhere) {
      _draw(canvas, outgoing(), faint(), true);
    }

    if (row.continued case final line?) {
      _draw(canvas, outgoing(), stroke(line.lane), line.dashed);
    }

    for (final fork in row.forks) {
      final x = m.x(fork.lane);
      final end = math.min(nodeY + GraphMetrics.forkDrop, size.height);
      _draw(
        canvas,
        Path()
          ..moveTo(nodeX, nodeY)
          ..cubicTo(nodeX, end - 6, x, nodeY + 6, x, end)
          ..lineTo(x, size.height),
        stroke(fork.lane),
        fork.dashed,
      );
    }

    final c = Offset(nodeX, nodeY);
    final color = laneColor(row.lane);
    final glow = press.clamp(0.0, 1.0);
    if (glow > 0) {
      canvas.drawCircle(
        c,
        GraphMetrics.nodeRadius + 7,
        Paint()..color = color.withValues(alpha: 0.16 * glow),
      );
    }
    canvas.save();
    canvas.translate(c.dx, c.dy);
    canvas.scale(1 + 0.2 * press);
    canvas.translate(-c.dx, -c.dy);
    _paintNode(canvas, c, color);
    canvas.restore();
  }

  void _paintNode(Canvas canvas, Offset c, Color color) {
    const r = GraphMetrics.nodeRadius;
    // A background disc keeps lines from showing through the ring.
    canvas.drawCircle(c, r + 2, Paint()..color = AppColors.background);
    switch (row.step.status) {
      case StepStatus.completed:
        canvas.drawCircle(c, r, Paint()..color = color);
        canvas.drawPath(
          Path()
            ..moveTo(c.dx - 3.6, c.dy + 0.2)
            ..lineTo(c.dx - 1.0, c.dy + 2.8)
            ..lineTo(c.dx + 3.8, c.dy - 2.6),
          Paint()
            ..color = AppColors.background
            ..style = PaintingStyle.stroke
            ..strokeWidth = 2
            ..strokeCap = StrokeCap.round
            ..strokeJoin = StrokeJoin.round,
        );
      case StepStatus.inProgress:
        // The "HEAD" look: ring with a dot and a soft halo.
        canvas.drawCircle(
          c,
          r + 4,
          Paint()..color = color.withValues(alpha: 0.18),
        );
        canvas.drawCircle(c, r, Paint()..color = AppColors.background);
        canvas.drawCircle(
          c,
          r - 1,
          Paint()
            ..color = color
            ..style = PaintingStyle.stroke
            ..strokeWidth = 2,
        );
        canvas.drawCircle(c, 3.4, Paint()..color = color);
      case StepStatus.notStarted:
        canvas.drawCircle(
          c,
          r - 1,
          Paint()
            ..color = color
            ..style = PaintingStyle.stroke
            ..strokeWidth = 2,
        );
    }
  }

  static void _draw(Canvas canvas, Path path, Paint paint, bool dashed) {
    if (!dashed) {
      canvas.drawPath(path, paint);
      return;
    }
    for (final PathMetric metric in path.computeMetrics()) {
      for (double d = 0; d < metric.length; d += 8) {
        canvas.drawPath(
          metric.extractPath(d, math.min(d + 4, metric.length)),
          paint,
        );
      }
    }
  }

  @override
  bool shouldRepaint(GraphRowPainter old) =>
      old.row != row ||
      old.press != press ||
      old.metrics.laneWidth != metrics.laneWidth;
}
