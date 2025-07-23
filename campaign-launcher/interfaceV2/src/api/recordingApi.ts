import axios from 'axios';

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants';

const BASE_URL = import.meta.env.VITE_APP_RECORDING_ORACLE_API_URL;

let refreshPromise: Promise<{ access_token: string; refresh_token: string }> | null = null;

const performRefresh = async () => {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) throw new Error('No refresh token');
  
  const { data: { access_token, refresh_token } } = await axios.post(`${BASE_URL}/auth/refresh`, {
    refresh_token: refreshToken,
  });

  localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  
  return { access_token, refresh_token };
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((request) => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (accessToken) {
    request.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return request;
}, (error) => {
  return Promise.reject(error);
});

axiosInstance.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;
  if (error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url?.includes('/auth/refresh')) {
    
    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = performRefresh()
        .catch((error) => {
          console.error('Refresh token error', error);
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          throw error;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }
    
    await refreshPromise;
    return axiosInstance(originalRequest);
  }

  return Promise.reject(error);
});

export default axiosInstance;

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
