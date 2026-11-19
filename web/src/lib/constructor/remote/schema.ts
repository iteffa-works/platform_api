/**
 * Схема інтерфейсу від API (server-driven UI) — сторінки плагінів рендеряться без їхнього коду в web.
 * Дзеркало api/src/core/ui/schema.ts — змінювати разом.
 */

export type Tone = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'slate';

/** Значення, яке форматує клієнт мовою й часовим поясом користувача */
export type UiValue =
  | { type: 'money'; amount: string; currency: string }
  | { type: 'date'; value: string }
  | { type: 'datetime'; value: string };

/** Рядок тексту: звичайний текст, значення або їх послідовність; `{ b }` — жирний фрагмент */
export type Inline = string | UiValue | { b: string } | Inline[];

/**
 * Дія кнопки / форми — виклик REST-маршруту `/api/v1<url>` (права перевіряє маршрут).
 * Значення форми додаються до `body`.
 */
export type UiAction = {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  url: string;
  body?: Record<string, unknown>;
  /** Підтвердження перед виконанням */
  confirm?: string;
  /** Запитати значення (`window.prompt`) і покласти в body[field] */
  prompt?: { message: string; field: string; value?: string };
  /** Ключ відповіді з URL — відкрити в новій вкладці (вікно відкривається до запиту, щоб не заблокував браузер) */
  openUrl?: string;
  success?: {
    /** Текст після успіху; `{ключ}` — значення з відповіді */
    notice?: string;
    /* `{ключ}` / `{a.b}` у notice і redirect — значення з відповіді */
    /** Якщо у відповіді є цей ключ — показати його як помилку (напр. `error` перевірки) */
    errorKey?: string;
    /** Показати значення з відповіді: `secret` — один раз з копіюванням, `json` — форматований */
    result?: { key: string; title: string; text?: string; format: 'secret' | 'json' };
    redirect?: string;
    /** Перерендерити сторінку (за замовчуванням так, якщо немає redirect) */
    reload?: boolean;
    /** Перезавантажити маніфест (меню, сторінки плагінів) — після вмикання / вимикання плагіна */
    manifest?: boolean;
  };
};

export type UiOption = {
  value: string;
  label: string;
  /** Додаткові рядки картки вибору (ціна, ліміти) */
  lines?: Inline[];
  /** Виділений рядок картки під назвою (ціна) */
  accent?: Inline;
  /** Вузол перед підписом (прапор) */
  media?: UiNode;
  disabled?: boolean;
};

export type UiField = {
  name: string;
  kind: 'text' | 'password' | 'email' | 'number' | 'date' | 'url' | 'select' | 'choice' | 'checkbox' | 'hidden';
  label?: string;
  value?: string | boolean;
  required?: boolean;
  minlength?: number;
  placeholder?: string;
  hint?: string;
  grow?: boolean;
  autocomplete?: string;
  /** select / choice — варіанти; text — підказки (datalist) */
  options?: UiOption[];
  /** Зміна значення перерендерює сторінку з поточними значеннями форми (підсумок, залежні поля) */
  live?: boolean;
  /** Зміна значення — перехід з `?<name>=<value>` в URL (фільтри, що переживають дії й оновлення) */
  navigate?: boolean;
};

export type UiButton = {
  type: 'button';
  label: string;
  icon?: string;
  /** link — виглядає як посилання (примітка, «Змінити тариф →») */
  variant?: 'primary' | 'ghost' | 'danger' | 'link';
  size?: 'md' | 'lg';
  /** Перехід у межах застосунку */
  href?: string;
  action?: UiAction;
  /** Відкрити модальне вікно з вузлами (форма створення, підтвердження з деталями) */
  dialog?: { title: string; nodes: UiNode[] };
  disabled?: boolean;
  /** Підказка при наведенні */
  title?: string;
};

export type UiForm = {
  type: 'form';
  fields: UiField[];
  /** Вузли між полями й кнопкою (підсумок замовлення, попередження) */
  footer?: UiNode[];
  /** Колонка праворуч (підсумок замовлення): липка, з кнопкою відправки; на вузькому екрані — під полями */
  aside?: UiNode[];
  submit?: { label: string; variant?: 'primary' | 'ghost' | 'danger'; size?: 'md' | 'lg'; action: UiAction; disabled?: boolean };
  /** row — поля в рядок з переносом (за замовчуванням), stack — стовпцем */
  layout?: 'row' | 'stack';
};

export type UiNode =
  | { type: 'stack'; gap?: number; children: UiNode[] }
  | { type: 'row'; justify?: 'start' | 'between' | 'end'; align?: 'start' | 'center' | 'end'; children: UiNode[] }
  /** Сітка: колонки однакові (min — мінімальна ширина) або `main-aside` — основна колонка й вузька праворуч (2 дочірні) */
  | { type: 'grid'; min?: number; layout?: 'main-aside'; children: UiNode[] }
  /** Панель: заголовок, підзаголовок, дії праворуч у шапці (кнопки, меню) */
  | { type: 'panel'; title?: string; subtitle?: string; actions?: UiNode[]; flush?: boolean; children: UiNode[] }
  /** Плитки показників (KPI); `progress` 0–100 — смуга під значенням */
  | { type: 'stats'; items: Array<{ label: string; value: Inline; hint?: Inline; tone?: Tone; icon?: string; href?: string; progress?: number | null }> }
  /** Картки-переходи: іконка, назва, опис (швидкий старт, розділи) */
  | { type: 'shortcuts'; items: Array<{ label: string; text?: string; icon?: string; href: string; tone?: Tone }> }
  /** Меню дій (⋯) — рядок таблиці */
  | { type: 'menu'; label?: string; items: UiButton[] }
  | { type: 'breadcrumbs'; items: Array<{ label: string; href?: string }> }
  /** Смуга заповнення: value 0–100 або null (без ліміту) */
  | { type: 'progress'; value: number | null; label?: Inline; tone?: Tone }
  /** Вкладки розділу (line) або другорядні перемикачі всередині сторінки (pills); count — лічильник біля підпису */
  | { type: 'tabs'; variant?: 'line' | 'pills'; items: Array<{ label: string; href: string; active?: boolean; count?: number }> }
  | { type: 'banner'; tone?: Tone; text: Inline }
  | { type: 'text'; text: Inline; tone?: 'body' | 'muted' | 'error' | 'success' | 'warn'; size?: 'sm' | 'md' | 'lg' | 'xl'; bold?: boolean }
  | { type: 'heading'; text: Inline; level?: 2 | 3 }
  | { type: 'badge'; text: string; tone?: Tone }
  | { type: 'link'; text: string; href: string; external?: boolean }
  | { type: 'fields'; items: Array<{ label: string; value: Inline }> }
  /** Таблиця; `search` — поле фільтра рядків на клієнті (підказка) */
  | { type: 'table'; columns: Array<{ key: string; label: string; align?: 'left' | 'right'; width?: string }>; rows: Array<{ key: string | number; cells: Record<string, UiNode[]>; muted?: boolean }>; empty?: string; search?: string }
  | { type: 'ring'; value: number | null; size?: number }
  | { type: 'flag'; code: string | null; size?: number; round?: boolean }
  | { type: 'icon'; name: string; size?: number }
  /** Кольорове коло з іконкою (стан акаунта) */
  | { type: 'status'; tone: Tone; icon?: string }
  /** Кольорова плитка: медіа ліворуч, вміст, кнопка-футер */
  | { type: 'tile'; tone: Tone; media?: UiNode; children: UiNode[]; footer?: UiButton }
  | { type: 'empty'; text: string }
  /**
   * Модальне вікно, відкрите самою сторінкою (напр. `?panel=renew`): закриття — перехід на `close`.
   * Посилання на стан (з листа, сповіщення, інших сторінок) відкривають одразу вікно.
   */
  | { type: 'modal'; title: string; close: string; size?: 'md' | 'lg'; children: UiNode[] }
  /** Картка-привітання: аватар, заголовок, рядок відомостей; праворуч — дата / стан */
  | { type: 'welcome'; title: string; subtitle?: Inline; avatar?: { seed: string; src?: string | null }; aside?: Inline; status?: { tone: Tone; text: string } }
  | { type: 'code'; text: string; block?: boolean }
  /**
   * Таблиця робочого простору: тон рядка, панель фільтрів, сортування й пагінація на сервері.
   * Керування пише в URL (?<name>=…, `sort`=key | -key, `page`, `perPage`) → сторінка рендериться з цим state.
   */
  | {
      type: 'datagrid';
      columns: Array<{ key: string; label: string; align?: 'left' | 'right' | 'center'; width?: string; sortable?: boolean }>;
      rows: Array<{ key: string | number; tone?: GridTone; cells: Record<string, UiNode[]> }>;
      toolbar?: {
        segments?: { name: string; value: string; items: Array<{ label: string; value: string; count?: number }> };
        filters?: Array<{ name: string; label: string; value: string; options: Array<{ value: string; label: string }> }>;
        search?: { name: string; value: string; placeholder: string };
      };
      sort?: { key: string; dir: 'asc' | 'desc' };
      page?: { page: number; perPage: number; total: number; summary?: string; perPageOptions?: number[] };
      empty?: string;
    }
  /** Плашка-повідомлення: тон, текст, необовʼязкова дія праворуч */
  | { type: 'alert'; tone?: 'info' | 'warn' | 'danger' | 'success'; text: Inline; action?: UiButton }
  /** Людина: аватар (фото або ідентикон з seed), імʼя, підпис */
  | { type: 'person'; name: string; caption?: string; seed: string; src?: string | null; href?: string }
  /** Іконки-дії рядка (підпис кнопки — підказка); кнопки без icon не показуються */
  | { type: 'actions'; items: UiButton[] }
  | UiButton
  | UiForm;

/** Тон рядка datagrid */
export type GridTone = 'warn' | 'danger' | 'success' | 'muted';

/** Результат рендеру сторінки: вузли й дії в шапці сторінки (поруч із заголовком) */
export type UiRendered = { nodes: UiNode[]; actions?: UiButton[] };

/** Пункт меню розділу; `label` / `group` — ключі перекладів плагіна */
export type UiNavItem = {
  section: 'admin' | 'cabinet';
  href: string;
  label: string;
  icon?: string;
  group?: string;
  pinned?: boolean;
  permission?: [resource: string, level: 'view' | 'edit' | 'manage'];
};

export type UiService = { href: string; label: string; icon: string; tone: Tone; permission?: UiNavItem['permission'] };

export type UiMessages = { uk: Record<string, string>; en?: Record<string, string>; ru?: Record<string, string> };
