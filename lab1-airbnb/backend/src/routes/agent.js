const express = require('express');
const axios = require('axios');
const pool = require('../db'); // ← use the same pool your app already uses

const router = express.Router();
const AGENT_BASE = process.env.AGENT_BASE || 'http://localhost:9000';
console.log('[agent.js] Using AGENT_BASE =', AGENT_BASE);

// Helper: try two likely schemas (start_date/end_date) then (start/end)
async function fetchUpcomingBookings(pool, userId) {
  const params = [userId];
  try {
    const [rows] = await pool.query(
      `
      SELECT b.id,
             COALESCE(p.location, CONCAT_WS(', ', p.city, p.state, p.country)) AS location,
             b.start_date AS start,
             b.end_date   AS end,
             b.guests
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      WHERE b.traveler_id = ?
        AND b.status IN ('PENDING','ACCEPTED','CONFIRMED')
        AND DATE(b.start_date) >= CURDATE()
      ORDER BY b.start_date ASC
      LIMIT 50
      `,
      params
    );
    return rows;
  } catch (e) {
    // Fallback to alt column names if first query failed with bad field error
    if (e && e.code === 'ER_BAD_FIELD_ERROR') {
      const [rows2] = await pool.query(
        `
        SELECT b.id,
               COALESCE(p.location, CONCAT_WS(', ', p.city, p.state, p.country)) AS location,
               b.start AS start,
               b.end   AS end,
               b.guests
        FROM bookings b
        JOIN properties p ON p.id = b.property_id
        WHERE b.traveler_id = ?
          AND b.status IN ('PENDING','ACCEPTED','CONFIRMED')
          AND DATE(b.start) >= CURDATE()
        ORDER BY b.start ASC
        LIMIT 50
        `,
        params
      );
      return rows2;
    }
    throw e;
  }
}

// ✅ Use backend’s DB to return the upcoming trips
router.get('/bookings', async (req, res) => {
  try {
    if (!req.session || !req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: 'NotAuthenticated' });
    }
    const userId = req.session.user.id;
    const bookings = await fetchUpcomingBookings(pool, userId);
    return res.json({ bookings });
  } catch (e) {
    console.error('Agent /bookings error:', e);
    return res.status(500).json({ error: 'DBError', detail: e.message || 'Unknown error' });
  }
});

// ✅ Anonymous/general chat (unchanged)
router.post('/chat', async (req, res) => {
  try {
    const { data } = await axios.post(`${AGENT_BASE}/ai/chat`, req.body);
    res.json(data);
  } catch (e) {
    console.error('Agent /chat error:', e.message);
    res.status(502).json({ error: 'AgentUnavailable', detail: e.message || 'Unknown error' });
  }
});

// backend/src/routes/agent.js (or wherever this file is)
router.post('/plan', async (req, res) => {
  console.log('[/api/agent/plan] →', `${AGENT_BASE}/ai/plan`);
  try {
    const { data, status } = await axios.post(
      `${AGENT_BASE}/ai/plan`,
      req.body,
      {
        timeout: 90000,                     // give a bit more headroom
        validateStatus: () => true,         // don't throw on 4xx/5xx
      }
    );

    if (status >= 200 && status < 300) {
      return res.status(status).json(data);
    }

    console.error('Agent /ai/plan replied with', status, data);
    return res.status(status).json(
      data || { error: 'AgentError', detail: `Upstream returned ${status}` }
    );
  } catch (e) {
    console.error('Agent /plan network error:', e.message);
    return res.status(502).json({ error: 'AgentUnavailable', detail: e.message || 'Unknown' });
  }
});

module.exports = router;