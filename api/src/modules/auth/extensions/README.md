# auth/extensions

Фічі auth живуть тут. Корінь модуля (`config`, `core`, `index`) лише підключає й конфігурує.

| Розширення | Призначення |
|---|---|
| `form` | POST `/auth/login`, `/auth/register` |
| `captcha` | GET `/auth/captcha` + перевірка |

Увімкнення — лише через [`../config.ts`](../config.ts) (`AUTH_*` env).
