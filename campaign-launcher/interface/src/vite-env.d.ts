/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_CAMPAIGN_LAUNCHER_API_URL: string;
  readonly VITE_APP_CAMPAIGN_LAUNCHER_API_KEY: string;
  readonly VITE_APP_RECORDING_ORACLE_API_URL: string;
  readonly VITE_APP_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_APP_WEB3_ENV: string;

  readonly VITE_APP_EXCHANGE_ORACLE_FEE: number;
  readonly VITE_APP_RECORDING_ORACLE_ADDRESS: string;
  readonly VITE_APP_RECORDING_ORACLE_FEE: number;
  readonly VITE_APP_REPUTATION_ORACLE_ADDRESS: string;
  readonly VITE_APP_REPUTATION_ORACLE_FEE: number;

  readonly VITE_APP_STAKING_DASHBOARD_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
