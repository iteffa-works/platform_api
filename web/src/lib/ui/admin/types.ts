/** Типи пропсів UI-кита робочого простору */

export type Crumb = { label: string; href?: string };

export type Segment = { label: string; value?: string; href?: string; count?: number };

export type SelectOption = { value: string; label: string };

export type GridColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  /** Ширина колонки (CSS), напр. `120px` або `1%` для «по вмісту» */
  width?: string;
  sortable?: boolean;
};

export type GridTone = 'warn' | 'danger' | 'success' | 'muted';

export type GridSort = { key: string; dir: 'asc' | 'desc' };
