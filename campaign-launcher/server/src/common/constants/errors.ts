/**
 * Represents error messages related to bucket.
 */
export enum ErrorBucket {
  NotExist = 'Bucket does not exist',
  NotPublic = 'Bucket is not public',
  UnableSaveFile = 'Unable to save file',
  InvalidProvider = 'Invalid storage provider',
  EmptyRegion = 'Region cannot be empty for this storage provider',
  InvalidRegion = 'Invalid region for the storage provider',
  EmptyBucket = 'bucketName cannot be empty',
  FailedToFetchBucketContents = 'Failed to fetch bucket contents',
}

/**
 * Represents error messages related to web3.
 */
export enum ErrorWeb3 {
  NoValidNetworks = 'No valid networks found',
  InvalidChainId = 'Invalid chain id provided for the configured environment',
  GasPriceError = 'Error calculating gas price',
}
