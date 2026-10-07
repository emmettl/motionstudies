// Both public addresses use the same verified artifact under /zenit.
// The edition HTML declares the subdomain root as its canonical URL.
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
    }
    if (url.hostname === 'motionstudies.app') {
      if (url.pathname !== '/zenit' && !url.pathname.startsWith('/zenit/')) {
        return new Response('Not found', { status: 404 })
      }
      return env.ASSETS.fetch(request)
    }
    if (url.hostname !== 'zenit.motionstudies.app') return new Response('Not found', { status: 404 })
    if (url.protocol !== 'https:') {
      url.protocol = 'https:'
      return Response.redirect(url.href, 308)
    }
    const assetUrl = new URL(url)
    assetUrl.pathname = '/zenit' + url.pathname
    const response = await env.ASSETS.fetch(new Request(assetUrl, request))
    const location = response.headers.get('location')
    if (!location) return response
    const redirect = new URL(location, assetUrl)
    if (redirect.origin !== url.origin || !redirect.pathname.startsWith('/zenit/')) return response
    redirect.pathname = redirect.pathname.slice('/zenit'.length)
    const result = new Response(response.body, response)
    result.headers.set('location', redirect.href)
    return result
  },
}
