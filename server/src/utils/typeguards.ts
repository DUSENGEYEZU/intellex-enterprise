export function isObjectLiteral(variable: any): variable is Record<string, unknown> {
  return typeof variable === 'object' && variable !== null && !Array.isArray(variable);
}

export const isSomeEnum =
  <T>(e: T) =>
  (token: any): token is T[keyof T] =>
    Object.values(e).includes(token as T[keyof T]);

// export function hasOwnProperty<T extends Record<string, unknown>>(obj: T, key: PropertyKey): key is keyof T {
//   return Object.hasOwn(obj, key);
// }
