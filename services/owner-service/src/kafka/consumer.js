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
          // This event is published when a traveler creates a booking
          // Owner Service can use this to:
          // 1. Update owner's dashboard with new pending bookings
          // 2. Send real-time notification to owner
          // 3. Update in-memory cache for faster dashboard loading
          
          console.log(`New booking request received: Booking ${event.bookingId} for property ${event.propertyId}`);
          console.log(`Owner ${event.ownerId} has a new pending booking from traveler ${event.travelerId}`);
          
          // Future enhancements:
          // - Send push notification to owner
          // - Update owner's dashboard cache
          // - Trigger email/SMS notification

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

