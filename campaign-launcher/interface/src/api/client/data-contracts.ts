/* eslint-disable */
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
  tokenA: string;
  tokenB: string;
  /** @format date-time */
  startDate: string;
  duration: number;
  fundAmount: number;
}

export interface ManifestUploadResponseDto {
  url: string;
  hash: string;
}
