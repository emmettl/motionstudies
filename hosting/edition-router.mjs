export const editions = ['gleislicht', 'allchange', 'correspondances', 'umlauf', 'norikae', 'manifest']
const origin = 'https://emmettl.github.io'
const forwardedHeaders = ['accept', 'accept-encoding', 'if-none-match', 'if-modified-since', 'range', 'if-range']

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const edition = url.pathname.split('/')[1]
    // Only already-public editions belong here. Never proxy arbitrary repositories.
    if (!editions.includes(edition)) return fetch(request)
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } })
    }
    if (url.pathname === `/${edition}`) {
      url.pathname += '/'
      return Response.redirect(url.href, 308)
    }
    const upstream = new URL(url.pathname + url.search, origin)
    const headers = new Headers()
    for (const name of forwardedHeaders) {
      if (request.headers.has(name)) headers.set(name, request.headers.get(name))
    }
    let response
    try {
      response = await fetch(upstream, { method: request.method, headers, redirect: 'manual' })
    } catch {
      return new Response('Edition temporarily unavailable', { status: 502 })
    }
    const result = new Response(response.body, response)
    const location = result.headers.get('location')
    if (location) {
      const redirect = new URL(location, upstream)
      if (redirect.origin === origin && redirect.pathname.split('/')[1] === edition) {
        redirect.host = url.host
        redirect.protocol = url.protocol
        result.headers.set('location', redirect.href)
      }
    }
    result.headers.set('X-Motion-Studies-Edition', edition)
    return result
  },
}
