/**
 * Resolves the API base URL dynamically.
 * If VITE_API_BASE_URL is specified in the environment (e.g. for production), it uses that.
 * Otherwise, it dynamically uses the host that the application is accessed from, on port 3001.
 * This ensures that local area network (LAN) access on external devices works out-of-the-box.
 * @returns {string}
 */
export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_API_BASE_URL.includes('localhost')) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return `${window.location.protocol}//${window.location.hostname}:3001`;
}
