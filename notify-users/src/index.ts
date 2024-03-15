import { Kafka } from 'kafkajs'
import type { KafkaMessage } from './types'

const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092'
console.log(`🦊 Kafka broker: ${kafkaBroker}`)

const kafka = new Kafka({
  clientId: 'notify-users',
  brokers: [kafkaBroker]
})

const consumer = kafka.consumer({ groupId: 'notify-users', allowAutoTopicCreation: false })
await consumer.connect()
await consumer.subscribe({ topics: ['payment-approved', 'payment-rejected', 'invoice-generated'] })
console.log('notify-users consumer connected')

const run = async () => {
  await consumer.run({
    eachMessage: async ({ message }) => {
      const { value, headers } = message
      const correlationId = headers ? headers['x-correlation-id'] : null

      const { userId }: KafkaMessage = JSON.parse(value?.toString() ?? '{}')

      await new Promise(resolve => setTimeout(resolve, 1000 * 1))

      console.log(`[${new Date().toISOString()}] user ${userId} notified - correlationId: ${correlationId}`)
    },
  })
}

run().catch(console.error)

process.on('SIGINT', async () => {
  await consumer.disconnect()
  process.exit(0)
})