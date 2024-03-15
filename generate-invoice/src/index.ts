import { CompressionTypes, Kafka } from 'kafkajs'
import type { KafkaMessage } from './types'

const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092'
console.log(`🦊 Kafka broker: ${kafkaBroker}`)

const kafka = new Kafka({
  clientId: 'generate-invoice',
  brokers: [kafkaBroker]
})

const consumer = kafka.consumer({ groupId: 'generate-invoice', allowAutoTopicCreation: true })
await consumer.connect()
await consumer.subscribe({ topic: 'payment-approved' })

const producer = kafka.producer({ idempotent: true, transactionalId: 'generate-invoice', allowAutoTopicCreation: false })
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

console.log('generate-invoice consumer connected')

const run = async () => {
  await consumer.run({
    eachMessage: async ({ message }) => {
      const { value, headers } = message
      const correlationId = headers ? headers['x-correlation-id'] : null

      const { userId }: KafkaMessage = JSON.parse(value?.toString() ?? '{}')

      await new Promise(resolve => setTimeout(resolve, 1000 * 15))

      await sendMessage('invoice-generated', { userId }, correlationId as string)

      console.log(`[${new Date().toISOString()}] invoice generated for user ${userId} - correlationId: ${correlationId}`)
    },
  })
}

run().catch(console.error)

process.on('SIGINT', async () => {
  await consumer.disconnect()
  process.exit(0)
})