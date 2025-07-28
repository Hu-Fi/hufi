import { RecordingApiClient } from './recordingApiClient';
import { tokenManager } from '../utils/TokenManager';

const BASE_URL = import.meta.env.VITE_APP_RECORDING_ORACLE_API_URL;

const recordingApi = new RecordingApiClient({
  baseUrl: BASE_URL,
  tokenManager: tokenManager,
});

export default recordingApi;
