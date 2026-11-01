import os
from fastapi import APIRouter
from app.database import get_db_connection
from app.services.hotspot_service import detect_civic_hotspots
from app.ai.knowledge_base import GOVERNMENT_GUIDELINES

router = APIRouter(prefix="/api/analytics", tags=["Civic Analytics"])

@router.get("/overview")
def get_analytics_overview():
    conn = get_db_connection()
    
    total = conn.execute("SELECT COUNT(*) FROM complaints").fetchone()[0]
    unresolved = conn.execute("SELECT COUNT(*) FROM complaints WHERE status NOT IN ('resolved', 'merged')").fetchone()[0]
    resolved = conn.execute("SELECT COUNT(*) FROM complaints WHERE status = 'resolved'").fetchone()[0]
    in_progress = conn.execute("SELECT COUNT(*) FROM complaints WHERE status IN ('in_progress', 'assigned')").fetchone()[0]

    category_stats = conn.execute("""
        SELECT category, COUNT(*) as count
        FROM complaints
        GROUP BY category
        ORDER BY count DESC
    """).fetchall()

    severity_stats = conn.execute("""
        SELECT severity, COUNT(*) as count
        FROM complaints
        GROUP BY severity
    """).fetchall()

    locality_stats = conn.execute("""
        SELECT locality, COUNT(*) as count
        FROM complaints
        WHERE locality IS NOT NULL
        GROUP BY locality
        ORDER BY count DESC
        LIMIT 10
    """).fetchall()

    conn.close()

    return {
        "summary": {
            "total_complaints": total,
            "unresolved": unresolved,
            "resolved": resolved,
            "in_progress": in_progress,
            "resolution_rate_pct": round((resolved / total * 100), 1) if total > 0 else 0.0
        },
        "by_category": [dict(r) for r in category_stats],
        "by_severity": [dict(r) for r in severity_stats],
        "by_locality": [dict(r) for r in locality_stats]
    }

@router.get("/map-incidents")
def get_public_map_incidents():
    """
    Returns public incidents with geographic coordinates.
    Strictly excludes citizen private PII (name, email, phone) to preserve privacy.
    """
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT id, title, category, latitude, longitude, address, locality, ward,
               status, severity, severity_score, assigned_department, upvotes_count, created_at
        FROM complaints
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 200
    """).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/hotspots")
def get_hotspots():
    clusters = detect_civic_hotspots(radius_km=1.0, min_complaints=2)
    return {
        "total_hotspots": len(clusters),
        "hotspots": clusters
    }

@router.get("/guidelines")
def get_civic_guidelines():
    return {
        "guidelines": GOVERNMENT_GUIDELINES
    }

@router.get("/mapbox-token")
def get_mapbox_token():
    return {"mapbox_token": os.getenv("MAPBOX_TOKEN", "")}
