// The published artifact stays under /pfad for the existing path route.
// Unmatched root requests on the subdomain use that same asset namespace.
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.hostname !== 'pfad.motionstudies.app') return env.ASSETS.fetch(request)
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
    }
    if (url.protocol !== 'https:') {
      url.protocol = 'https:'
      return Response.redirect(url.href, 308)
    }
    const assetUrl = new URL(url)
    assetUrl.pathname = '/pfad' + url.pathname
    const response = await env.ASSETS.fetch(new Request(assetUrl, request))
    const location = response.headers.get('location')
    if (!location) return response
    const redirect = new URL(location, assetUrl)
    if (redirect.origin !== url.origin || !redirect.pathname.startsWith('/pfad/')) return response
    redirect.pathname = redirect.pathname.slice('/pfad'.length)
    const result = new Response(response.body, response)
    result.headers.set('location', redirect.href)
    return result
  },
}
