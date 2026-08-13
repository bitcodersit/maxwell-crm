import type { TFacebookLead } from './types'

const FACEBOOK_GRAPH_VERSION = 'v21.0'

export const fetchFacebookLead = async (
  leadgenId: string | number,
  pageAccessToken: string
): Promise<TFacebookLead> => {
  return $fetch<TFacebookLead>(`https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/${leadgenId}`, {
    query: {
      access_token: pageAccessToken,
      fields: 'created_time,id,ad_id,form_id,field_data'
    }
  })
}
