export { can, DEVELOPER_ROLE, LEVEL_LABELS } from './access.js';
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
  displayName,
  loadMe,
  loginWithToken,
  logout,
  signOut,
  user,
} from './store.js';
