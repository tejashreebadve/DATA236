const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'owner-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const consumer = kafka.consumer({ groupId: 'owner-service-group' });

const initConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected');

    // Subscribe to booking-requests topic
    await consumer.subscribe({ topic: 'booking-requests', fromBeginning: false });

    // Consume messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          console.log('Received booking request event:', event);

          // Handle booking request event
          // In a real implementation, you might want to notify the owner
          // or update some internal state
          // For now, we just log it

        } catch (error) {
          console.error('Error processing message:', error);
        }
      },
    });
  } catch (error) {
    console.error('Error initializing Kafka consumer:', error);
  }
};

initConsumer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await consumer.disconnect();
});

process.on('SIGINT', async () => {
  await consumer.disconnect();
});

module.exports = {
  consumer,
};

