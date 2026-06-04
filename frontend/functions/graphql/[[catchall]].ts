/**
 * Cloudflare Pages Function — GraphQL API Proxy
 *
 * Proxies all /graphql requests to the HyperPush backend on the VPS.
 * The VPS origin URL is stored as a Cloudflare Pages Secret environment
 * variable (API_ORIGIN) to avoid exposing the server IP in source code.
 *
 * Environment variables (set in Cloudflare Dashboard):
 *   API_ORIGIN — e.g. "xxxxxx:8080"
 */

export async function onRequest(context) {
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

  // Forward the request, preserving method, headers, and body
  const proxyRequest = new Request(target, {
    method: request.method,
    headers: {
      // Spread original headers first, so overrides below take precedence
      ...Object.fromEntries(request.headers.entries()),
      // Ensure the backend Nginx matches the correct server_name block
      host: 'hyperpush.org',
    },
    // Body is not allowed in GET/HEAD requests
    body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
    // Signal to the backend that this is a proxied request
    // @ts-expect-error - Cloudflare-specific fetch property
    redirect: 'manual',
  });

  try {
    const response = await fetch(proxyRequest);

    // Return the proxied response as-is
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        errors: [{ message: `Failed to connect to API origin: ${error.message}` }],
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}
