import { Api } from "./client";
import { MockedLauncherClient } from "./mockedLauncherClient";
import { RecordingApiClient } from "./recordingApiClient";
import { tokenManager } from "../utils/TokenManager";

export const api = new Api({
  baseUrl: import.meta.env.VITE_APP_CAMPAIGN_LAUNCHER_API_URL,
});

export const launcherApi = new MockedLauncherClient({
  baseUrl: import.meta.env.VITE_APP_CAMPAIGN_LAUNCHER_API_URL,
});

export const recordingApi = new RecordingApiClient({
  baseUrl: import.meta.env.VITE_APP_RECORDING_ORACLE_API_URL,
  tokenManager: tokenManager,
});
