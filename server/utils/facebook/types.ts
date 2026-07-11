export type TFacebookWebhookPayload = {
  object?: string
  entry?: TFacebookWebhookEntry[]
}

export type TFacebookWebhookEntry = {
  id?: string | number
  time?: number
  changes?: TFacebookWebhookChange[]
}

export type TFacebookWebhookChange = {
  field?: string
  value?: TFacebookLeadgenValue
}

export type TFacebookLeadgenValue = {
  leadgen_id: string | number
  page_id?: string | number
  form_id?: string | number
  adgroup_id?: string | number
  ad_id?: string | number
  created_time?: number
}

export type TFacebookLeadField = {
  name: string
  values: string[]
}

export type TFacebookLead = {
  id: string
  created_time?: string
  ad_id?: string
  form_id?: string
  field_data?: TFacebookLeadField[]
}

export type TMapFacebookLeadResult = {
  customer: {
    name?: string
    email?: string
    phone?: string
  }
  address?: {
    name?: string
    addressLine1: string
    road?: string
    block?: string
  }
  extraFields: Array<{ name: string, value: string }>
  commentLines: string[]
}
