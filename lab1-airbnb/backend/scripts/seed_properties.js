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
  }
];

(async ()=>{
  const db = await mysql.createConnection({
    host: process.env.MYSQL_HOST, user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD, database: process.env.MYSQL_DATABASE
  });

  const [[owner]] = await db.query("SELECT id FROM users WHERE email='owner@example.com' LIMIT 1");
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
