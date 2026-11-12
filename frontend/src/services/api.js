// Backward-compatible entrypoint for apiClient
import apiClient, { prewarmBackend } from './api/apiClient';

export { prewarmBackend, apiClient };
export default apiClient;
