export * from './request';
export * from './response';

export type ClassConstructor<T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T;
};
