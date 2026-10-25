export const JOB_STATUS: Record<string, string> = {
  queued: 'у черзі',
  running: 'виконується',
  done: 'готово',
  failed: 'збій',
  cancelled: 'скасовано',
};

export const RESULT_STATUS: Record<string, string> = {
  pending: 'очікує',
  ok: 'знайдено',
  not_found: 'немає',
  error: 'помилка',
  skipped: 'пропущено',
};

export function statusLabel(map: Record<string, string>, value: string): string {
  return map[value] || value;
}

export function nickname(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ');
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString('uk-UA');
}
