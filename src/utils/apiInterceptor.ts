import { addLocalDelay } from "@/config/api";
import { AxiosInstance } from "axios";

/**
 * Adds a request interceptor to an axios instance that delays requests by 2 seconds
 * when the environment is "local"
 */
export const addLocalDelayInterceptor = (api: AxiosInstance): void => {
  api.interceptors.request.use(
    async (config) => {
      // Add delay for local environment
      await addLocalDelay();
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

/**
 * Wrapper for fetch API calls that adds delay for local environment
 */
export const fetchWithDelay = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  // Add delay for local environment
  await addLocalDelay();

  // Call the original fetch
  return fetch(input, init);
};
