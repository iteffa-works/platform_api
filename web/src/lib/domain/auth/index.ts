export { authConfig } from './config.js';
export type { AuthMode } from './config.js';
export { fetchMe, postAuth } from './api.js';
export {
  collectAuthExtensionFields,
  listAuthExtensionHints,
  listAuthExtensionSlots,
  registerAllAuthExtensions,
  resolveAuthEndpoint,
  resolveAuthSubmitLabel,
  validateAuthExtensions,
} from './extensions/index.js';
export {
  authReady,
  ensureAuth,
  isAuthenticated,
  loadMe,
  loginWithToken,
  logout,
  token,
  user,
} from './store.js';
