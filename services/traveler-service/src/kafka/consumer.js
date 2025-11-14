const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'traveler-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const consumer = kafka.consumer({ groupId: 'traveler-service-group' });

const initConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected (traveler-service)');

    // Subscribe to booking-status-updates topic
    await consumer.subscribe({ topic: 'booking-status-updates', fromBeginning: false });

    // Consume messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          console.log('Received booking status update event:', event);

          if (event.eventType === 'BOOKING_STATUS_UPDATED') {
            // Handle booking status update for traveler
            // In a real implementation, you might:
            // 1. Update traveler's booking cache
            // 2. Send notification to traveler
            // 3. Update UI if traveler is viewing bookings
            
            console.log(`Booking ${event.bookingId} status updated to ${event.newStatus} for traveler ${event.travelerId}`);
            
            // Future: Could emit WebSocket event or update in-memory cache
            // For now, we just log it as the booking data is fetched on-demand via API
          }
        } catch (error) {
          console.error('Error processing booking status update message:', error);
          // In production, you might want to:
          // 1. Send to dead letter queue
          // 2. Retry with exponential backoff
          // 3. Alert monitoring system
        }
      },
    });
  } catch (error) {
    console.error('Error initializing Kafka consumer:', error);
    // Retry connection after delay
    setTimeout(() => {
      initConsumer();
    }, 5000);
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

