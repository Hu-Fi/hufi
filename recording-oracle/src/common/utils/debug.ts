/**
 * This utility is useful when you want to know who is the caller of some function.
 * Use it like: console.log(`caller is: "${getCaller()}""`);
 */
export function getCaller() {
  const stack = new Error().stack;
  if (!stack) return '<unknown>';

  const lines = stack.split('\n').map((line) => line.trim());
  /**
   * Assuming that this function is called in function
   * for which we need to identify a caller:
   *
   * lines[0] is "Error"
   * lines[1] is this function
   * lines[2] is the caller of this function that wants its caller
   * lines[3] is the wanted caller
   */
  const wantedCallerLine = lines[3];

  // parse the function name
  const match = wantedCallerLine.match(/at (\S+)/);
  return match ? match[1] : '<anonymous>';
}
