export type BaseAppError = {
  type: string;
  message: string;
  details?: Record<string, unknown>;
};

type Result<S, E extends BaseAppError> = [E, null] | [null, S];

export function actionOk<S>(data: S): Result<S, never> {
  return [null, data];
}

export function actionErr<const R extends string, E extends BaseAppError & { type: R }>(
  error: E
): Result<never, E> {
  return [error, null];
}
