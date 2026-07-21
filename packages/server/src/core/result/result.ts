export interface Success<TValue> {
  readonly isSuccess: true;
  readonly value: TValue;
}

export interface Failure<TError> {
  readonly error: TError;
  readonly isSuccess: false;
}

export type Result<TValue, TError> = Success<TValue> | Failure<TError>;

export interface ResultMatcher<TValue, TError, TOutput> {
  readonly failure: (error: TError) => TOutput;
  readonly success: (value: TValue) => TOutput;
}

function success<TValue>(value: TValue): Success<TValue> {
  return Object.freeze({ isSuccess: true, value });
}

function failure<TError>(error: TError): Failure<TError> {
  return Object.freeze({ error, isSuccess: false });
}

function map<TValue, TError, TMappedValue>(
  result: Result<TValue, TError>,
  mapper: (value: TValue) => TMappedValue,
): Result<TMappedValue, TError> {
  return result.isSuccess ? success(mapper(result.value)) : failure(result.error);
}

function mapError<TValue, TError, TMappedError>(
  result: Result<TValue, TError>,
  mapper: (error: TError) => TMappedError,
): Result<TValue, TMappedError> {
  return result.isSuccess ? success(result.value) : failure(mapper(result.error));
}

function flatMap<TValue, TError, TMappedValue, TMappedError>(
  result: Result<TValue, TError>,
  mapper: (value: TValue) => Result<TMappedValue, TMappedError>,
): Result<TMappedValue, TError | TMappedError> {
  return result.isSuccess ? mapper(result.value) : failure(result.error);
}

function match<TValue, TError, TOutput>(
  result: Result<TValue, TError>,
  matcher: ResultMatcher<TValue, TError, TOutput>,
): TOutput {
  return result.isSuccess ? matcher.success(result.value) : matcher.failure(result.error);
}

function unwrapOr<TValue, TError>(result: Result<TValue, TError>, fallback: TValue): TValue {
  return result.isSuccess ? result.value : fallback;
}

export const Result = Object.freeze({
  failure,
  flatMap,
  map,
  mapError,
  match,
  success,
  unwrapOr,
});
