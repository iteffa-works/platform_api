/**
 * UI-кит робочого простору (адмінка; далі — кабінет): презентаційні компоненти на пропсах.
 * Ті самі компоненти малюють і сторінки ядра, і вузли серверної схеми (constructor/remote).
 * Стилі — Sass з міксинами `$lib/ui/styles/tools` (підключаються автоматично).
 */
export { default as Alert } from './Alert.svelte';
export { default as Breadcrumbs } from './Breadcrumbs.svelte';
export { default as DataGrid } from './DataGrid.svelte';
export { default as IconAction } from './IconAction.svelte';
export { default as PageHeader } from './PageHeader.svelte';
export { default as Pagination } from './Pagination.svelte';
export { default as PersonCell } from './PersonCell.svelte';
export { default as SearchBox } from './SearchBox.svelte';
export { default as Section } from './Section.svelte';
export { default as Segmented } from './Segmented.svelte';
export { default as Select } from './Select.svelte';
export { default as StatTile } from './StatTile.svelte';
export { default as Toolbar } from './Toolbar.svelte';
export { headerSlot, headerTarget, portal } from './portal.js';
export type * from './types.js';
