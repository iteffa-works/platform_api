# API contours (outline)

## Platform — `/api/v1`

Для `web`. JWT. Без client-обмежень.

### Auth
- `POST /auth/register` — перший користувач = `developer`
- `POST /auth/login`
- `GET /auth/me` — `{ user: { id, email, name, role, permissions, preferences: { theme, timezone } } }`
- `GET /auth/captcha` — SVG-капча; `{ enabled: false }`, якщо `AUTH_CAPTCHA=false`

### Cabinet (будь-який користувач)
- `GET /cabinet/profile` — `{ user, access: [{ key, label, level }] }`
- `PATCH /cabinet/account` — `{ name }` (email — після підтвердження пошти)
- `PATCH /cabinet/preferences` — `{ theme?: light|dark, timezone?: IANA|null }` → таблиця `user_preferences`
- `POST /cabinet/password` — `{ currentPassword, newPassword }`
- `DELETE /cabinet/account` — `{ password }`; розробника не видалити

### Admin (права ролі, див. [roles-plan.md](roles-plan.md))
- `GET /admin/overview` — показники (користувачі / ролі / розділи прав), `admin.panel: view`
- `GET /admin/users` — `users: view`
- `PATCH /admin/users/:id` — `{ roleId }`, `users: manage`
- `GET /admin/permissions` — каталог ресурсів і рівнів, `roles: view`
- `GET /admin/roles` — ролі з кількістю користувачів
- `POST /admin/roles` — `{ slug, name, description?, permissions }`, `roles: manage`
- `PATCH /admin/roles/:id` — `roles: manage`
- `DELETE /admin/roles/:id` — `{ reassignTo }`, `roles: manage`

## Client — `/api/client/v1`

Для `desktop` / скриптів. API key + rate limit.

- `GET /status`
- `GET /work/next`
- `POST /work/:id/result`
