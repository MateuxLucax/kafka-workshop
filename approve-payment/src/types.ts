export type PaymentDetails = {
  type: 'credit' | 'debit' | 'paypal'
  cardNumber: string
  expirationDate: string
  cvv: string
}

export type KafkaMessage = {
  total: number
  userId: number
  purchaseId: string
  paymentDetails: PaymentDetails
}
