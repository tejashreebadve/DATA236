/**
 * Seed demo data WITHOUT altering your schema.
 * Tailored to:
 *   bookings(start_date, end_date, status: PENDING|ACCEPTED|CANCELLED)
 *   favorites(traveler_id, property_id)
 *
 * Run: node scripts/seed_noddl.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const MAP = {
  users: { table: 'users', id: 'id', role: 'role', name: 'name', email: 'email', password: 'password_hash' },
  properties: {
    table: 'properties', id: 'id', owner_id: 'owner_id', name: 'name', type: 'type',
    category: 'category', location: 'location', country: 'country',
    description: 'description', amenities: 'amenities', price: 'price_per_night',
    bedrooms: 'bedrooms', bathrooms: 'bathrooms', max_guests: 'max_guests'
  },
  property_images: { table: 'property_images', id: 'id', property_id: 'property_id', url: 'url' },

  // <-- YOUR schema
  favorites: { table: 'favorites', traveler_id: 'traveler_id', property_id: 'property_id' },

  // <-- YOUR schema
  bookings: {
    table: 'bookings', id: 'id', property_id: 'property_id', traveler_id: 'traveler_id',
    start_date: 'start_date', end_date: 'end_date', guests: 'guests', status: 'status'
  }
};

// REQUIRED columns matching YOUR schema
const REQUIRED = {
  users: ['id','role','name','email','password_hash'],
  properties: ['id','owner_id','name','type','category','location','price_per_night'],
  property_images: ['id','property_id','url'],
  favorites: ['traveler_id','property_id'],                         // <- traveler_id
  bookings: ['id','property_id','traveler_id','start_date','end_date','guests','status'] // <- start/end
};

function dayPlus(days) {
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toISOString().slice(0,10);
}

async function assertSchema(db){
  const [rows] = await db.query(
    `SELECT TABLE_NAME, COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?`,
    [process.env.MYSQL_DATABASE]
  );
  const map = rows.reduce((acc,r)=>{ (acc[r.TABLE_NAME] ||= new Set()).add(r.COLUMN_NAME); return acc; }, {});
  for (const [tbl, cols] of Object.entries(REQUIRED)) {
    if (!map[tbl]) throw new Error(`Missing table: ${tbl}`);
    const missing = cols.filter(c => !map[tbl].has(c));
    if (missing.length) throw new Error(`${tbl} missing columns: ${missing.join(', ')}`);
  }
}

async function main(){
  const db = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });

  await assertSchema(db); // abort safely if incompatible

  // Users (upsert by email)
  const ownerEmail = 'owner@example.com';
  const travEmail  = 'trav@example.com';

  const upsertUser = async (role, name, email, rawPw) => {
    const hash = bcrypt.hashSync(rawPw, 10);
    const sql = `INSERT INTO ${MAP.users.table}
      (${MAP.users.role},${MAP.users.name},${MAP.users.email},${MAP.users.password})
      VALUES (?,?,?,?)
      ON DUPLICATE KEY UPDATE
        ${MAP.users.role}=VALUES(${MAP.users.role}),
        ${MAP.users.name}=VALUES(${MAP.users.name}),
        ${MAP.users.password}=VALUES(${MAP.users.password})`;
    await db.execute(sql, [role, name, email, hash]);
  };

  await upsertUser('OWNER','Olivia Host', ownerEmail, 'owner123');
  await upsertUser('TRAVELER','Tom Traveler', travEmail, 'trav123');

  const [[owner]] = await db.query(
    `SELECT ${MAP.users.id} AS id FROM ${MAP.users.table} WHERE ${MAP.users.email}=?`,
    [ownerEmail]
  );
  const [[trav]] = await db.query(
    `SELECT ${MAP.users.id} AS id FROM ${MAP.users.table} WHERE ${MAP.users.email}=?`,
    [travEmail]
  );

  // Properties (across categories your UI uses)
  const PROPS = [
    { name:'Miami Oceanfront Flat', type:'apartment', category:'beach',   country:'US', location:'Miami, FL',       desc:'Oceanfront balcony.',     amenities:['wifi','ac','pool'],           price:240, beds:2, baths:2, guests:4,
      images:['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1600&auto=format']},
    { name:'San Diego Sunny Cottage', type:'house',   category:'beach',   country:'US', location:'San Diego, CA',   desc:'Cozy cottage.',           amenities:['wifi','parking'],             price:165, beds:2, baths:1, guests:3,
      images:['https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format']},
    { name:'NYC Urban Studio',        type:'studio',  category:'city',    country:'US', location:'New York, NY',    desc:'Modern studio.',          amenities:['wifi','elevator','gym'],      price:230, beds:1, baths:1, guests:2,
      images:['https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1600&auto=format']},
    { name:'Lisbon Alfama View',      type:'apartment',category:'city',   country:'PT', location:'Lisbon, PT',      desc:'Terrace views.',          amenities:['wifi','kitchen'],             price:180, beds:1, baths:1, guests:2,
      images:['https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=1600&auto=format']},
    { name:'Seattle Lake House',      type:'house',   category:'parks',   country:'US', location:'Seattle, WA',     desc:'Lakefront home.',         amenities:['wifi','parking','fireplace'], price:260, beds:3, baths:2, guests:6,
      images:['https://images.unsplash.com/photo-1469796466635-455ede028aca?q=80&w=1600&auto=format']},
    { name:'Barcelona Gothic Flat',   type:'apartment',category:'museums',country:'ES', location:'Barcelona, ES',   desc:'Historic quarter.',        amenities:['wifi','ac'],                  price:210, beds:2, baths:1, guests:3,
      images:['https://images.unsplash.com/photo-1582582621959-48a9afc6b54c?q=80&w=1600&auto=format']},
    { name:'SF Bay View Loft',        type:'apartment',category:'museums',country:'US', location:'San Francisco, CA',desc:'Sunny loft.',             amenities:['wifi','kitchen'],             price:185, beds:1, baths:1, guests:2,
      images:['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format']},
    { name:'Denver Mountain Cabin',   type:'cabin',   category:'hiking', country:'US', location:'Denver, CO',       desc:'Cabin near trails.',       amenities:['wifi','fireplace'],           price:195, beds:2, baths:1, guests:4,
      images:['https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1600&auto=format']},
  ];

  // Insert/Upsert properties and images
  const byCategory = {};
  for (const p of PROPS) {
    const [res] = await db.execute(
      `INSERT INTO ${MAP.properties.table}
       (${MAP.properties.owner_id},${MAP.properties.name},${MAP.properties.type},${MAP.properties.category},
        ${MAP.properties.location},${MAP.properties.country},${MAP.properties.description},${MAP.properties.amenities},
        ${MAP.properties.price},${MAP.properties.bedrooms},${MAP.properties.bathrooms},${MAP.properties.max_guests})
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
         ${MAP.properties.type}=VALUES(${MAP.properties.type}),
         ${MAP.properties.category}=VALUES(${MAP.properties.category}),
         ${MAP.properties.location}=VALUES(${MAP.properties.location}),
         ${MAP.properties.price}=VALUES(${MAP.properties.price})`,
      [owner.id, p.name, p.type, p.category, p.location, p.country, p.desc,
       JSON.stringify(p.amenities), p.price, p.beds, p.baths, p.guests]
    );
    let propId = res.insertId;
    if (!propId) {
      const [[row]] = await db.query(
        `SELECT ${MAP.properties.id} AS id FROM ${MAP.properties.table}
         WHERE ${MAP.properties.owner_id}=? AND ${MAP.properties.name}=? LIMIT 1`,
        [owner.id, p.name]
      );
      propId = row?.id;
    }
    // images
    for (const url of p.images || []) {
      await db.execute(
        `INSERT IGNORE INTO ${MAP.property_images.table}
         (${MAP.property_images.property_id},${MAP.property_images.url}) VALUES (?,?)`,
        [propId, url]
      );
    }
    (byCategory[p.category] ||= []).push(propId);
  }

  // Favorites for traveler (uses traveler_id per your schema)
  const favIds = [byCategory.beach?.[0], byCategory.city?.[0], byCategory.hiking?.[0]].filter(Boolean);
  for (const pid of favIds) {
    await db.execute(
      `INSERT IGNORE INTO ${MAP.favorites.table}
       (${MAP.favorites.traveler_id},${MAP.favorites.property_id}) VALUES (?,?)`,
      [trav.id, pid]
    );
  }

  // Bookings for traveler (uses start_date/end_date and PENDING/ACCEPTED)
  const bookings = [
    { pid: byCategory.city?.[0],   start: dayPlus(7),  end: dayPlus(10), g: 2, status: 'PENDING'  },
    { pid: byCategory.parks?.[0],  start: dayPlus(14), end: dayPlus(18), g: 4, status: 'ACCEPTED' },
  ].filter(b => b.pid);

  for (const b of bookings) {
    // skip if identical exists
    const [[exists]] = await db.query(
      `SELECT ${MAP.bookings.id} AS id FROM ${MAP.bookings.table}
       WHERE ${MAP.bookings.property_id}=? AND ${MAP.bookings.traveler_id}=?
         AND ${MAP.bookings.start_date}=? AND ${MAP.bookings.end_date}=? LIMIT 1`,
      [b.pid, trav.id, b.start, b.end]
    );
    if (exists) continue;

    await db.execute(
      `INSERT INTO ${MAP.bookings.table}
       (${MAP.bookings.property_id},${MAP.bookings.traveler_id},${MAP.bookings.start_date},
        ${MAP.bookings.end_date},${MAP.bookings.guests},${MAP.bookings.status})
       VALUES (?,?,?,?,?,?)`,
      [b.pid, trav.id, b.start, b.end, b.g, b.status]
    );
  }

  console.log('Seed inserted without altering schema.');
  await db.end();
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
