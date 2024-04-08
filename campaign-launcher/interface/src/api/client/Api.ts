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

import {
  ManifestUploadRequestDto,
  ManifestUploadResponseDto,
} from './data-contracts';
import { ContentType, HttpClient, RequestParams } from './http-client';

export class Api<
  SecurityDataType = unknown,
> extends HttpClient<SecurityDataType> {
  /**
   * No description
   *
   * @tags health
   * @name HealthControllerGetHealth
   * @summary Get server health status
   * @request GET:/api/health
   */
  healthControllerGetHealth = (params: RequestParams = {}) =>
    this.request<string, void>({
      path: `/api/health`,
      method: 'GET',
      format: 'json',
      ...params,
    });
  /**
   * No description
   *
   * @tags manifest
   * @name ManifestControllerUploadManifest
   * @summary Upload manifest data
   * @request POST:/api/manifest/upload
   */
  manifestControllerUploadManifest = (
    data: ManifestUploadRequestDto,
    params: RequestParams = {}
  ) =>
    this.request<ManifestUploadResponseDto, void>({
      path: `/api/manifest/upload`,
      method: 'POST',
      body: data,
      type: ContentType.Json,
      format: 'json',
      ...params,
    });
}
