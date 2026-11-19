/** Гроші — цілі копійки; на вході/виході — десятковий рядок «12.50» */

export function parseAmount(value: unknown): number | null {
  const text = String(value ?? '').trim().replace(',', '.');
  if (!/^-?\d{1,9}(\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.replace('-', '').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return text.startsWith('-') ? -cents : cents;
}

export function formatAmount(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}
