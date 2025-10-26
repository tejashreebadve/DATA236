from langchain.tools import tool
import httpx

@tool("weather_summary", return_direct=False)
def weather_summary(city_and_dates: str) -> str:
    """
    Given 'City, CC | YYYY-MM-DD to YYYY-MM-DD', returns concise weather info & packing suggestions.
    """
    try:
        city, span = [s.strip() for s in city_and_dates.split("|")]
        start, end = [s.strip() for s in span.split("to")]
    except Exception:
        return "Format error. Use: 'City, CountryCode | YYYY-MM-DD to YYYY-MM-DD'"

    with httpx.Client(timeout=20, headers={"User-Agent":"StayBnB-Agent/1.0"}) as c:
        g = c.get("https://nominatim.openstreetmap.org/search",
                  params={"q": city, "format":"json", "limit":1}).json()
        if not g:
            return f"Could not geocode {city}"
        lat, lon = g[0]["lat"], g[0]["lon"]

        w = c.get("https://api.open-meteo.com/v1/forecast",
                  params={
                      "latitude":lat, "longitude":lon,
                      "daily":"temperature_2m_max,temperature_2m_min,precipitation_probability_max",
                      "timezone":"auto"
                  }).json().get("daily",{})

    if not w:
        return "No weather data."
    tmax = max(w.get("temperature_2m_max",[22]))
    pprec = max(w.get("precipitation_probability_max",[0]))

    tips = ["comfortable shoes","reusable water bottle"]
    if tmax >= 27: tips += ["sunscreen","hat","light clothing"]
    if pprec >= 40: tips += ["light rain jacket","umbrella"]

    return f"Weather for {city} ({start}→{end}): max {tmax}°C, rain chance up to {pprec}%. Packing: {', '.join(tips)}."