import { createHmac, timingSafeEqual } from 'node:crypto'

export const verifyFacebookWebhookSignature = (
  rawBody: string,
  signatureHeader: string | undefined,
  appSecret: string
) => {
  if (!appSecret) {
    throw err.denied('Facebook app secret is not configured')
  }

  if (!signatureHeader?.startsWith('sha256=')) {
    throw err.denied('Invalid Facebook webhook signature')
  }

  const expected = createHmac('sha256', appSecret).update(rawBody).digest('hex')
  const received = signatureHeader.slice(7)

  if (expected.length !== received.length) {
    throw err.denied('Invalid Facebook webhook signature')
  }

  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(received))) {
    throw err.denied('Invalid Facebook webhook signature')
  }
}
