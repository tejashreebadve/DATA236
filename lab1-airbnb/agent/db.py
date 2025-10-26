import os
from sqlalchemy import create_engine, text

def _dsn():
    host = os.getenv("MYSQL_HOST", "localhost")
    port = os.getenv("MYSQL_PORT", "3306")
    user = os.getenv("MYSQL_USER")
    pwd  = os.getenv("MYSQL_PASSWORD")
    db   = os.getenv("MYSQL_DATABASE")
    return f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{db}"

engine = create_engine(_dsn(), pool_pre_ping=True)

def fetch_upcoming_bookings(user_id: int):
    """
    Fetch upcoming (future) bookings for a traveler.
    """
    sql = text("""
      SELECT b.id, p.location, p.name AS property_name,
             b.start_date AS start, b.end_date AS end, b.guests
      FROM bookings b
      JOIN properties p ON p.id = b.property_id
      WHERE b.traveler_id = :uid
        AND b.status IN ('PENDING','ACCEPTED')
        AND b.start_date >= CURDATE()
      ORDER BY b.start_date ASC
      LIMIT 25
    """)
    with engine.connect() as conn:
        return [dict(r) for r in conn.execute(sql, {"uid": user_id}).mappings()]