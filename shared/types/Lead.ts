export type TLeadStatus = 'Hot' | 'Warm' | 'Cold' | 'Not Interested' | 'Closed'

export type TLeadSource = 'Facebook' | 'Website' | 'Phone' | 'Referral' | 'Walk-in'

export type TPropertyTypeMain = 'Land' | 'Land Share' | 'Commercial Plot'

export type TPropertyTypeSub = 'Ready' | 'Ongoing' | 'Installment'

export type TLead = {
  id: number
  serialCode: string
  source: TLeadSource
  customerName: string
  phone: string
  area: string | null
  propertyTypeMain: TPropertyTypeMain
  propertyTypeSub: TPropertyTypeSub
  block: string | null
  road: string | null
  budgetRange: string | null
  status: TLeadStatus
  assignedSalesman: string | null
  followUpDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}
