export type { AuthMode } from './config.js';
export { postAuth } from './api.js';
export {
  collectAuthExtensionFields,
  listAuthExtensionSlots,
  registerAllAuthExtensions,
  resolveAuthEndpoint,
  resolveAuthSubmitLabel,
  validateAuthExtensions,
} from './extensions/index.js';
export {
  ensureAuth,
  isAuthenticated,
  loadMe,
  loginWithToken,
  signOut,
  user,
} from './store.js';
