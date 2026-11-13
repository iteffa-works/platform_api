/**
 * Тонкий клієнт Client API: отримати роботу → обробити локально → відзвітувати.
 */

export class ClientApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ClientApiError';
    this.status = status;
  }
}

export class ClientApi {
  /**
   * @param {{ baseUrl?: string, apiKey?: string, fetchImpl?: typeof fetch }} [options]
   */
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || 'http://127.0.0.1:4000/api/client/v1').replace(/\/$/, '');
    this.apiKey = options.apiKey || 'dev-client-key';
    this.fetchImpl = options.fetchImpl || globalThis.fetch.bind(globalThis);
  }

  async request(method, path, body) {
    const headers = { Authorization: `Bearer ${this.apiKey}` };
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ClientApiError(data.error || 'Помилка запиту', res.status);
    return data;
  }

  status() {
    return this.request('GET', '/status');
  }

  /** @returns {Promise<{ work: object | null }>} */
  nextWork() {
    return this.request('GET', '/work/next');
  }

  /**
   * @param {string} id
   * @param {{ status: 'done' | 'failed', data?: object, error?: string }} result
   */
  reportResult(id, result) {
    return this.request('POST', `/work/${id}/result`, result);
  }

  /**
   * Цикл: забрати → локально обробити → відзвітувати.
   * @param {(work: object) => Promise<{ status: 'done' | 'failed', data?: object, error?: string }>} handler
   */
  async processOnce(handler) {
    const { work } = await this.nextWork();
    if (!work) return { processed: false, work: null };
    try {
      const result = await handler(work);
      await this.reportResult(work.id, result);
      return { processed: true, work, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.reportResult(work.id, { status: 'failed', error: message });
      throw error;
    }
  }
}
