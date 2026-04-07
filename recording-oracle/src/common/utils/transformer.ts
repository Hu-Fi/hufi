export const parseQueryArray = ({
  value,
}: {
  value?: string | string[];
}): string[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return Array.isArray(value) ? value : [value];
};
