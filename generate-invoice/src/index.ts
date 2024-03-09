import { Kafka } from 'kafkajs'
import type { KafkaMessage } from './types'

const run = async () => {
  const kafka = new Kafka({
    clientId: 'generate-invoice',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  })

  const consumer = kafka.consumer({ groupId: 'generate-invoice' })
  await consumer.connect()
  await consumer.subscribe({ topic: 'payment-approved' })

  console.log('generate-invoice consumer connected')

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { value, headers } = message
      const correlationId = headers ? headers['x-correlation-id'] : null

      const { userId }: KafkaMessage = JSON.parse(value?.toString() ?? '{}')
      console.log(`initiating invoice - correlationId: ${correlationId} - userId: ${userId}`)

      const randomDelay = Math.floor(Math.random() * 3) + 1
      await new Promise(resolve => setTimeout(resolve, randomDelay))

      console.log(`invoice generated for user ${userId} - correlationId: ${correlationId}`)
    },
  })
}

run().catch(console.error)
