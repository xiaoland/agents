// Placeholder for future Cloudflare Worker server-side logic
// Currently, the app is purely client-side (CSR)

export default {
  async fetch(request: Request): Promise<Response> {
    return new Response('This worker is not yet implemented. Use the static site.', {
      status: 501,
      headers: { 'Content-Type': 'text/plain' }
    })
  }
}
