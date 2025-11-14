const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'owner-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const producer = kafka.producer();

// Initialize producer on module load
const initProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka producer connected');
  } catch (error) {
    console.error('Error connecting Kafka producer:', error);
  }
};

initProducer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await producer.disconnect();
});

process.on('SIGINT', async () => {
  await producer.disconnect();
});

module.exports = {
  kafkaProducer: producer,
};

