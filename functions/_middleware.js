import paths from './advertising-routes.js';
import { advertisingResponse } from '../lib/advertising-csp.mjs';
const publicPaths = new Set(paths);
export const onRequest = context => advertisingResponse(context, publicPaths, ['kalendars365.lv', 'www.kalendars365.lv']);
