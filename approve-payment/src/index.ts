import { Kafka } from 'kafkajs'
import type { KafkaMessage } from './types'

const kafka = new Kafka({
  clientId: 'approve-payment',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
})

const consumer = kafka.consumer({ groupId: 'approve-payment' })
const producer = kafka.producer()

const sendMessage = async (topic: string, message: {}, correlationId: string) => {
  await producer.send({
    topic,
    messages: [
      {
        value: JSON.stringify(message),
        headers: {
          'x-correlation-id': correlationId,
        },
      }
    ],
  })
}

const run = async () => {
  await consumer.connect()
  await consumer.subscribe({ topic: 'approve-payment' })

  console.log('approve-payment consumer connected')

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { value, headers } = message
      const correlationId = headers ? headers['x-correlation-id'] : null

      const { userId, purchaseId }: KafkaMessage = JSON.parse(value?.toString() ?? '{}')
      console.log(`initiating payment approval - correlationId: ${correlationId} - userId: ${userId}`)

      const randomDelay = Math.floor(Math.random() * 6) + 1
      await new Promise(resolve => setTimeout(resolve, randomDelay))

      const randomBool = Math.random() >= 0.5

      if (randomBool) {
        console.log(`payment rejected - correlationId: ${correlationId}`)
        await sendMessage('payment-rejected', { userId }, purchaseId)
      } else {
        console.log(`payment approved - correlationId: ${correlationId}`)
        await sendMessage('payment-approved', { userId }, purchaseId)
      }
    },
  })
}

run().catch(console.error)
