/**
 * Cloudflare Pages Function — GraphQL API Proxy
 *
 * Proxies all /graphql requests to the HyperPush backend on the VPS.
 * The VPS origin URL is stored as a Cloudflare Pages Secret environment
 * variable (API_ORIGIN) to avoid exposing the server IP in source code.
 *
 * Environment variables (set in Cloudflare Dashboard → Secrets):
 *   API_ORIGIN — e.g. "http://129.121.97.120:8080"
 */

export async function onRequest(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);

    // Read the origin from environment variable (set as a Secret in Dashboard)
    const origin = env.API_ORIGIN;
    if (!origin) {
      return new Response(
        JSON.stringify({
          errors: [{ message: 'API_ORIGIN environment variable is not configured' }],
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const target = `${origin}${url.pathname}${url.search}`;

    // Build proxied request headers
    const proxyHeaders = new Headers(request.headers);
    // Override host so the backend Nginx matches the correct server_name
    proxyHeaders.set('host', 'hyperpush.org');
    // Remove headers that cause issues when proxying
    proxyHeaders.delete('cf-connecting-ip');
    proxyHeaders.delete('cf-ray');
    proxyHeaders.delete('cf-ipcountry');
    proxyHeaders.delete('cf-visitor');
    proxyHeaders.delete('cf-worker');
    proxyHeaders.delete('x-forwarded-for');
    proxyHeaders.delete('x-forwarded-proto');

    // Forward the request, preserving method, headers, and body
    const response = await fetch(target, {
      method: request.method,
      headers: proxyHeaders,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    });

    // Build response with filtered headers (exclude hop-by-hop headers)
    const responseHeaders = new Headers();
    const hopByHop = [
      'transfer-encoding',
      'connection',
      'keep-alive',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailer',
      'upgrade',
    ];
    for (const [key, value] of response.headers) {
      if (!hopByHop.includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }
    // Ensure CORS headers are present
    responseHeaders.set('access-control-allow-origin', '*');
    responseHeaders.set('access-control-allow-methods', 'GET, POST, OPTIONS');
    responseHeaders.set('access-control-allow-headers', 'Content-Type, Authorization');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        errors: [{ message: `Failed to connect to API origin: ${error.message || 'Unknown error'}` }],
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
