import type { TFacebookWebhookPayload } from '~~/server/utils/facebook/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)

  if (!config.facebookPageAccessToken) {
    throw err.denied('Facebook page access token is not configured')
  }

  const rawBody = await readRawBody(event, 'utf8')
  if (!rawBody) {
    throw err.denied('Missing webhook body')
  }

  verifyFacebookWebhookSignature(
    rawBody,
    getHeader(event, 'x-hub-signature-256'),
    config.facebookAppSecret
  )

  const payload = JSON.parse(rawBody) as TFacebookWebhookPayload
  const results: Array<Record<string, unknown>> = []

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'leadgen' || !change.value?.leadgen_id) {
        continue
      }

      try {
        const result = await processFacebookLeadgen(change.value, config.facebookPageAccessToken)
        results.push({
          leadgenId: String(change.value.leadgen_id),
          ...result
        })
      } catch (error) {
        console.error('[facebook-leads] Failed to process leadgen', change.value.leadgen_id, error)
        results.push({
          leadgenId: String(change.value.leadgen_id),
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
  }

  return {
    success: true,
    processed: results.length,
    results
  }
})
