 
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface ManifestUploadRequestDto {
  chainId: number;
  requesterAddress: string;
  exchangeName: string;
  token: string;
  /** @format date-time */
  startDate: string;
  duration: number;
  fundAmount: number;
}

export interface ManifestUploadResponseDto {
  url: string;
  hash: string;
}

export interface ManifestDto {
  chainId: number;
  requesterAddress: string;
  exchangeName: string;
  token: string;
  duration: number;
  fundAmount: number;
  startBlock: number;
  endBlock: number;
  type: string;
}
