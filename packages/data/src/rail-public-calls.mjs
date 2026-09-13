import {parseRailXml, xmlContent, xmlAttribute, xmlText} from './rail-xml.mjs'

const descendants = (nodes, name) => nodes.flatMap(node => Object.entries(node).flatMap(([key, value]) => key === ':@' ? [] : [...(key.split(':').at(-1) === name ? [node] : []), ...(Array.isArray(value) ? descendants(value, name) : [])]))

/** Read pdftotext bbox words. Page/calendar acceptance and station names belong to the caller. */
export function publicTimetablePages(bytes) {
  // pdftotext emits a fixed XHTML declaration. It is metadata, never fetched or expanded.
  const text = Buffer.from(bytes).toString('utf8').replace(/<!DOCTYPE html PUBLIC "-\/\/W3C\/\/DTD XHTML 1\.0 Transitional\/\/EN"\s+"http:\/\/www\.w3\.org\/TR\/xhtml1\/DTD\/xhtml1-transitional\.dtd">/, '')
  return descendants(parseRailXml(Buffer.from(text)), 'page').map((page, index) => {
    const rows = []
    const words = descendants(xmlContent(page), 'word').map(word => ({ y: Number(xmlAttribute(word, 'yMin')), a: Number(xmlAttribute(word, 'xMin')), b: Number(xmlAttribute(word, 'xMax')), text: xmlText(xmlContent(word)) }))
    if (words.some(w => ![w.y, w.a, w.b].every(Number.isFinite))) throw new Error('Invalid public timetable word bounds')
    for (const word of words.sort((a, b) => a.y - b.y)) {
      if (!rows.length || Math.abs(rows.at(-1)[0] - word.y) > .8) rows.push([word.y, []])
      rows.at(-1)[1].push([word.a, word.b, word.text])
    }
    for (const [, words] of rows) words.sort((a, b) => a[0] - b[0] || a[1] - b[1] || (a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0))
    return { page: index + 1, rows, text: rows.flatMap(([, words]) => words.map(w => w[2])).join(' ') }
  })
}

export function publicTimetableColumns(pages, {table, target, operator, acceptPage, resolveCode}) {
  const records = []
  for (const page of pages) {
    if (!acceptPage(page)) continue
    const {rows} = page, starts = rows.flatMap(([, words], i) => words.some(w => w[2] === 'Operator') ? [i] : [])
    for (let bank = 0; bank < starts.length; bank++) {
      const start = starts[bank], end = starts[bank + 1] ?? rows.length, header = rows[start][1], word = header.find(w => w[2] === 'Operator')
      const columns = header.filter(w => w[0] > word[1] && w[2] !== 'Operator').map(w => (w[0] + w[1]) / 2)
      if (!columns.length) continue
      const calls = columns.map(() => [])
      for (const [, words] of rows.slice(start + 1, end)) {
        const name = words.filter(w => w[1] < columns[0] - 5).map(w => w[2]).join(' '), code = resolveCode(name)
        if (!code) continue
        const kind = name.trimEnd().endsWith('a') ? 'arrival' : 'departure'
        for (const [a, b, word] of words) {
          const time = /^(\d{2})(\d{2})([a-z]?)$/.exec(word)
          if (!time || +time[1] > 23 || +time[2] > 59) continue
          const middle = (a + b) / 2, column = columns.reduce((best, x, i) => Math.abs(x - middle) < Math.abs(columns[best] - middle) ? i : best, 0)
          if (Math.abs(columns[column] - middle) > 5) continue
          calls[column].push({code, time: +time[1] * 3600 + +time[2] * 60, kind: time[3] === 'a' ? 'arrival' : kind})
        }
      }
      calls.forEach((values, i) => { for (const call of values) if (call.code === target) records.push({...call, operator, anchors: values.filter(v => v.code !== target), table, page: page.page, column: i + 1}) })
    }
  }
  return records
}
