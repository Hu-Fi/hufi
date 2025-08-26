import { LauncherApiClient } from "./launcherApiClient";
import { RecordingApiClient } from "./recordingApiClient";
import { tokenManager } from "../utils/TokenManager";

export const launcherApi = new LauncherApiClient({
  baseUrl: import.meta.env.VITE_APP_CAMPAIGN_LAUNCHER_API_URL,
});

export const recordingApi = new RecordingApiClient({
  baseUrl: import.meta.env.VITE_APP_RECORDING_ORACLE_API_URL,
  tokenManager: tokenManager,
});
