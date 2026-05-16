export type TPropertyStatus = 'Available' | 'Hold' | 'Sold'

export type TPurchaseType =
  | 'Contracted for sale'
  | 'Power Registration'
  | 'Sab Kobla'
  | 'Ongoing'

export type TProperty = {
  id: number
  serialCode: string
  title: string
  project: string
  area: string
  block: string
  road: string
  face: string
  katha: number
  sqft: number
  currentPrice: number
  previousPrice: number | null
  installment: boolean
  status: TPropertyStatus
  purchaseType: TPurchaseType
  manager: string
  createdAt: string
  updatedAt: string
}
