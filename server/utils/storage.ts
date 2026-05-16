import type { H3Event } from 'h3'
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises'
import { dirname, normalize, resolve } from 'node:path'
import { StorageProvider } from '~~/prisma/client/enums'

export type TStoragePutMeta = {
  mime?: string
}

export type TStorage = {
  provider(): StorageProvider
  put(key: string, data: Buffer, meta?: TStoragePutMeta): Promise<void>
  get(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
}

function safeResolvedPath(rootDir: string, key: string): string {
  const root = resolve(rootDir)
  const full = resolve(root, normalize(key))
  if (!full.startsWith(root)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid storage key'
    })
  }
  return full
}

export class FileSystem implements TStorage {
  constructor(private readonly rootDir: string) {}

  provider(): StorageProvider {
    return StorageProvider.FILESYSTEM
  }

  async put(key: string, data: Buffer): Promise<void> {
    const target = safeResolvedPath(this.rootDir, key)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, data)
  }

  async get(key: string): Promise<Buffer> {
    const target = safeResolvedPath(this.rootDir, key)
    return readFile(target)
  }

  async delete(key: string): Promise<void> {
    try {
      const target = safeResolvedPath(this.rootDir, key)
      await unlink(target)
    } catch (e: unknown) {
      const code = (e as NodeJS.ErrnoException)?.code
      if (code !== 'ENOENT') {
        throw e
      }
    }
  }
}

export class Storage {
  constructor(private readonly storage: TStorage) {}

  put(key: string, data: Buffer, meta?: TStoragePutMeta): Promise<void> {
    return this.storage.put(key, data, meta)
  }

  get(key: string): Promise<Buffer> {
    return this.storage.get(key)
  }

  delete(key: string): Promise<void> {
    return this.storage.delete(key)
  }

  provider(): StorageProvider {
    return this.storage.provider()
  }
}

export function getStorage(event: H3Event, provider: StorageProvider = StorageProvider.FILESYSTEM) {
  if (provider === StorageProvider.FILESYSTEM) {
    const config = useRuntimeConfig(event)
    return new Storage(new FileSystem(config.storageUrl))
  }
  throw createError({
    statusCode: 500,
    message: 'Unsupported storage provider'
  })
}
