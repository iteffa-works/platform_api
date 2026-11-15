/**
 * Переклад повідомлень API. Ключ — український текст HttpError (мова за замовчуванням),
 * значення — en / ru. Мову обирає web заголовком Accept-Language.
 * Повідомлення з підставленими значеннями (назви ресурсів тощо) лишаються українською.
 */
type Translation = { en: string; ru: string };

const MESSAGES: Record<string, Translation> = {
  '2FA вже увімкнено': { en: '2FA is already enabled', ru: '2FA уже включена' },
  '2FA не увімкнено': { en: '2FA is not enabled', ru: '2FA не включена' },
  'Імʼя: до 80 символів': { en: 'Name: up to 80 characters', ru: 'Имя: до 80 символов' },
  'Аватар: до 2 МБ': { en: 'Avatar: up to 2 MB', ru: 'Аватар: до 2 МБ' },
  'Аватар: лише PNG, JPG, GIF або WebP': { en: 'Avatar: PNG, JPG, GIF or WebP only', ru: 'Аватар: только PNG, JPG, GIF или WebP' },
  'Акаунт розробника не видаляється — спершу передайте роль': {
    en: 'The developer account cannot be deleted — transfer the role first',
    ru: 'Аккаунт разработчика не удаляется — сначала передайте роль',
  },
  'Антифішинговий код: до 32 символів': { en: 'Anti-phishing code: up to 32 characters', ru: 'Антифишинговый код: до 32 символов' },
  'Введіть код з зображення': { en: 'Enter the code from the image', ru: 'Введите код с изображения' },
  'Забагато спроб входу. Спробуйте за кілька хвилин': {
    en: 'Too many sign-in attempts. Try again in a few minutes',
    ru: 'Слишком много попыток входа. Попробуйте через несколько минут',
  },
  'Забагато спроб коду. Спробуйте за кілька хвилин': {
    en: 'Too many code attempts. Try again in a few minutes',
    ru: 'Слишком много попыток кода. Попробуйте через несколько минут',
  },
  'Занадто багато запитів': { en: 'Too many requests', ru: 'Слишком много запросов' },
  'Запит відхилено (CSRF)': { en: 'Request rejected (CSRF)', ru: 'Запрос отклонён (CSRF)' },
  'Капча застаріла, оновіть код': { en: 'Captcha expired, refresh the code', ru: 'Капча устарела, обновите код' },
  'Ключ ролі: 2–32 символи, латиниця в нижньому регістрі, цифри, дефіс': {
    en: 'Role key: 2–32 chars, lowercase latin, digits, hyphen',
    ru: 'Ключ роли: 2–32 символа, латиница в нижнем регистре, цифры, дефис',
  },
  'Ключ системної ролі незмінний': { en: 'A system role key cannot be changed', ru: 'Ключ системной роли неизменяем' },
  'Ключ тарифу: 2–32 символи, латиниця, цифри, дефіс': {
    en: 'Plan key: 2–32 chars, latin, digits, hyphen',
    ru: 'Ключ тарифа: 2–32 символа, латиница, цифры, дефис',
  },
  'Користувача не знайдено': { en: 'User not found', ru: 'Пользователь не найден' },
  'Мова: uk, en або ru': { en: 'Language: uk, en or ru', ru: 'Язык: uk, en или ru' },
  'Назва тарифу: 1–80 символів': { en: 'Plan name: 1–80 characters', ru: 'Название тарифа: 1–80 символов' },
  'Не вказано roleId': { en: 'roleId is required', ru: 'Не указан roleId' },
  'Не знайдено': { en: 'Not found', ru: 'Не найдено' },
  'Не можна змінити власну роль': { en: 'You cannot change your own role', ru: 'Нельзя изменить собственную роль' },
  'Не можна керувати правами вищими за власні': {
    en: 'You cannot manage permissions higher than your own',
    ru: 'Нельзя управлять правами выше собственных',
  },
  'Невідомий часовий пояс': { en: 'Unknown time zone', ru: 'Неизвестный часовой пояс' },
  'Невірний email або пароль': { en: 'Invalid email or password', ru: 'Неверный email или пароль' },
  'Невірний клієнтський ключ': { en: 'Invalid client key', ru: 'Неверный клиентский ключ' },
  'Невірний код 2FA': { en: 'Invalid 2FA code', ru: 'Неверный код 2FA' },
  'Невірний код капчі': { en: 'Invalid captcha code', ru: 'Неверный код капчи' },
  'Невірний пароль': { en: 'Invalid password', ru: 'Неверный пароль' },
  'Невірний поточний пароль': { en: 'Current password is incorrect', ru: 'Неверный текущий пароль' },
  'Недостатньо коштів на балансі': { en: 'Insufficient balance', ru: 'Недостаточно средств на балансе' },
  'Недостатньо прав': { en: 'Insufficient permissions', ru: 'Недостаточно прав' },
  'Некоректний email': { en: 'Invalid email', ru: 'Некорректный email' },
  'Некоректний секрет 2FA': { en: 'Invalid 2FA secret', ru: 'Некорректный секрет 2FA' },
  'Немає змін': { en: 'Nothing to change', ru: 'Нет изменений' },
  'Новий пароль збігається з поточним': { en: 'The new password matches the current one', ru: 'Новый пароль совпадает с текущим' },
  'Новий пароль: від 8 до 128 символів': { en: 'New password: 8 to 128 characters', ru: 'Новый пароль: от 8 до 128 символов' },
  'Пароль має бути від 8 до 128 символів': { en: 'Password must be 8 to 128 characters', ru: 'Пароль должен быть от 8 до 128 символов' },
  'Поточну сесію завершує вихід': { en: 'Use sign out to end the current session', ru: 'Текущую сессию завершает выход' },
  'Потрібен вхід': { en: 'Sign-in required', ru: 'Требуется вход' },
  'Роль для переназначення не знайдено': { en: 'Reassignment role not found', ru: 'Роль для переназначения не найдена' },
  'Роль з таким ключем уже існує': { en: 'A role with this key already exists', ru: 'Роль с таким ключом уже существует' },
  'Роль має користувачів — вкажіть reassignTo': { en: 'The role has users — specify reassignTo', ru: 'У роли есть пользователи — укажите reassignTo' },
  'Роль не знайдено': { en: 'Role not found', ru: 'Роль не найдена' },
  'Роль розробника змінюється лише передачею': {
    en: 'The developer role can only be transferred',
    ru: 'Роль разработчика меняется только передачей',
  },
  'Роль розробника не призначається': { en: 'The developer role cannot be assigned', ru: 'Роль разработчика не назначается' },
  'Роль розробника незмінна': { en: 'The developer role is immutable', ru: 'Роль разработчика неизменна' },
  'Сесію не знайдено': { en: 'Session not found', ru: 'Сессия не найдена' },
  'Сесія входу застаріла, увійдіть знову': { en: 'Sign-in session expired, sign in again', ru: 'Сессия входа устарела, войдите снова' },
  'Сесія недійсна': { en: 'Session is invalid', ru: 'Сессия недействительна' },
  'Системну роль не можна видалити': { en: 'A system role cannot be deleted', ru: 'Системную роль нельзя удалить' },
  'Сума: ненульове число, до 2 знаків після коми': {
    en: 'Amount: non-zero number, up to 2 decimals',
    ru: 'Сумма: ненулевое число, до 2 знаков после запятой',
  },
  'Такий email уже зареєстровано': { en: 'This email is already registered', ru: 'Такой email уже зарегистрирован' },
  'Тариф використовується — вимкніть його замість видалення': {
    en: 'The plan is in use — deactivate it instead of deleting',
    ru: 'Тариф используется — отключите его вместо удаления',
  },
  'Тариф з таким ключем уже існує': { en: 'A plan with this key already exists', ru: 'Тариф с таким ключом уже существует' },
  'Тариф за замовчуванням не видаляється': { en: 'The default plan cannot be deleted', ru: 'Тариф по умолчанию не удаляется' },
  'Тариф за замовчуванням не можна вимкнути': { en: 'The default plan cannot be deactivated', ru: 'Тариф по умолчанию нельзя отключить' },
  'Тариф не знайдено': { en: 'Plan not found', ru: 'Тариф не найден' },
  'Тема: light або dark': { en: 'Theme: light or dark', ru: 'Тема: light или dark' },
  'Файл зображення порожній': { en: 'The image file is empty', ru: 'Файл изображения пуст' },
  'Цей тариф уже активний': { en: 'This plan is already active', ru: 'Этот тариф уже активен' },
  'Ціна: число ≥ 0, до 2 знаків після коми': { en: 'Price: number ≥ 0, up to 2 decimals', ru: 'Цена: число ≥ 0, до 2 знаков после запятой' },
  'Внутрішня помилка': { en: 'Internal error', ru: 'Внутренняя ошибка' },
  'Запит завеликий': { en: 'Request is too large', ru: 'Запрос слишком большой' },
  'Некоректний запит': { en: 'Malformed request', ru: 'Некорректный запрос' },
};

/** Мова з Accept-Language: en / ru, інакше українська */
export function pickLanguage(header: string | undefined): 'uk' | 'en' | 'ru' {
  const code = String(header || '').trim().slice(0, 2).toLowerCase();
  return code === 'en' || code === 'ru' ? code : 'uk';
}

export function translate(message: string, language: 'uk' | 'en' | 'ru'): string {
  return language === 'uk' ? message : MESSAGES[message]?.[language] ?? message;
}
