import axios from 'axios';

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../constants';

const BASE_URL = import.meta.env.VITE_APP_RECORDING_ORACLE_API_URL;

let refreshPromise: Promise<{ access_token: string; refresh_token: string }> | null = null;

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
}, async(error) => {
  const originalRequest = error.config;
  if (error.response?.status === 401 && 
      !originalRequest._retry && 
      !originalRequest.url?.includes('/auth/refresh')) {
    
    originalRequest._retry = true;
    
    if (refreshPromise) {
      try {
        await refreshPromise;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    
    refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token } = response.data;
        localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        return { access_token, refresh_token };
      } catch (refreshError) {
        console.error('Refresh token error', refreshError);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        throw refreshError;
      } finally {
        refreshPromise = null;
      }
    })();
    
    try {
      await refreshPromise;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
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
