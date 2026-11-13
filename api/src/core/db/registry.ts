import type { Model, ModelStatic } from 'sequelize';

export type Models = Record<string, ModelStatic<Model>>;

export const models: Models = {};
