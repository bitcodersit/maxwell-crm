export type TLeadDetailData = {
  lead: TLead
  followUps: TPaginated<TFollowUp>
  visits: TPaginated<TVisit>
  comments: TPaginated<TComment>
  attachments: TAttachment[]
  properties: TPaginated<TProperty>
}
