import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError

def _dsn():
    host = os.getenv("MYSQL_HOST", "localhost")
    port = os.getenv("MYSQL_PORT", "3306")
    user = os.getenv("MYSQL_USER")
    pwd  = os.getenv("MYSQL_PASSWORD")
    db   = os.getenv("MYSQL_DATABASE")
    if not all([user, pwd, db]):
        raise RuntimeError("MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE must be set")
    return f"mysql+pymysql://{user}:{pwd}@{host}:{port}/{db}"

engine = create_engine(_dsn(), pool_pre_ping=True)

def _date_columns():
    """
    Detect whether bookings has start_date/end_date or start/end.
    Returns a tuple: (start_col, end_col)
    """
    with engine.connect() as conn:
        cols = {row[0] for row in conn.execute(text("SHOW COLUMNS FROM bookings"))}
    if {"start_date", "end_date"}.issubset(cols):
        return "start_date", "end_date"
    elif {"start", "end"}.issubset(cols):
        return "start", "end"
    # last resort: try start_date/end_date first, then start/end at runtime
    return None, None

def fetch_upcoming_bookings(user_id: int):
    """
    Fetch upcoming (future or ongoing) bookings for a traveler.
    - Includes PENDING, ACCEPTED, CONFIRMED
    - Upcoming = starts today or ends today/later
    - Handles both (start_date/end_date) and (start/end) schemas
    """
    start_col, end_col = _date_columns()

    def _sql(sc: str, ec: str):
        # Use DATE() to ignore time-of-day and reduce TZ surprises.
        # Include ongoing stays (ec >= today) and future starts (sc >= today).
        # Use COALESCE to build a location when p.location is null.
        return text(f"""
            SELECT  b.id,
                    COALESCE(p.location, CONCAT_WS(', ', p.city, p.state, p.country)) AS location,
                    p.name AS property_name,
                    b.{sc} AS start,
                    b.{ec} AS end,
                    b.guests
            FROM bookings b
            JOIN properties p ON p.id = b.property_id
            WHERE b.traveler_id = :uid
              AND b.status IN ('PENDING','ACCEPTED','CONFIRMED')
              AND (DATE(b.{sc}) >= CURDATE() OR DATE(b.{ec}) >= CURDATE())
            ORDER BY b.{sc} ASC
            LIMIT 25
        """)

    with engine.connect() as conn:
        # Preferred path: use detected columns if we found them
        if start_col and end_col:
            rows = conn.execute(_sql(start_col, end_col), {"uid": user_id}).mappings().all()
            return [dict(r) for r in rows]

        # Fallback path: try start_date/end_date, then start/end
        for sc, ec in (("start_date","end_date"), ("start","end")):
            try:
                rows = conn.execute(_sql(sc, ec), {"uid": user_id}).mappings().all()
                if rows:  # return first successful non-empty query
                    return [dict(r) for r in rows]
            except ProgrammingError:
                continue

        # If all attempts fail or return empty, return an empty list
        return []