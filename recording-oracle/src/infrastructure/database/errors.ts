enum PostgresErrorCodes {
  Duplicated = '23505',
}

function isErrorWithCode(error: unknown): error is Error & { code: unknown } {
  return error instanceof Error && 'code' in error;
}

export function isDuplicatedError(error: unknown): boolean {
  return isErrorWithCode(error) && error.code === PostgresErrorCodes.Duplicated;
}
