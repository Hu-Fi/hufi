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
  token: string;
  /** @format date-time */
  startDate: string;
  duration: number;
  fundAmount: string;
  additionalData?: string;
}

export interface ManifestUploadResponseDto {
  url: string;
  hash: string;
}

export interface CampaignDataDto {
  chainId: number;
  requesterAddress: string;
  exchangeName: string;
  symbol: string;
  duration: number;
  fundAmount: string;
  startBlock: number;
  endBlock: number;
  type: string;
  address: string;
  amountPaid: string;
  balance: string;
  count: string;
  factoryAddress: string;
  finalResultsUrl: string;
  intermediateResultsUrl: string;
  launcher: string;
  manifestHash: string;
  manifestUrl: string;
  recordingOracle: string;
  recordingOracleFee: string;
  reputationOracle: string;
  reputationOracleFee: string;
  exchangeOracle: string;
  exchangeOracleFee: string;
  status: string;
  token: string;
  totalFundedAmount: string;
  createdAt: string;
}

export interface LeaderDataDto {
  id: string;
  chainId: number;
  address: string;
  amountStaked: string;
  amountAllocated: string;
  amountLocked: string;
  lockedUntilTimestamp: string;
  amountWithdrawn: string;
  amountSlashed: string;
  reputation: string;
  reward: string;
  amountJobsLaunched: string;
  role: string;
  fee: string;
  publicKey: string;
  webhookUrl: string;
  url: string;
  jobTypes: string[];
}

export type QueryParamsType = Record<string | number, any>;
export type ResponseFormat = keyof Omit<Body, 'body' | 'bodyUsed'>;

export interface FullRequestParams extends Omit<RequestInit, 'body'> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseFormat;
  /** request body */
  body?: unknown;
  /** base url */
  baseUrl?: string;
  /** request cancellation token */
  cancelToken?: CancelToken;
}

export type RequestParams = Omit<
  FullRequestParams,
  'body' | 'method' | 'query' | 'path'
>;

export interface ApiConfig<SecurityDataType = unknown> {
  baseUrl?: string;
  baseApiParams?: Omit<RequestParams, 'baseUrl' | 'cancelToken' | 'signal'>;
  securityWorker?: (
    securityData: SecurityDataType | null
  ) => Promise<RequestParams | void> | RequestParams | void;
  customFetch?: typeof fetch;
}

export interface HttpResponse<D extends unknown, E extends unknown = unknown>
  extends Response {
  data: D;
  error: E;
}

type CancelToken = Symbol | string | number;

export enum ContentType {
  Json = 'application/json',
  FormData = 'multipart/form-data',
  UrlEncoded = 'application/x-www-form-urlencoded',
  Text = 'text/plain',
}

export class HttpClient<SecurityDataType = unknown> {
  public baseUrl: string = '';
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>['securityWorker'];
  private abortControllers = new Map<CancelToken, AbortController>();
  private customFetch = (...fetchParams: Parameters<typeof fetch>) =>
    fetch(...fetchParams);

  private baseApiParams: RequestParams = {
    credentials: 'same-origin',
    headers: {},
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
  };

  constructor(apiConfig: ApiConfig<SecurityDataType> = {}) {
    Object.assign(this, apiConfig);
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected encodeQueryParam(key: string, value: any) {
    const encodedKey = encodeURIComponent(key);
    return `${encodedKey}=${encodeURIComponent(typeof value === 'number' ? value : `${value}`)}`;
  }

  protected addQueryParam(query: QueryParamsType, key: string) {
    return this.encodeQueryParam(key, query[key]);
  }

  protected addArrayQueryParam(query: QueryParamsType, key: string) {
    const value = query[key];
    return value.map((v: any) => this.encodeQueryParam(key, v)).join('&');
  }

  protected toQueryString(rawQuery?: QueryParamsType): string {
    const query = rawQuery || {};
    const keys = Object.keys(query).filter(
      (key) => 'undefined' !== typeof query[key]
    );
    return keys
      .map((key) =>
        Array.isArray(query[key])
          ? this.addArrayQueryParam(query, key)
          : this.addQueryParam(query, key)
      )
      .join('&');
  }

  protected addQueryParams(rawQuery?: QueryParamsType): string {
    const queryString = this.toQueryString(rawQuery);
    return queryString ? `?${queryString}` : '';
  }

  private contentFormatters: Record<ContentType, (input: any) => any> = {
    [ContentType.Json]: (input: any) =>
      input !== null && (typeof input === 'object' || typeof input === 'string')
        ? JSON.stringify(input)
        : input,
    [ContentType.Text]: (input: any) =>
      input !== null && typeof input !== 'string'
        ? JSON.stringify(input)
        : input,
    [ContentType.FormData]: (input: FormData) =>
      (Array.from(input.keys()) || []).reduce((formData, key) => {
        const property = input.get(key);
        formData.append(
          key,
          property instanceof Blob
            ? property
            : typeof property === 'object' && property !== null
              ? JSON.stringify(property)
              : `${property}`
        );
        return formData;
      }, new FormData()),
    [ContentType.UrlEncoded]: (input: any) => this.toQueryString(input),
  };

  protected mergeRequestParams(
    params1: RequestParams,
    params2?: RequestParams
  ): RequestParams {
    return {
      ...this.baseApiParams,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...(this.baseApiParams.headers || {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected createAbortSignal = (
    cancelToken: CancelToken
  ): AbortSignal | undefined => {
    if (this.abortControllers.has(cancelToken)) {
      const abortController = this.abortControllers.get(cancelToken);
      if (abortController) {
        return abortController.signal;
      }
      return void 0;
    }

    const abortController = new AbortController();
    this.abortControllers.set(cancelToken, abortController);
    return abortController.signal;
  };

  public abortRequest = (cancelToken: CancelToken) => {
    const abortController = this.abortControllers.get(cancelToken);

    if (abortController) {
      abortController.abort();
      this.abortControllers.delete(cancelToken);
    }
  };

  public request = async <T = any, E = any>({
    body,
    secure,
    path,
    type,
    query,
    format,
    baseUrl,
    cancelToken,
    ...params
  }: FullRequestParams): Promise<HttpResponse<T, E>> => {
    const secureParams =
      ((typeof secure === 'boolean' ? secure : this.baseApiParams.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const queryString = query && this.toQueryString(query);
    const payloadFormatter = this.contentFormatters[type || ContentType.Json];
    const responseFormat = format || requestParams.format;

    return this.customFetch(
      `${baseUrl || this.baseUrl || ''}${path}${queryString ? `?${queryString}` : ''}`,
      {
        ...requestParams,
        headers: {
          ...(requestParams.headers || {}),
          ...(type && type !== ContentType.FormData
            ? { 'Content-Type': type }
            : {}),
        },
        signal:
          (cancelToken
            ? this.createAbortSignal(cancelToken)
            : requestParams.signal) || null,
        body:
          typeof body === 'undefined' || body === null
            ? null
            : payloadFormatter(body),
      }
    ).then(async (response) => {
      const r = response.clone() as HttpResponse<T, E>;
      r.data = null as unknown as T;
      r.error = null as unknown as E;

      const data = !responseFormat
        ? r
        : await response[responseFormat]()
            .then((data) => {
              if (r.ok) {
                r.data = data;
              } else {
                r.error = data;
              }
              return r;
            })
            .catch((e) => {
              r.error = e;
              return r;
            });

      if (cancelToken) {
        this.abortControllers.delete(cancelToken);
      }

      if (!response.ok) throw data;
      return data;
    });
  };
}

/**
 * @title HuFi Campaign Launcher API
 * @version 1.0
 * @contact
 *
 * HuFi Campaign Launcher API
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  health = {
    /**
     * No description
     *
     * @tags health
     * @name HealthControllerGetHealth
     * @summary Get server health status
     * @request GET:/health
     */
    healthControllerGetHealth: (params: RequestParams = {}) =>
      this.request<string, void>({
        path: `/health`,
        method: 'GET',
        format: 'json',
        ...params,
      }),
  };
  exchange = {
    /**
     * No description
     *
     * @tags exchange
     * @name ExchangeControllerGetExchangeList
     * @summary List the supported exchanges
     * @request GET:/exchange/list
     */
    exchangeControllerGetExchangeList: (params: RequestParams = {}) =>
      this.request<any[], void>({
        path: `/exchange/list`,
        method: 'GET',
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags exchange
     * @name ExchangeControllerGetSymbols
     * @summary List the supported symbols/tokens
     * @request GET:/exchange/symbols/{exchangeName}
     */
    exchangeControllerGetSymbols: (
      exchangeName: string,
      params: RequestParams = {}
    ) =>
      this.request<any[], void>({
        path: `/exchange/symbols/${exchangeName}`,
        method: 'GET',
        format: 'json',
        ...params,
      }),
  };
  manifest = {
    /**
     * No description
     *
     * @tags manifest
     * @name ManifestControllerUploadManifest
     * @summary Upload manifest data
     * @request POST:/manifest/upload
     */
    manifestControllerUploadManifest: (
      data: ManifestUploadRequestDto,
      params: RequestParams = {}
    ) =>
      this.request<ManifestUploadResponseDto, void>({
        path: `/manifest/upload`,
        method: 'POST',
        body: data,
        type: ContentType.Json,
        format: 'json',
        ...params,
      }),
  };
  campaign = {
    /**
     * No description
     *
     * @tags campaign
     * @name CampaignControllerGetCampaigns
     * @summary Get campaigns for the given chain ID
     * @request GET:/campaign
     */
    campaignControllerGetCampaigns: (
      query?: {
        /** Chain ID */
        chainId?:
          | -1
          | 1
          | 4
          | 5
          | 11155111
          | 56
          | 97
          | 137
          | 80001
          | 80002
          | 1284
          | 1287
          | 43113
          | 43114
          | 42220
          | 44787
          | 195
          | 1338
          | 196;
      },
      params: RequestParams = {}
    ) =>
      this.request<any[], void>({
        path: `/campaign`,
        method: 'GET',
        query: query,
        format: 'json',
        ...params,
      }),

    /**
     * No description
     *
     * @tags campaign
     * @name CampaignControllerGetCampaign
     * @summary Get the campaign data for the given chain Id and escrow address
     * @request GET:/campaign/{chainId}/{escrowAddress}
     */
    campaignControllerGetCampaign: (
      chainId:
        | -1
        | 1
        | 4
        | 5
        | 11155111
        | 56
        | 97
        | 137
        | 80001
        | 80002
        | 1284
        | 1287
        | 43113
        | 43114
        | 42220
        | 44787
        | 195
        | 1338
        | 196,
      escrowAddress: string,
      params: RequestParams = {}
    ) =>
      this.request<CampaignDataDto, void>({
        path: `/campaign/${chainId}/${escrowAddress}`,
        method: 'GET',
        format: 'json',
        ...params,
      }),
  };
  leader = {
    /**
     * No description
     *
     * @tags leader
     * @name LeaderControllerGetLeader
     * @summary Get the leader data for the given chain Id and address
     * @request GET:/leader/{chainId}/{address}
     */
    leaderControllerGetLeader: (
      chainId:
        | -1
        | 1
        | 4
        | 5
        | 11155111
        | 56
        | 97
        | 137
        | 80001
        | 80002
        | 1284
        | 1287
        | 43113
        | 43114
        | 42220
        | 44787
        | 195
        | 1338
        | 196,
      address: string,
      params: RequestParams = {}
    ) =>
      this.request<LeaderDataDto, void>({
        path: `/leader/${chainId}/${address}`,
        method: 'GET',
        format: 'json',
        ...params,
      }),
  };
}
