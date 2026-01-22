import { API_HOST, API_PATH, API_PREFIX_PATH, API_URL } from "../constants";
import { Brain } from "./Brain";
import type { RequestParams } from "./http-client";

// Detect if we're in development mode (Vite dev server)
const isDevelopment = import.meta.env.DEV;

// Check if deployed to a custom API path (production scenario)
const isDeployedToCustomApiPath = API_PREFIX_PATH !== API_PATH && API_PREFIX_PATH !== "";

const constructBaseUrl = (): string => {
  // In development, use relative URLs to leverage Vite's proxy
  // This avoids CORS entirely since requests go through the same origin
  if (isDevelopment) {
    return "";
  }

  // Production: check for custom deployment paths
  if (isDeployedToCustomApiPath) {
    const domain = window.location.origin || `https://${API_HOST}`;
    return `${domain}${API_PREFIX_PATH}`;
  }

  // Production fallback: use API_URL if available
  if (API_URL && API_URL !== "http://localhost:8000") {
    return API_URL;
  }

  // If API_HOST is configured, use it
  if (API_HOST) {
    return `https://${API_HOST}${API_PATH}`;
  }

  // Final fallback: use relative URLs
  return "";
};

type BaseApiParams = Omit<RequestParams, "signal" | "baseUrl" | "cancelToken">;

const constructBaseApiParams = (): BaseApiParams => {
  return {
    credentials: "include",
  };
};

const constructClient = () => {
  const baseUrl = constructBaseUrl();
  const baseApiParams = constructBaseApiParams();

  return new Brain({
    baseUrl,
    baseApiParams,
    customFetch: (url, options) => {
      if (isDeployedToCustomApiPath) {
        // Remove /routes/ segment from path if the api is deployed and made accessible through
        // another domain with custom path different from the databutton proxy path
        return fetch(url.replace(API_PREFIX_PATH + "/routes", API_PREFIX_PATH), options);
      }

      return fetch(url, options);
    },
  });
};

const brain = constructClient();

export default brain;
