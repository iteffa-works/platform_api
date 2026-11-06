import { Model, type ModelStatic } from 'sequelize';

export type Models = Record<string, ModelStatic<Model>>;

export const models: Models = {};

export function requireModel(registry: Models, name: string): ModelStatic<Model> {
  const model = registry[name];
  if (!model) throw new Error(`Модель ${name} не завантажена`);
  return model;
}
