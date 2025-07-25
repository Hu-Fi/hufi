import { HttpClient } from './httpClient';
import { ACCESS_TOKEN_KEY } from '../constants';

const BASE_URL = import.meta.env.VITE_APP_RECORDING_ORACLE_API_URL;

const recordingApi = new HttpClient({
  baseURL: BASE_URL,
});

export default recordingApi;

export const request = async (url: string, options?: RequestInit) => {
  const response = await fetch(BASE_URL + url, options);

  if (!response.ok) {
    throw new Error('Failed to fetch');
  }

  return response.json();
};

export const requestWithAuth = async (url: string, options: RequestInit) => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  return request(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
};
