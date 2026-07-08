/**
 * Helmet Security Headers Configuration
 * Provides HTTP security headers to protect against common web vulnerabilities
 * @module config/helmet
 */

import helmet from "helmet";

/**
 * Configure Helmet middleware with default security headers.
 * Keeping it simple to avoid breaking WebSocket (Socket.IO) and CORS.
 */
const helmetMiddleware = helmet({
  // Default Helmet settings are secure and compatible with most APIs.
  // No custom overrides needed right now to keep CORS and Socket.IO happy.
});

export default helmetMiddleware;