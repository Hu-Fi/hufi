export type BaseErrorResponse = {
  message: string;
  timestamp: string;
  path: string;
  details?: unknown;
};
