export type BaseAppError<T extends string = ''> = {
  type: 'GenericApiError' | T;
  message: string;
  details?: Record<string, unknown>;
};

type Result<S, E extends BaseAppError<string>> = [E, null] | [null, S];

export function actionOk<S>(data: S): Result<S, never> {
  return [null, data];
}

export function actionErr<const R extends string, E extends BaseAppError<R>>(
  error: E
): Result<never, E> {
  return [error, null];
}
