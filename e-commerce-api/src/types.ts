export type Product = {
  id: number
  name: string
  price: number
  quantity: number
}

export type PaymentDetails = {
  type: 'credit' | 'debit' | 'paypal'
  cardNumber: string
  expirationDate: string
  cvv: string
}

export type PurchasePayload = {
  products: Product[]
  userId: number
  paymentDetails: PaymentDetails
}
