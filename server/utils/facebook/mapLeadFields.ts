import type { TFacebookLead, TMapFacebookLeadResult } from './types'

const CUSTOMER_FIELD_NAMES = new Set([
  'full_name',
  'first_name',
  'last_name',
  'email',
  'phone_number',
  'phone'
])

const ADDRESS_FIELD_NAMES = new Set([
  'street_address',
  'city',
  'state',
  'zip_code',
  'post_code',
  'country'
])

const getFieldValue = (fields: TFacebookLead['field_data'], name: string) => {
  const field = fields?.find(item => item.name === name)
  return field?.values?.[0]?.trim() || undefined
}

export const mapFacebookLeadFields = (lead: TFacebookLead): TMapFacebookLeadResult => {
  const fieldData = lead.field_data ?? []
  const customer: TMapFacebookLeadResult['customer'] = {}
  const addressParts: Record<string, string> = {}
  const extraFields: TMapFacebookLeadResult['extraFields'] = []

  const fullName = getFieldValue(fieldData, 'full_name')
  const firstName = getFieldValue(fieldData, 'first_name')
  const lastName = getFieldValue(fieldData, 'last_name')

  if (fullName) {
    customer.name = fullName
  } else if (firstName || lastName) {
    customer.name = [firstName, lastName].filter(Boolean).join(' ').trim()
  }

  customer.email = getFieldValue(fieldData, 'email')
  customer.phone = getFieldValue(fieldData, 'phone_number') ?? getFieldValue(fieldData, 'phone')

  for (const field of fieldData) {
    const value = field.values?.[0]?.trim()
    if (!value) continue

    if (CUSTOMER_FIELD_NAMES.has(field.name)) {
      continue
    }

    if (ADDRESS_FIELD_NAMES.has(field.name)) {
      addressParts[field.name] = value
      continue
    }

    extraFields.push({ name: field.name, value })
  }

  let address: TMapFacebookLeadResult['address']
  const streetAddress = addressParts.street_address
  const city = addressParts.city

  if (streetAddress || city) {
    address = {
      addressLine1: streetAddress ?? city!,
      road: addressParts.state ?? '',
      block: addressParts.zip_code ?? addressParts.post_code ?? '',
      name: [city, addressParts.country].filter(Boolean).join(', ') || undefined
    }
  }

  const commentLines = [
    'Imported from Facebook Lead Ads.',
    lead.form_id ? `Form ID: ${lead.form_id}` : undefined,
    lead.ad_id ? `Ad ID: ${lead.ad_id}` : undefined,
    lead.created_time ? `Submitted: ${lead.created_time}` : undefined,
    ...extraFields.map(field => `${field.name}: ${field.value}`)
  ].filter((line): line is string => Boolean(line))

  return {
    customer,
    address,
    extraFields,
    commentLines
  }
}
