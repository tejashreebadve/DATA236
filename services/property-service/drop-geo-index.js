/**
 * Script to drop the 2dsphere index from the properties collection
 * Run this once to remove the existing geospatial index
 * 
 * Usage: node drop-geo-index.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://dygandole_db_user:dygandole_db_pass@rednest.yv8hxk8.mongodb.net/rednest?appName=Rednest&retryWrites=true&w=majority';

async function dropGeoIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('properties');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Find and drop the 2dsphere index
    const geoIndex = indexes.find(index => 
      index.key && index.key['location.coordinates'] === '2dsphere'
    );

    if (geoIndex) {
      console.log('Found 2dsphere index:', geoIndex.name);
      await collection.dropIndex(geoIndex.name);
      console.log('Successfully dropped 2dsphere index');
    } else {
      console.log('No 2dsphere index found');
    }

    // Show updated indexes
    const updatedIndexes = await collection.indexes();
    console.log('Updated indexes:', updatedIndexes);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error dropping index:', error);
    process.exit(1);
  }
}

dropGeoIndex();

