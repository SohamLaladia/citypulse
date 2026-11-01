import json
from typing import Dict, Any, Optional
from datetime import datetime
from app.database import get_db_connection
from app.ai.knowledge_base import search_guidelines

class CityPulseAssistant:
    """
    Conversational AI Assistant grounded strictly in real database records
    and verified government documentation. Executes backend tools for data retrieval.
    """

    def __init__(self, current_user: Optional[Dict[str, Any]] = None):
        self.current_user = current_user

    def tool_search_nearby(self, lat: float, lon: float, radius_km: float = 2.0, category: Optional[str] = None):
        conn = get_db_connection()
        query = """
        SELECT id, title, category, latitude, longitude, address, locality, status, severity, created_at,
               haversine(latitude, longitude, ?, ?) AS distance_km
        FROM complaints
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        AND haversine(latitude, longitude, ?, ?) <= ?
        """
        params = [lat, lon, lat, lon, radius_km]
        if category:
            query += " AND LOWER(category) = LOWER(?)"
            params.append(category)
        query += " ORDER BY distance_km ASC LIMIT 10"

        rows = conn.execute(query, tuple(params)).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def tool_get_my_complaints(self, user_id: str):
        if not user_id:
            return {"error": "Authentication required to view your personal complaints."}
        conn = get_db_connection()
        rows = conn.execute("""
            SELECT id, title, category, status, severity, assigned_department, locality, created_at, updated_at
            FROM complaints
            WHERE user_id = ?
            ORDER BY created_at DESC
        """, (user_id,)).fetchall()
        conn.close()
        return [dict(r) for r in rows]

    def tool_get_statistics(self, locality: Optional[str] = None, category: Optional[str] = None):
        conn = get_db_connection()
        where_clauses = []
        params = []
        if locality:
            where_clauses.append("LOWER(locality) LIKE LOWER(?)")
            params.append(f"%{locality}%")
        if category:
            where_clauses.append("LOWER(category) = LOWER(?)")
            params.append(category)
        
        where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
        
        total = conn.execute(f"SELECT COUNT(*) FROM complaints {where_sql}", tuple(params)).fetchone()[0]
        unresolved = conn.execute(f"SELECT COUNT(*) FROM complaints {where_sql} {' AND ' if where_sql else ' WHERE '} status NOT IN ('resolved', 'closed')", tuple(params)).fetchone()[0]
        resolved = conn.execute(f"SELECT COUNT(*) FROM complaints {where_sql} {' AND ' if where_sql else ' WHERE '} status = 'resolved'", tuple(params)).fetchone()[0]

        cat_breakdown = conn.execute(f"""
            SELECT category, COUNT(*) as count 
            FROM complaints {where_sql} 
            GROUP BY category
        """, tuple(params)).fetchall()

        conn.close()
        return {
            "total_complaints": total,
            "unresolved_count": unresolved,
            "resolved_count": resolved,
            "categories": {r["category"]: r["count"] for r in cat_breakdown},
            "timestamp": datetime.now().isoformat()
        }

    def tool_search_guidelines(self, query: str):
        return search_guidelines(query)

    async def answer_query(self, message: str, lat: Optional[float] = None, lon: Optional[float] = None, locality: Optional[str] = None) -> Dict[str, Any]:
        msg_lower = message.lower()
        tool_used = None
        tool_result = None
        response_text = ""
        sources = []

        if any(w in msg_lower for w in ["my complaint", "status of my", "my report", "what complaints have i"]):
            tool_used = "get_my_complaints"
            if not self.current_user:
                return {
                    "answer": "You need to be logged in to view your personal complaints. Please sign in to check your active reports.",
                    "tool_used": "auth_check",
                    "sources": []
                }
            user_id = self.current_user["id"]
            complaints = self.tool_get_my_complaints(user_id)
            tool_result = complaints
            if not complaints:
                response_text = "You have not submitted any complaints yet. Use the 'Report Issue' tab to submit a civic problem."
            else:
                complaint_summaries = []
                for c in complaints[:3]:
                    complaint_summaries.append(
                        f"• **{c['id']}**: *{c['title']}* ({c['category']}) — Status: **{c['status'].upper()}** | Severity: **{c['severity']}**"
                    )
                response_text = f"You have **{len(complaints)}** recorded complaint(s):\n\n" + "\n".join(complaint_summaries)
                if len(complaints) > 3:
                    response_text += f"\n\n*And {len(complaints) - 3} more. Check the 'My Complaints' tab for complete details.*"

        elif any(w in msg_lower for w in ["guideline", "sop", "how do i report", "how do i officially report", "rule", "charter", "sla", "penalty", "bwssb", "bbmp", "bescom", "procedure"]):
            tool_used = "search_government_guidelines"
            guidelines = self.tool_search_guidelines(message)
            tool_result = guidelines
            if guidelines:
                top = guidelines[0]
                response_text = (
                    f"### {top['title']}\n"
                    f"**Authority:** {top['authority']} | **SLA:** {top['sla_hours']} hours\n\n"
                    f"{top['summary']}\n\n"
                    f"**Official Procedure:**\n{top['procedure']}\n\n"
                    f"*Source: [{top['source']}]({top['url']}) (Published: {top['published_date']})*"
                )
                sources.append({
                    "title": top["title"],
                    "authority": top["authority"],
                    "url": top["url"],
                    "published_date": top["published_date"]
                })
            else:
                response_text = "No specific government standard matches that query directly. Standard municipal SLA for hazardous issues is 24-48 hours under Karnataka Sakala Services Act."

        elif any(w in msg_lower for w in ["near me", "nearby", "around me", "in my area", "close to"]):
            tool_used = "search_nearby"
            search_lat = lat if lat is not None else 12.9716
            search_lon = lon if lon is not None else 77.5946
            
            cat_filter = None
            if "pothole" in msg_lower or "road" in msg_lower:
                cat_filter = "Roads and potholes"
            elif "garbage" in msg_lower or "waste" in msg_lower:
                cat_filter = "Garbage and sanitation"
            elif "drain" in msg_lower or "flood" in msg_lower:
                cat_filter = "Drainage and sewage"
            elif "water" in msg_lower:
                cat_filter = "Water supply and leakage"
            elif "streetlight" in msg_lower or "light" in msg_lower:
                cat_filter = "Streetlights and electricity"

            nearby = self.tool_search_nearby(search_lat, search_lon, radius_km=3.0, category=cat_filter)
            tool_result = nearby
            if not nearby:
                response_text = f"There are currently **0** active {cat_filter or 'civic'} complaints recorded within 3 km of this location."
            else:
                unresolved_nearby = [c for c in nearby if c["status"] not in ["resolved", "closed"]]
                response_text = (
                    f"Found **{len(nearby)}** complaint(s) within 3 km ({len(unresolved_nearby)} currently unresolved):\n\n"
                )
                for item in nearby[:4]:
                    dist_m = int(item["distance_km"] * 1000)
                    response_text += f"• **{item['id']}**: {item['title']} ({dist_m}m away) — Status: `{item['status']}`\n"
                response_text += "\n*Data queried from live geospatial database records.*"

        elif any(w in msg_lower for w in ["how many", "count", "statistics", "stats", "breakdown", "unresolved", "total"]):
            tool_used = "get_civic_statistics"
            stats = self.tool_get_statistics(locality=locality)
            tool_result = stats
            
            loc_str = f" in {locality}" if locality else " platform-wide"
            response_text = (
                f"### Civic Statistics{loc_str}\n"
                f"• **Total Complaints Logged:** {stats['total_complaints']}\n"
                f"• **Active / Unresolved Issues:** {stats['unresolved_count']}\n"
                f"• **Successfully Resolved:** {stats['resolved_count']}\n\n"
                f"**Category Breakdown:**\n"
            )
            for cat, count in stats["categories"].items():
                response_text += f"- {cat}: **{count}**\n"
            response_text += f"\n*Verified from database at {stats['timestamp'][:16].replace('T', ' ')} UTC.*"

        else:
            tool_used = "unsupported_query"
            response_text = (
                "I cannot answer that question as it is outside my scope. "
                "I am **City Pulse AI**, strictly limited to verified municipal complaint records, "
                "locality statistics, and official civic guidelines. I do not fabricate statistics or procedures."
            )

        return {
            "answer": response_text,
            "tool_used": tool_used,
            "tool_result": tool_result,
            "sources": sources,
            "timestamp": datetime.now().isoformat()
        }
