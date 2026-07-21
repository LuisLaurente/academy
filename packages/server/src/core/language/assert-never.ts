export function assertNever(unreachableValue: never, message = 'Unexpected value'): never {
  throw new TypeError(`${message}: ${String(unreachableValue)}`);
}
