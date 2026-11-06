/** Дата в українській локалі */
export function formatDate(value: string): string {
  return new Date(value).toLocaleString('uk-UA');
}
