declare module 'bun:test' {
  type TestFunction = (...args: unknown[]) => unknown;
  type MatcherMap = Record<string, (...args: unknown[]) => unknown>;

  export const describe: TestFunction;
  export const it: TestFunction;
  export const test: TestFunction;
  export const beforeAll: TestFunction;
  export const afterAll: TestFunction;
  export const beforeEach: TestFunction;
  export const afterEach: TestFunction;
  export const expect: (...args: unknown[]) => MatcherMap & {
    not: MatcherMap;
    rejects: MatcherMap;
    resolves: MatcherMap;
  };
}
