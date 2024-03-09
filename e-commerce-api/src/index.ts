import { Elysia } from 'elysia'
import { Kafka } from 'kafkajs'
import { v4 as uuidv4 } from 'uuid'
import { PurchasePayload } from './types'

const app = new Elysia()

const kafka = new Kafka({
  clientId: 'e-commerce-api',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
})

const producer = kafka.producer()
await producer.connect()

app.post('/purchase', async ({ body, set }) => {
  const { products, userId, paymentDetails } = body as PurchasePayload

  const total = products.reduce((acc, product) => acc + product.price * product.quantity, 0)
  const purchaseId = uuidv4()

  const randomDelay = Math.floor(Math.random() * 5) + 1
  await new Promise(resolve => setTimeout(resolve, randomDelay))
  console.log(`purchase [${purchaseId}] - total: ${total} - user: ${userId}`)

  await producer.send({
    topic: 'approve-payment',
    messages: [
      {
        value: JSON.stringify({ total, userId, purchaseId, paymentDetails }),
        headers: {
          'x-correlation-id': purchaseId,
        }
      }
    ],
  })

  set.status = 202
  return { total, userId }
})

app.listen(process.env.PORT || 3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

app.onStop(async () => {
  await producer.disconnect()
})