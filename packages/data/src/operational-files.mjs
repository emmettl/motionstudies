import { open, constants } from 'node:fs/promises'

/** Read a bounded regular file without following a final symlink or blocking on a FIFO. */
export async function readOperationalFile(path, limit) {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size > limit) throw new Error('Input must be a bounded regular file')
    const bytes = Buffer.alloc(limit + 1)
    let size = 0
    while (size <= limit) {
      const { bytesRead } = await handle.read(bytes, size, bytes.length - size, null)
      if (!bytesRead) break
      size += bytesRead
    }
    const after = await handle.stat()
    if (size > limit || size !== stat.size || after.size !== stat.size || after.mtimeMs !== stat.mtimeMs) throw new Error('Input changed or exceeds read limit')
    return bytes.subarray(0, size)
  } finally { await handle.close() }
}
