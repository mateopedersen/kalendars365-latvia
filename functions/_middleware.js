import paths from './advertising-routes.js';
import { advertisingResponse } from '../lib/advertising-csp.mjs';
import pdfCanonicalPaths from '../lib/pdf-canonical-paths.mjs';

const publicPaths = new Set(paths);
const publicHosts = ['kalendars365.lv', 'www.kalendars365.lv'];
const canonicalDownloads = new Set(pdfCanonicalPaths);

export async function onRequest(context) {
  const { hostname, pathname } = new URL(context.request.url);
  if (!publicHosts.includes(hostname) || !canonicalDownloads.has(pathname) ||
      !['GET', 'HEAD'].includes(context.request.method)) {
    return advertisingResponse(context, publicPaths, publicHosts);
  }

  const response = await context.next();
  const isPdf = /^application\/pdf(?:;|$)/i.test(response.headers.get('Content-Type') || '');
  if (response.status !== 304 && (!isPdf || ![200, 206].includes(response.status))) return response;

  // Add the canonical after the asset lookup so revalidation of the unchanged
  // PDF publishes the header even when the cached object predates it.
  const headers = new Headers(response.headers);
  headers.set('Link', `<https://kalendars365.lv${pathname}>; rel="canonical"`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
