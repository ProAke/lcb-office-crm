#!/usr/bin/env node
// Read-only deployment check: no login, cookies, credentials or mutations.
const base = process.argv[2];
if (!base) {
  console.error('Usage: node scripts/check-deployment.mjs https://example.com');
  process.exit(2);
}
let origin;
try {
  const parsed = new URL(base);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
  origin = parsed.origin;
} catch {
  console.error('Provide an HTTP(S) origin without credentials.');
  process.exit(2);
}
const timeout = () => AbortSignal.timeout(15000);
let failed = false;
try {
  const page = await fetch(new URL('/login', origin), { redirect: 'manual', cache: 'no-store', signal: timeout() });
  console.log(`GET /login: ${page.status} (${page.headers.get('content-type') || 'no content-type'})`);
  if (!page.ok || !page.headers.get('content-type')?.includes('text/html')) throw new Error('Login page is not a successful HTML response.');
  const html = await page.text();
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)]
    .map(m => new URL(m[1].replaceAll('&amp;', '&'), origin))
    .filter(url => url.origin === origin && url.pathname.startsWith('/_next/static/') && url.pathname.endsWith('.js'));
  const unique = [...new Map(scripts.map(url => [url.href, url])).values()];
  if (unique.length === 0) throw new Error('No local Next.js JavaScript files found in the login HTML.');
  console.log(`Found ${unique.length} unique JavaScript files.`);
  for (const url of unique) {
    try {
      const response = await fetch(url, { redirect: 'manual', cache: 'no-store', signal: timeout() });
      const type = response.headers.get('content-type') || '';
      const body = await response.arrayBuffer();
      const ok = response.ok && /(?:javascript|ecmascript)/i.test(type) && body.byteLength > 0;
      console.log(`${ok ? 'OK' : 'FAIL'} ${url.pathname}: ${response.status}, ${type || 'no content-type'}, ${body.byteLength} bytes`);
      if (!ok) failed = true;
    } catch (error) {
      failed = true;
      console.error(`FAIL ${url.pathname}: ${error instanceof Error ? error.message : 'request failed'}`);
    }
  }
} catch (error) {
  failed = true;
  console.error(`Check failed: ${error instanceof Error ? error.message : 'unknown error'}`);
}
if (failed) {
  console.error('Some checks failed. Inspect deployment paths, build files, proxy and server logs.');
  process.exitCode = 1;
} else {
  console.log('HTTP and JavaScript asset checks passed. This does not execute JavaScript or verify login/database.');
}
