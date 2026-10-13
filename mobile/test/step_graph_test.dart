import 'package:flutter_test/flutter_test.dart';
import 'package:vocare/features/roadmap/data/roadmap_models.dart';
import 'package:vocare/features/roadmap/presentation/widgets/step_graph.dart';

RoadmapStep step(
  String id,
  int order, {
  String? parent,
  bool required = true,
  StepStatus status = StepStatus.notStarted,
}) => RoadmapStep(
  id: id,
  title: id,
  subtitle: '',
  description: '',
  topics: const [],
  required: required,
  status: status,
  orderIndex: order,
  parentStepId: parent,
);

/// `id@lane` per row — compact enough to assert whole layouts.
List<String> lanesOf(StepGraph g) => [
  for (final r in g.rows) '${r.step.id}@${r.lane}',
];

void main() {
  group('StepGraph.layout', () {
    test('a chain is one straight line', () {
      final g = StepGraph.layout([
        step('a', 0),
        step('b', 1, parent: 'a'),
        step('c', 2, parent: 'b'),
      ]);
      expect(lanesOf(g), ['a@0', 'b@0', 'c@0']);
      expect(g.laneCount, 1);
      expect(g.rows.first.incoming, isNull);
      expect(g.rows[1].incoming, (lane: 0, dashed: false));
      expect(g.rows.last.continued, isNull);
    });

    test('an optional sibling branches off like a Git branch', () {
      // Real data: Framework UI → Playwright (required) / Cypress (optional).
      final g = StepGraph.layout([
        step('runner', 0),
        step('framework', 1, parent: 'runner'),
        step('playwright', 2, parent: 'framework'),
        step('cypress', 3, parent: 'framework', required: false),
        step('selectors', 4, parent: 'playwright'),
      ]);
      expect(lanesOf(g), [
        'runner@0',
        'framework@0',
        'playwright@0',
        'cypress@1',
        'selectors@0',
      ]);
      final fork = g.rows[1];
      expect(fork.forks, [(lane: 1, dashed: true)]);
      expect(fork.continued, (lane: 0, dashed: false));
      // The branch runs past Playwright's row…
      expect(g.rows[2].top, contains((lane: 1, dashed: true)));
      // …ends at Cypress, while the main line passes by.
      expect(g.rows[3].bottom, [(lane: 0, dashed: false)]);
      expect(g.laneCount, 2);
    });

    test('the required child keeps the lane even when listed second', () {
      final g = StepGraph.layout([
        step('ci', 0),
        step('gitlab', 1, parent: 'ci', required: false),
        step('github', 2, parent: 'ci'),
      ]);
      expect(lanesOf(g), ['ci@0', 'gitlab@1', 'github@0']);
    });

    test('a parent listed after its child is still drawn above it', () {
      final g = StepGraph.layout([
        step('child', 0, parent: 'root'),
        step('root', 1),
      ]);
      expect(lanesOf(g), ['root@0', 'child@0']);
      expect(g.rows.last.incoming, isNotNull);
    });

    test('a second root reuses a freed lane without a connecting line', () {
      final g = StepGraph.layout([
        step('a', 0),
        step('b', 1, parent: 'a'),
        step('manual', 2),
      ]);
      expect(lanesOf(g), ['a@0', 'b@0', 'manual@0']);
      expect(g.rows.last.incoming, isNull);
      expect(g.rows.last.top, isEmpty);
    });

    test('a root next to a running line opens its own lane', () {
      final g = StepGraph.layout([
        step('a', 0),
        step('manual', 1),
        step('b', 2, parent: 'a'),
      ]);
      expect(lanesOf(g), ['a@0', 'manual@1', 'b@0']);
    });

    test('cycles and self-references do not hang or drop steps', () {
      final g = StepGraph.layout([
        step('x', 0, parent: 'y'),
        step('y', 1, parent: 'x'),
        step('self', 2, parent: 'self'),
      ]);
      expect(g.rows.map((r) => r.step.id), ['x', 'y', 'self']);
      expect(g.rows.first.incoming, isNull);
      expect(g.rows[1].incoming, isNotNull);
    });

    test('a parent from another phase is a labelled root', () {
      final g = StepGraph.layout(
        [step('b', 0, parent: 'elsewhere')],
        externalParents: {'b': 'Po kroku „A” · Faza 1'},
      );
      expect(g.rows.single.incoming, isNull);
      expect(g.rows.single.externalParent, 'Po kroku „A” · Faza 1');
    });

    test('a wide star keeps every child and compresses lanes', () {
      final g = StepGraph.layout([
        step('hub', 0),
        for (var i = 1; i <= 6; i++) step('leaf$i', i, parent: 'hub'),
      ]);
      expect(g.rows.length, 7);
      expect(g.laneCount, 6);
      expect(g.rows.first.forks.length, 5);
      final m = GraphMetrics(g.laneCount);
      expect(m.laneWidth * g.laneCount, lessThanOrEqualTo(80));
    });

    test('empty phase', () {
      final g = StepGraph.layout(const []);
      expect(g.rows, isEmpty);
      expect(g.laneCount, 1);
    });
  });

  test('crossPhaseParents labels links between phases only', () {
    const a = RoadmapPhase(
      id: 'p1',
      title: 'P1',
      orderIndex: 0,
      startMonth: 1,
      endMonth: 2,
      steps: [],
    );
    final phases = [
      a.copyWith(
        steps: [
          step('s1', 0),
          step('s2', 1, parent: 's1'),
        ],
      ),
      a.copyWith(steps: [step('s3', 0, parent: 's2')]),
    ];
    expect(crossPhaseParents(phases), {'s3': 'Po kroku „s2” · Faza 1'});

    final links = crossPhaseLinks(phases);
    expect(links.children, {'s2'});
    final first = StepGraph.layout(
      phases.first.steps,
      externalChildren: links.children,
    );
    // s2 ends its phase but continues in the next one: dashed tail.
    expect(first.rows.last.continuesElsewhere, isTrue);
    expect(first.rows.first.continuesElsewhere, isFalse);
  });
}
