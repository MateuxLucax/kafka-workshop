import { Elysia } from 'elysia'
import { CompressionTypes, ITopicConfig, Kafka } from 'kafkajs'
import { v4 as uuidv4 } from 'uuid'
import { PurchasePayload } from './types'

const app = new Elysia()

const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092'
console.log(`🦊 Kafka broker: ${kafkaBroker}`)

const kafka = new Kafka({
  clientId: 'e-commerce-api',
  brokers: [kafkaBroker], 
})

const producer = kafka.producer({ idempotent: true, transactionalId: 'e-commerce-api', allowAutoTopicCreation: false })
await producer.connect()

const sendMessage = async (message: {}, correlationId: string) => {
  const transaction = await producer.transaction()

  try {
    await transaction.send({
      topic: 'approve-payment',
      compression: CompressionTypes.GZIP,
      messages: [
        {
          key: correlationId,
          value: JSON.stringify(message),
          headers: {
            'x-correlation-id': correlationId,
          },
        }
      ],
    })

    await transaction.commit()
  } catch (e) {
    console.error(e)
    await transaction.abort()
  }
}

app.post('/purchase', async ({ body, set }) => {
  const { products, userId, paymentDetails } = body as PurchasePayload

  const total = products.reduce((acc, product) => acc + product.price * product.quantity, 0)
  const purchaseId = uuidv4()

  await sendMessage({ total, userId, purchaseId, paymentDetails }, purchaseId)

  console.log(`[${new Date().toISOString()}] purchase request for user ${userId} - purchaseId: ${purchaseId}`)

  set.status = 202
  return { total, userId }
})

app.post('/purchase/sync', async ({ body, set }) => {
  const { products, userId } = body as PurchasePayload

  const total = products.reduce((acc, product) => acc + product.price * product.quantity, 0)
  const correlationId = uuidv4()

  console.log(`[${new Date().toISOString()}] purchase request for user ${userId} - purchaseId: ${correlationId}`)

  await new Promise(resolve => setTimeout(resolve, 1000 * 10))

  const randomBool = Math.random() >= 0.5

  if (randomBool) {
    console.log(`[${new Date().toISOString()}] payment rejected - correlationId: ${correlationId}`)
    set.status = 400
    return { total, userId }
  }

  console.log(`[${new Date().toISOString()}] payment approved - correlationId: ${correlationId}`)

  await new Promise(resolve => setTimeout(resolve, 1000 * 15))

  console.log(`[${new Date().toISOString()}] invoice generated for user ${userId} - correlationId: ${correlationId}`)

  set.status = 200
  return { total, userId }
})

app.listen(process.env.PORT || 3000)

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

process.on('SIGINT', async () => {
  await producer.disconnect()
  process.exit(0)
})