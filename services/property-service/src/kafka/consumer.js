const { Kafka } = require('kafkajs');
const { blockDates, unblockDates } = require('../services/propertyService');

const kafka = new Kafka({
  clientId: 'property-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const consumer = kafka.consumer({ groupId: 'property-service-group' });

const initConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected');

    // Subscribe to booking-status-updates topic
    await consumer.subscribe({ topic: 'booking-status-updates', fromBeginning: false });

    // Consume messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          console.log('Received booking status update event:', event);

          if (event.eventType === 'BOOKING_STATUS_UPDATED') {
            if (event.newStatus === 'accepted') {
              // Block dates when booking is accepted
              await blockDates(event.propertyId, event.startDate, event.endDate);
            } else if (event.newStatus === 'cancelled' && event.oldStatus === 'accepted') {
              // Unblock dates when booking is cancelled (if it was previously accepted)
              await unblockDates(event.propertyId, event.startDate, event.endDate);
            }
          }
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

process.on('SIGTERM', async () => {
  await consumer.disconnect();
});

process.on('SIGINT', async () => {
  await consumer.disconnect();
});

module.exports = {
  consumer,
};

