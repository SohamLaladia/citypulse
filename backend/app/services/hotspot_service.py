from typing import List, Dict, Any
from app.database import get_db_connection, haversine

def detect_civic_hotspots(radius_km: float = 1.0, min_complaints: int = 2) -> List[Dict[str, Any]]:
    """
    Identifies geographic clusters of recurring complaints using spatial proximity
    and calculates statistical density from actual database records.
    """
    conn = get_db_connection()
    complaints = conn.execute("""
        SELECT id, category, latitude, longitude, locality, ward, status, severity, created_at
        FROM complaints
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    """).fetchall()
    conn.close()

    if not complaints:
        return []

    pts = [dict(c) for c in complaints]
    clusters = []
    visited = set()

    for i, pt1 in enumerate(pts):
        if pt1["id"] in visited:
            continue
        
        current_cluster = [pt1]
        for j, pt2 in enumerate(pts):
            if i != j and pt2["id"] not in visited:
                dist = haversine(pt1["latitude"], pt1["longitude"], pt2["latitude"], pt2["longitude"])
                if dist <= radius_km:
                    current_cluster.append(pt2)

        if len(current_cluster) >= min_complaints:
            for item in current_cluster:
                visited.add(item["id"])
            
            # Compute cluster centroid
            avg_lat = sum(c["latitude"] for c in current_cluster) / len(current_cluster)
            avg_lon = sum(c["longitude"] for c in current_cluster) / len(current_cluster)
            
            # Category breakdown
            cat_counts = {}
            for c in current_cluster:
                cat = c["category"]
                cat_counts[cat] = cat_counts.get(cat, 0) + 1
            predominant_cat = max(cat_counts, key=cat_counts.get)
            
            locality = current_cluster[0].get("locality") or "Urban Cluster"
            ward = current_cluster[0].get("ward") or "Ward 150"

            clusters.append({
                "hotspot_id": f"HOTSPOT-{len(clusters)+1:03d}",
                "locality": locality,
                "ward": ward,
                "centroid": {"latitude": round(avg_lat, 5), "longitude": round(avg_lon, 5)},
                "total_complaints": len(current_cluster),
                "predominant_category": predominant_cat,
                "category_distribution": cat_counts,
                "radius_meters": int(radius_km * 1000),
                "complaint_ids": [c["id"] for c in current_cluster],
                "severity_index": "High" if len(current_cluster) >= 4 else "Medium",
                "statistical_insight": f"High density of {predominant_cat} ({cat_counts[predominant_cat]}/{len(current_cluster)} reports) within {int(radius_km*1000)}m radius in {locality}."
            })

    return clusters
