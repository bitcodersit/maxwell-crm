import crypto from 'crypto'

export function generateSid() {
  return crypto.randomUUID()
}
