# auth/extensions

Фічі auth живуть тут. Корінь модуля (`config`, `core`, `index`) лише підключає й конфігурує.

| Розширення | Призначення |
|---|---|
| `form` | POST `/auth/login`, `/auth/register` |
| `captcha` | GET `/auth/captcha` + перевірка |
| `forgot-email` | «Забули email?» |
| `forgot-password` | «Забули пароль?» |
| `passwordless` | «Увійти без пароля» |
| `register-link` | CTA реєстрації / входу |
| `account-type` | Користувач / компанія при реєстрації |
| `verification` | Спосіб верифікації |
| `contacts` | Телефон / месенджер |
| `terms` | Згода з умовами |
| `two-factor` | 2FA (stub) |

Увімкнення — лише через [`../config.ts`](../config.ts) (`AUTH_*` env).
