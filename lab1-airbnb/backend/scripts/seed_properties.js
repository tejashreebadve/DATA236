require('dotenv').config();
const mysql = require('mysql2/promise');

const PROPS = [
  // category: beach | city | parks | museums | hiking
  { name:'Miami Oceanfront Flat',  type:'apartment', category:'beach',  country:'US', location:'Miami, FL',
    description:'Oceanfront balcony, steps to sand.', amenities:['wifi','ac','pool'],
    price:240, beds:2, baths:2, guests:4,
    images:['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1600&auto=format']
  },
  { name:'San Diego Sunny Cottage', type:'house', category:'beach', country:'US', location:'San Diego, CA',
    description:'Cozy cottage near boardwalk.', amenities:['wifi','parking','washer'],
    price:165, beds:2, baths:1, guests:3,
    images:['https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format']
  },
  { name:'NYC Urban Studio', type:'studio', category:'city', country:'US', location:'New York, NY',
    description:'Modern studio close to subways.', amenities:['wifi','elevator','gym'],
    price:230, beds:1, baths:1, guests:2,
    images:['https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1600&auto=format']
  },
  { name:'SF Bay View Loft', type:'apartment', category:'museums', country:'US', location:'San Francisco, CA',
    description:'Sunny loft with bay views.', amenities:['wifi','kitchen','heating'],
    price:185, beds:1, baths:1, guests:2,
    images:['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format']
  },
  { name:'Seattle Lake House', type:'house', category:'parks', country:'US', location:'Seattle, WA',
    description:'Quiet lakefront home with kayaks.', amenities:['wifi','parking','fireplace'],
    price:260, beds:3, baths:2, guests:6,
    images:['https://images.unsplash.com/photo-1469796466635-455ede028aca?q=80&w=1600&auto=format']
  },
  { name:'Denver Mountain Cabin', type:'cabin', category:'hiking', country:'US', location:'Denver, CO',
    description:'Rustic cabin near trails.', amenities:['wifi','fireplace','kitchen'],
    price:195, beds:2, baths:1, guests:4,
    images:['https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1600&auto=format']
  },
  { name:'Barcelona Gothic Flat', type:'apartment', category:'museums', country:'ES', location:'Barcelona, Spain',
    description:'Historic quarter walk-up close to Gaudí.', amenities:['wifi','ac','balcony'],
    price:210, beds:2, baths:1, guests:3,
    images:['https://images.unsplash.com/photo-1582582621959-48a9afc6b54c?q=80&w=1600&auto=format']
  },
  { name:'Lisbon Alfama View', type:'apartment', category:'city', country:'PT', location:'Lisbon, Portugal',
    description:'Terrace with river views.', amenities:['wifi','kitchen','washer'],
    price:180, beds:1, baths:1, guests:2,
    images:['https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=1600&auto=format']
  },
  {
    name: 'Paris Montmartre Loft',
    type: 'apartment',
    category: 'city',
    country: 'FR',
    location: 'Paris, France',
    description: 'Cozy loft near Sacré-Cœur with exposed beams.',
    amenities: ['wifi', 'kitchen', 'coffee maker'],
    price: 220,
    beds: 1,
    baths: 1,
    guests: 2,
    images: ['https://images.unsplash.com/photo-1505691723518-36a5ac3b4b91?q=80&w=1600&auto=format']
  },
  {
    name: 'NYC Park Studio',
    type: 'apartment',
    category: 'city',
    country: 'US',
    location: 'New York, USA',
    description: 'Modern studio overlooking Central Park.',
    amenities: ['wifi', 'tv', 'elevator'],
    price: 260,
    beds: 1,
    baths: 1,
    guests: 2,
    images: ['https://images.unsplash.com/photo-1502673530728-f79b4cab31b1?q=80&w=1600&auto=format']
  },
  {
    name: 'Tokyo Shinjuku Tower',
    type: 'apartment',
    category: 'city',
    country: 'JP',
    location: 'Tokyo, Japan',
    description: 'High-rise apartment with skyline views.',
    amenities: ['wifi', 'washer', 'ac'],
    price: 210,
    beds: 1,
    baths: 1,
    guests: 2,
    images: ['https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1600&auto=format']
  },
  {
    name: 'Cape Town Beachfront Villa',
    type: 'villa',
    category: 'beachfront',
    country: 'ZA',
    location: 'Cape Town, South Africa',
    description: 'Luxury villa with infinity pool facing the ocean.',
    amenities: ['pool', 'wifi', 'kitchen', 'parking'],
    price: 480,
    beds: 3,
    baths: 3,
    guests: 6,
    images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format']
  },
  {
    name: 'Rome Trastevere Terrace',
    type: 'apartment',
    category: 'city',
    country: 'IT',
    location: 'Rome, Italy',
    description: 'Charming flat with rooftop terrace and city views.',
    amenities: ['wifi', 'kitchen', 'ac'],
    price: 190,
    beds: 2,
    baths: 1,
    guests: 4,
    images: ['https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=1600&auto=format']
  },
  {
    name: 'Amsterdam Canal House',
    type: 'townhouse',
    category: 'city',
    country: 'NL',
    location: 'Amsterdam, Netherlands',
    description: 'Renovated canal house with vintage decor.',
    amenities: ['wifi', 'bike rental', 'washer'],
    price: 230,
    beds: 2,
    baths: 1,
    guests: 4,
    images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1600&auto=format']
  },
  {
    name: 'Sydney Bondi Bay Apartment',
    type: 'apartment',
    category: 'beachfront',
    country: 'AU',
    location: 'Sydney, Australia',
    description: 'Bright apartment near Bondi Beach with ocean view.',
    amenities: ['wifi', 'balcony', 'parking'],
    price: 270,
    beds: 2,
    baths: 2,
    guests: 4,
    images: ['https://images.unsplash.com/photo-1521747116042-5a810fda9664?q=80&w=1600&auto=format']
  },
  {
    name: 'Vancouver Mountain Retreat',
    type: 'cabin',
    category: 'hiking',
    country: 'CA',
    location: 'Vancouver, Canada',
    description: 'Secluded cabin near Grouse Mountain trails.',
    amenities: ['fireplace', 'wifi', 'kitchen'],
    price: 240,
    beds: 2,
    baths: 1,
    guests: 4,
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600&auto=format']
  },
  {
    name: 'Rio Copacabana View',
    type: 'apartment',
    category: 'beachfront',
    country: 'BR',
    location: 'Rio de Janeiro, Brazil',
    description: 'Beachfront flat with panoramic ocean views.',
    amenities: ['wifi', 'ac', 'balcony'],
    price: 210,
    beds: 2,
    baths: 1,
    guests: 4,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format']
  },
  {
    name: 'Istanbul Bosphorus Penthouse',
    type: 'apartment',
    category: 'city',
    country: 'TR',
    location: 'Istanbul, Turkey',
    description: 'Elegant penthouse with a terrace overlooking the Bosphorus.',
    amenities: ['wifi', 'ac', 'terrace'],
    price: 250,
    beds: 2,
    baths: 2,
    guests: 4,
    images: ['https://images.unsplash.com/photo-1542038784456-1ea8e935640e?q=80&w=1600&auto=format']
  },
  {
    name: 'Dubai Marina Sky Suite',
    type: 'apartment',
    category: 'city',
    country: 'AE',
    location: 'Dubai, UAE',
    description: 'Modern suite with panoramic marina view and pool access.',
    amenities: ['pool', 'gym', 'wifi'],
    price: 300,
    beds: 2,
    baths: 2,
    guests: 4,
    images: ['https://images.unsplash.com/photo-1505761671935-60b3a7427bad?q=80&w=1600&auto=format']
  },
  {
    name: 'Vienna Opera District Flat',
    type: 'apartment',
    category: 'city',
    country: 'AT',
    location: 'Vienna, Austria',
    description: 'Elegant flat near the Vienna State Opera.',
    amenities: ['wifi', 'washer', 'coffee maker'],
    price: 200,
    beds: 1,
    baths: 1,
    guests: 2,
    images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format']
  },
  {
    name: 'San Francisco Bayview Home',
    type: 'house',
    category: 'city',
    country: 'US',
    location: 'San Francisco, USA',
    description: 'Stylish home with view of Golden Gate Bridge.',
    amenities: ['wifi', 'parking', 'garden'],
    price: 310,
    beds: 3,
    baths: 2,
    guests: 6,
    images: ['https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1600&auto=format']
  },
  {
    name: 'Prague Old Town Residence',
    type: 'apartment',
    category: 'city',
    country: 'CZ',
    location: 'Prague, Czech Republic',
    description: 'Historic residence near Charles Bridge with antique charm.',
    amenities: ['wifi', 'kitchen', 'heating'],
    price: 180,
    beds: 1,
    baths: 1,
    guests: 2,
    images: ['https://images.unsplash.com/photo-1560347876-aeef00ee58a1?q=80&w=1600&auto=format']
  },
  {
    name: 'Reykjavik Northern Lights Cabin',
    type: 'cabin',
    category: 'parks',
    country: 'IS',
    location: 'Reykjavik, Iceland',
    description: 'Glass-roof cabin ideal for viewing Northern Lights.',
    amenities: ['wifi', 'hot tub', 'fireplace'],
    price: 350,
    beds: 2,
    baths: 1,
    guests: 4,
    images: ['https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format']
  }
];

(async ()=>{
  const db = await mysql.createConnection({
    host: process.env.MYSQL_HOST, user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD, database: process.env.MYSQL_DATABASE
  });

  const [[owner]] = await db.query("SELECT id FROM users WHERE email='djt@gmail.com' LIMIT 1");
  if (!owner) throw new Error('Seed users first (owner@example.com).');

  for (const p of PROPS) {
    const [res] = await db.execute(
      `INSERT INTO properties
       (owner_id,name,type,category,location,country,description,amenities,price_per_night,bedrooms,bathrooms,max_guests,availability)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,JSON_OBJECT('blocked', JSON_ARRAY()))`,
      [owner.id, p.name, p.type, p.category, p.location, p.country, p.description, JSON.stringify(p.amenities),
       p.price, p.beds, p.baths, p.guests]
    );
    const id = res.insertId;
    for (const url of p.images) {
      await db.execute(`INSERT INTO property_images(property_id,url) VALUES(?,?)`, [id, url]);
    }
  }
  console.log('Seeded popular properties with country+category.');
  await db.end();
})();
