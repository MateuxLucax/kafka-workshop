import { Kafka } from 'kafkajs'
import type { KafkaMessage } from './types'

const run = async () => {
  const kafka = new Kafka({
    clientId: 'notify-users',
    brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
  })

  const consumer = kafka.consumer({ groupId: 'notify-users' })
  await consumer.connect()
  await consumer.subscribe({ topic: 'payment-approved' })
  await consumer.subscribe({ topic: 'payment-rejected' })

  console.log('notify-users consumer connected')

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { value, headers } = message
      const correlationId = headers ? headers['x-correlation-id'] : null

      const { userId }: KafkaMessage = JSON.parse(value?.toString() ?? '{}')
      console.log(`notifying user ${userId} - correlationId: ${correlationId}`)

      const randomDelay = Math.floor(Math.random() * 2) + 1
      await new Promise(resolve => setTimeout(resolve, randomDelay))

      console.log(`user ${userId} notified - correlationId: ${correlationId}`)
    },
  })
}

run().catch(console.error)
