const { Kafka } = require('kafkajs');
const Booking = require('../models/Booking');

const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const consumer = kafka.consumer({ groupId: 'booking-service-group' });

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
            // Update booking status in database
            await Booking.findByIdAndUpdate(event.bookingId, {
              status: event.newStatus,
            });
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

