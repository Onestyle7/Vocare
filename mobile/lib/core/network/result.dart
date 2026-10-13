/// Functional result type — the Dart counterpart of `neverthrow` on the web.
///
/// Repositories never throw for expected failures; callers pattern-match:
/// ```dart
/// switch (await repo.load()) {
///   case Ok(:final value): ...
///   case Err(:final error): ...
/// }
/// ```
sealed class Result<T, E> {
  const Result();

  bool get isOk => this is Ok<T, E>;

  T? get valueOrNull => switch (this) {
    Ok(:final value) => value,
    Err() => null,
  };

  E? get errorOrNull => switch (this) {
    Ok() => null,
    Err(:final error) => error,
  };

  Result<R, E> map<R>(R Function(T value) transform) => switch (this) {
    Ok(:final value) => Ok(transform(value)),
    Err(:final error) => Err(error),
  };
}

final class Ok<T, E> extends Result<T, E> {
  const Ok(this.value);
  final T value;
}

final class Err<T, E> extends Result<T, E> {
  const Err(this.error);
  final E error;
}
