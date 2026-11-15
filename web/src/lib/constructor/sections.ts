/** Дані розділу (кабінет: профіль, баланс, сповіщення) — для сторінок плагінів у цьому розділі */
const loads = new Map<string, () => Promise<unknown>>();

export function setSectionLoad(section: string, load: () => Promise<unknown>): void {
  loads.set(section, load);
}

export function sectionLoad(section: string): (() => Promise<unknown>) | undefined {
  return loads.get(section);
}
