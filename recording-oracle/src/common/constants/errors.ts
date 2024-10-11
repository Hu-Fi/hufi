/**
 * Represents error messages related to auth.
 */
export enum ErrorAuth {
  InvalidToken = 'Invalid token',
  InvalidSignature = 'Invalid signature',
  TokenExpired = 'Token has expired',
}

/**
 * Represents error messages related to user.
 */
export enum ErrorUser {
  NotFound = 'User not found',
  AlreadyExists = 'User already exists',
  ExchangeAPIKeyExists = 'Exchange API key already exists',
  CampaignAlreadyRegistered = 'User already registered for the campaign',
  ExchangeAPIKeyMissing = 'Exchange API key not found',
}

/**
 * Represents error messages related to web3.
 */
export enum ErrorWeb3 {
  NoValidNetworks = 'No valid networks found',
  InvalidChainId = 'Invalid chain id provided for the configured environment',
  GasPriceError = 'Error calculating gas price',
}

/**
 * Represents error messages related to signature.
 */
export enum ErrorSignature {
  SignatureNotVerified = 'Signature not verified',
  InvalidSignature = 'Invalid signature',
}

/**
 * Represents error messages related to campaign.
 */
export enum ErrorCampaign {
  NotFound = 'Campaign not found',
  AlreadyExists = 'Campaign already exists',
  InvalidChainId = 'Invalid chain id',
  InvalidCampaignData = 'Invalid campaign data',
}

export enum ErrorMrMarket {
  WalletAlreadyExists = 'Wallet already exists',
  CampaignAlreadyRegistered = 'Mr.Market already registered for the campaign',
  ExchangeAPIKeyExists = 'Exchange API key already exists',
  InvalidCampaign = 'Invalid campaign',
}
