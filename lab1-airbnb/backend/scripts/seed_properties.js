require('dotenv').config();
const mysql = require('mysql2/promise');

const PROPS = [
  {
    name: 'Bay View Loft',
    type: 'apartment',
    location: 'San Francisco, CA',
    description: 'Sunny loft with bay views, steps from cafes.',
    amenities: ['wifi','kitchen','self check-in','heating'],
    price: 185, beds: 1, baths: 1, guests: 2,
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format'
    ],
  },
  {
    name: 'Sunny Cottage',
    type: 'house',
    location: 'San Diego, CA',
    description: 'Cozy cottage near the beach with a private patio.',
    amenities: ['wifi','parking','ac','washer'],
    price: 165, beds: 2, baths: 1, guests: 3,
    images: [
      'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format'
    ],
  },
  {
    name: 'Urban Studio',
    type: 'studio',
    location: 'New York, NY',
    description: 'Modern studio in Manhattan, close to subways.',
    amenities: ['wifi','elevator','gym'],
    price: 230, beds: 1, baths: 1, guests: 2,
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1600&auto=format'
    ],
  },
  {
    name: 'Lake House',
    type: 'house',
    location: 'Seattle, WA',
    description: 'Quiet lakefront home with kayaks included.',
    amenities: ['wifi','parking','fireplace'],
    price: 260, beds: 3, baths: 2, guests: 6,
    images: [
      'https://images.unsplash.com/photo-1469796466635-455ede028aca?q=80&w=1600&auto=format'
    ],
  },
  {
    name: 'Desert Retreat',
    type: 'house',
    location: 'Phoenix, AZ',
    description: 'Desert views, pool, and starry nights.',
    amenities: ['pool','wifi','parking'],
    price: 210, beds: 2, baths: 2, guests: 4,
    images: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format'
    ],
  },
  {
    name: 'Mountain Cabin',
    type: 'cabin',
    location: 'Denver, CO',
    description: 'Rustic cabin with modern comforts near trails.',
    amenities: ['wifi','fireplace','kitchen'],
    price: 195, beds: 2, baths: 1, guests: 4,
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1600&auto=format'
    ],
  },
  {
    name: 'Beachfront Flat',
    type: 'apartment',
    location: 'Miami, FL',
    description: 'Oceanfront, balcony, walk to restaurants.',
    amenities: ['wifi','ac','pool'],
    price: 240, beds: 2, baths: 2, guests: 4,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1600&auto=format'
    ],
  },
  {
    name: 'Wine Country Bungalow',
    type: 'house',
    location: 'Napa, CA',
    description: 'Calm bungalow among vineyards.',
    amenities: ['wifi','parking','patio'],
    price: 225, beds: 2, baths: 1, guests: 4,
    images: [
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1600&auto=format'
    ],
  }
];

(async ()=>{
  const db = await mysql.createConnection({
    host: process.env.MYSQL_HOST, user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD, database: process.env.MYSQL_DATABASE
  });

  // get owner id
  const [rows] = await db.execute("SELECT id FROM users WHERE email='owner@example.com' LIMIT 1");
  if (!rows.length) throw new Error('owner@example.com not found. Create the owner user first.');
  const ownerId = rows[0].id;

  for (const p of PROPS) {
    const [res] = await db.execute(
      `INSERT INTO properties
       (owner_id,name,type,location,description,amenities,price_per_night,bedrooms,bathrooms,max_guests,availability)
       VALUES (?,?,?,?,?,?,?,?,?,?,JSON_OBJECT('blocked', JSON_ARRAY()))`,
      [ownerId, p.name, p.type, p.location, p.description, JSON.stringify(p.amenities),
       p.price, p.beds, p.baths, p.guests]
    );
    const propId = res.insertId;
    for (const url of p.images) {
      await db.execute(
        `INSERT INTO property_images(property_id,url) VALUES (?,?)`,
        [propId, url]
      );
    }
  }

  console.log('Seeded properties & images.');
  await db.end();
})();
