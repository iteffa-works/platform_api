/** Помилка з HTTP-статусом: обробник помилок застосунку віддає її клієнту як `{ error }` */
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
