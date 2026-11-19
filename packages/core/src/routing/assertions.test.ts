// Node's strict `assert` calls used by the ported PFAD tests, on vitest's `expect`, so the tests
// declare no dependency beyond vitest.
import { expect, test } from 'vitest'

const assert = {
  ok: (value: unknown, message?: string) => expect(value, message).toBeTruthy(),
  equal: (actual: unknown, expected: unknown, message?: string) => expect(actual, message).toBe(expected),
  notEqual: (actual: unknown, expected: unknown, message?: string) => expect(actual, message).not.toBe(expected),
  deepEqual: (actual: unknown, expected: unknown, message?: string) => expect(actual, message).toStrictEqual(expected),
  throws: (fn: () => unknown, pattern?: RegExp) => (pattern ? expect(fn).toThrow(pattern) : expect(fn).toThrow()),
}
export default assert

test('the assertion shim is strict about types and structure', () => {
  assert.equal(1, 1)
  assert.throws(() => assert.equal(1, '1'))
  assert.throws(() => assert.deepEqual([1], ['1']))
  assert.throws(() => assert.ok(0))
})
