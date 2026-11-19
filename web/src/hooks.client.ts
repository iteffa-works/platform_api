import type { HandleClientError } from '@sveltejs/kit';
import { DEBUG } from '$lib/config';
import { exceptionName, parseFrames } from '$lib/core/debug';
import { ApiError } from '$lib/core/api/client';

/** Помилки в браузері (навігація, load): у режимі DEBUG — деталі для сторінки помилки */
export const handleError: HandleClientError = ({ error, event, message }) => {
  console.error(error);
  if (!DEBUG) return { message };
  if (error instanceof ApiError && error.debug) return { message: error.message, debug: error.debug };
  return {
    message: error instanceof Error ? error.message : message,
    debug: {
      origin: 'browser',
      exception: exceptionName(error),
      message: error instanceof Error ? error.message : String(error),
      frames: parseFrames(error instanceof Error ? error.stack : undefined),
      request: { method: 'GET', url: event.url.pathname + event.url.search },
      route: event.route.id,
      at: new Date().toISOString(),
    },
  };
};
