import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { expect, test } from 'vitest'
import { useMediaQuery } from './use-media-query.ts'

test('server rendering uses the explicit fallback without accessing a browser', () => {
  function Query({ fallback }: { fallback?: boolean }) {
    return createElement('output', null, String(useMediaQuery('(max-width: 700px)', fallback)))
  }
  expect(renderToString(createElement(Query))).toBe('<output>false</output>')
  expect(renderToString(createElement(Query, { fallback: true }))).toBe('<output>true</output>')
})
