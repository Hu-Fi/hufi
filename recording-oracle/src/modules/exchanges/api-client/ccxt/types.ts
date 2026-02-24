// object for custom pagination logic
export type MexcNextPageToken = {
  nextPageUntil: number;
  movingDedupIds: string[];
};
