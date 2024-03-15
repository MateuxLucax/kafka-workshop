import { CompressionTypes, Kafka, logLevel } from 'kafkajs'
import type { KafkaMessage } from './types'

const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092'
console.log(`🦊 Kafka broker: ${kafkaBroker}`)
const kafka = new Kafka({
  clientId: 'approve-payment',
  brokers: [kafkaBroker]
})

const consumer = kafka.consumer({ groupId: 'approve-payment', allowAutoTopicCreation: false  })
await consumer.connect()

const producer = kafka.producer({ idempotent: true, transactionalId: 'approve-payment', allowAutoTopicCreation: false })
await producer.connect()

const sendMessage = async (topic: string, message: {}, correlationId: string) => {
  const transaction = await producer.transaction()

  try {
    await transaction.send({
      topic,
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

const run = async () => {
  await consumer.subscribe({ topic: 'approve-payment' })

  console.log('approve-payment consumer connected')

  await consumer.run({    
    eachMessage: async ({ message }) => {
      const { value, headers } = message
      const correlationId = headers ? headers['x-correlation-id'] : null

      const { userId, purchaseId }: KafkaMessage = JSON.parse(value?.toString() ?? '{}')

      await new Promise(resolve => setTimeout(resolve, 1000 * 10))

      const randomBool = Math.random() >= 0.5
      if (randomBool) {
        await sendMessage('payment-rejected', { userId }, purchaseId)
        console.log(`[${new Date().toISOString()}] payment rejected - correlationId: ${correlationId}`)
      } else {
        await sendMessage('payment-approved', { userId }, purchaseId)
        console.log(`[${new Date().toISOString()}] payment approved - correlationId: ${correlationId}`)
      }
    },
  })
}

run().catch(console.error)

process.on('SIGINT', async () => {
  await consumer.disconnect()
  await producer.disconnect()
  process.exit(0)
})