const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

const producer = kafka.producer();

const initProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka producer connected');
  } catch (error) {
    console.error('Error connecting Kafka producer:', error);
  }
};

initProducer();

process.on('SIGTERM', async () => {
  await producer.disconnect();
});

process.on('SIGINT', async () => {
  await producer.disconnect();
});

module.exports = {
  kafkaProducer: producer,
};

