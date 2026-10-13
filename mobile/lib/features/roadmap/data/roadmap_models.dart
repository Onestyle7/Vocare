/// Mirrors `RoadmapResponseDto` / `RoadmapListItemDto`; see
/// `frontend/lib/types/roadmap.ts`.
enum GenerationStatus {
  pending,
  generating,
  ready,
  failed;

  bool get inProgress => this == pending || this == generating;

  static GenerationStatus parse(Object? raw) => switch ('$raw'.toLowerCase()) {
    'pending' || '0' => pending,
    'generating' || '1' => generating,
    'failed' || '3' => failed,
    _ => ready,
  };
}

enum StepStatus {
  notStarted('NotStarted', 'Nie rozpoczęto'),
  inProgress('InProgress', 'W trakcie'),
  completed('Completed', 'Ukończono');

  const StepStatus(this.apiName, this.label);
  final String apiName;
  final String label;

  static StepStatus parse(Object? raw) => switch ('$raw'.toLowerCase()) {
    'inprogress' || '1' => inProgress,
    'completed' || '2' => completed,
    _ => notStarted,
  };
}

/// Labels from the web dashboard.
String lifecycleLabel(String status) => switch (status) {
  'Completed' => 'Ukończona',
  'Archived' => 'Archiwum',
  _ => 'Aktywna',
};

class RoadmapSummary {
  const RoadmapSummary({
    required this.id,
    required this.title,
    required this.careerPathName,
    required this.timeHorizonMonths,
    required this.status,
    required this.generationStatus,
    required this.failureReason,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String careerPathName;
  final int timeHorizonMonths;

  /// Lifecycle: Draft / Active / Completed / Archived.
  final String status;
  final GenerationStatus generationStatus;
  final String failureReason;
  final DateTime? createdAt;

  bool get isArchived => status == 'Archived';

  String get displayName => careerPathName.isNotEmpty ? careerPathName : title;

  factory RoadmapSummary.fromJson(Map json) => RoadmapSummary(
    id: _s(json['id']),
    title: _s(json['title']),
    careerPathName: _s(json['careerPathName']),
    timeHorizonMonths: (json['timeHorizonMonths'] as num?)?.toInt() ?? 0,
    status: _s(json['status']),
    generationStatus: GenerationStatus.parse(json['generationStatus']),
    failureReason: _s(json['failureReason']),
    createdAt: DateTime.tryParse(_s(json['createdAt']))?.toLocal(),
  );
}

class RoadmapDetails {
  const RoadmapDetails({
    required this.id,
    required this.title,
    required this.careerPathName,
    required this.timeHorizonMonths,
    required this.status,
    required this.generationStatus,
    required this.failureReason,
    required this.progress,
    required this.phases,
  });

  final String id;
  final String title;
  final String careerPathName;
  final int timeHorizonMonths;
  final String status;
  final GenerationStatus generationStatus;
  final String failureReason;

  /// Percentage of required steps completed (backend `CalculateProgressAsync`).
  final double progress;
  final List<RoadmapPhase> phases;

  String get displayName => careerPathName.isNotEmpty ? careerPathName : title;

  int get stepCount => phases.fold(0, (n, p) => n + p.steps.length);

  int get completedCount => phases.fold(
    0,
    (n, p) => n + p.steps.where((s) => s.status == StepStatus.completed).length,
  );

  factory RoadmapDetails.fromJson(Map json) {
    final phases = _list(json['phases'], RoadmapPhase.fromJson)
      ..sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    return RoadmapDetails(
      id: _s(json['id']),
      title: _s(json['title']),
      careerPathName: _s(json['careerPathName']),
      timeHorizonMonths: (json['timeHorizonMonths'] as num?)?.toInt() ?? 0,
      status: _s(json['status']),
      generationStatus: GenerationStatus.parse(json['generationStatus']),
      failureReason: _s(json['failureReason']),
      progress: (json['progress'] as num?)?.toDouble() ?? 0,
      phases: phases,
    );
  }

  RoadmapDetails copyWith({List<RoadmapPhase>? phases, double? progress}) =>
      RoadmapDetails(
        id: id,
        title: title,
        careerPathName: careerPathName,
        timeHorizonMonths: timeHorizonMonths,
        status: status,
        generationStatus: generationStatus,
        failureReason: failureReason,
        progress: progress ?? this.progress,
        phases: phases ?? this.phases,
      );
}

class RoadmapPhase {
  const RoadmapPhase({
    required this.id,
    required this.title,
    required this.orderIndex,
    required this.startMonth,
    required this.endMonth,
    required this.steps,
  });

  final String id;
  final String title;
  final int orderIndex;
  final int startMonth;
  final int endMonth;
  final List<RoadmapStep> steps;

  int get completedCount =>
      steps.where((s) => s.status == StepStatus.completed).length;

  factory RoadmapPhase.fromJson(Map json) {
    final steps = _list(json['steps'], RoadmapStep.fromJson)
      ..sort((a, b) => a.orderIndex.compareTo(b.orderIndex));
    return RoadmapPhase(
      id: _s(json['id']),
      title: _s(json['title']),
      orderIndex: (json['orderIndex'] as num?)?.toInt() ?? 0,
      startMonth: (json['startMonth'] as num?)?.toInt() ?? 0,
      endMonth: (json['endMonth'] as num?)?.toInt() ?? 0,
      steps: steps,
    );
  }

  RoadmapPhase copyWith({String? title, List<RoadmapStep>? steps}) =>
      RoadmapPhase(
        id: id,
        title: title ?? this.title,
        orderIndex: orderIndex,
        startMonth: startMonth,
        endMonth: endMonth,
        steps: steps ?? this.steps,
      );
}

class RoadmapStep {
  const RoadmapStep({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.description,
    required this.topics,
    required this.required,
    required this.status,
    required this.orderIndex,
    this.parentStepId,
  });

  final String id;
  final String title;
  final String subtitle;
  final String description;
  final List<String> topics;

  /// `StepType.Required` (solid line on the web canvas) vs `Optional` (dashed).
  final bool required;
  final StepStatus status;
  final int orderIndex;
  final String? parentStepId;

  factory RoadmapStep.fromJson(Map json) => RoadmapStep(
    id: _s(json['id']),
    title: _s(json['title']),
    subtitle: _s(json['subTitle'] ?? json['subtitle']),
    description: _s(json['description']),
    topics: json['topics'] is List
        ? (json['topics'] as List)
              .map((t) => '$t'.trim())
              .where((t) => t.isNotEmpty)
              .toList()
        : const [],
    required: '${json['stepType']}'.toLowerCase() != 'optional',
    status: StepStatus.parse(json['status']),
    orderIndex: (json['orderIndex'] as num?)?.toInt() ?? 0,
    parentStepId: json['parentStepId'] as String?,
  );

  RoadmapStep withStatus(StepStatus status) => RoadmapStep(
    id: id,
    title: title,
    subtitle: subtitle,
    description: description,
    topics: topics,
    required: required,
    status: status,
    orderIndex: orderIndex,
    parentStepId: parentStepId,
  );
}

String _s(Object? v) => v == null ? '' : '$v'.trim();

List<T> _list<T>(Object? v, T Function(Map) fromJson) =>
    v is List ? v.whereType<Map>().map(fromJson).toList() : <T>[];
