const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Drop the 2dsphere index if it exists (to fix "Can't extract geo keys" error)
    // This index is not needed if coordinates are optional
    try {
      const db = mongoose.connection.db;
      const collection = db.collection('properties');
      const indexes = await collection.indexes();
      
      // Find and drop the 2dsphere index
      const geoIndex = indexes.find(index => 
        index.key && index.key['location.coordinates'] === '2dsphere'
      );
      
      if (geoIndex) {
        console.log('Dropping existing 2dsphere index on location.coordinates...');
        await collection.dropIndex(geoIndex.name);
        console.log('Successfully dropped 2dsphere index');
      }
    } catch (indexError) {
      // If index doesn't exist or can't be dropped, that's okay
      console.log('2dsphere index not found or already removed');
    }
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

module.exports = connectDB;

