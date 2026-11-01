"""
Verified Government and Civic Guidelines Repository
Source-grounded guidelines for BBMP, BWSSB, BESCOM, and SWM Rules (data.gov.in / Karnataka Municipal Corporations Act).
"""

GOVERNMENT_GUIDELINES = [
    {
        "id": "GOV-RD-01",
        "category": "Roads and Potholes",
        "title": "BBMP Pothole Repair SOP & Citizen Grievance Citizen Charter",
        "sla_hours": 48,
        "department": "Road Infrastructure & Engineering",
        "authority": "Bruhat Bengaluru Mahanagara Palike (BBMP)",
        "source": "BBMP Citizen Charter 2024 / Karnataka Sakala Services Act",
        "url": "https://bbmp.gov.in/citizens-charter.html",
        "published_date": "2024-01-15",
        "summary": "Potholes on major arterial and sub-arterial roads must be filled using cold or hot asphalt mix within 48 hours of complaint receipt. Arterial roads with severe structural damage must be barricaded with retro-reflective warnings within 4 hours to prevent accidents.",
        "procedure": "1. Report via City Pulse or Sahaya portal with GPS coordinates. 2. Junior Engineer inspects within 24 hours. 3. Contractor fills pothole within 48 hours. 4. Post-repair photo uploaded for verification."
    },
    {
        "id": "GOV-SWM-02",
        "category": "Garbage and Sanitation",
        "title": "Solid Waste Management (SWM) Rules 2016 & BBMP Sanitation Guidelines",
        "sla_hours": 24,
        "department": "Solid Waste Management",
        "authority": "Ministry of Environment, Forest & Climate Change (MoEFCC) / BBMP",
        "source": "SWM Rules 2016 / BBMP Waste Segregation Order",
        "url": "https://swachhbharatmission.ddws.gov.in",
        "published_date": "2023-08-10",
        "summary": "Black spots (unauthorized roadside dumping) must be cleared within 24 hours. Waste segregation at source into wet, dry, and sanitary waste is mandatory. Commercial entities dumping garbage face compounding penalties under Section 431 of KMC Act.",
        "procedure": "1. Sanitation supervisor receives geolocated alert. 2. Compactor or auto-tipper deployed within 12 hours. 3. Spot cleaned, lime/bleaching powder sprinkled. 4. Resident welfare association notified."
    },
    {
        "id": "GOV-DR-03",
        "category": "Drainage and Waterlogging",
        "title": "Storm Water Drain (SWD) Desilting & Monsoon Preparedness Protocol",
        "sla_hours": 24,
        "department": "Storm Water Drains & Flood Management",
        "authority": "BBMP SWD Wing / State Disaster Management Authority",
        "source": "Karnataka Disaster Management Framework 2025",
        "url": "https://bbmp.gov.in/swd-monsoon-guidelines.pdf",
        "published_date": "2025-04-20",
        "summary": "Severe waterlogging obstructing traffic requires immediate deployment of tractor-mounted diesel suction pumps within 2 hours. Desilting of primary and secondary drains must ensure 100% flow capacity prior to monsoon season.",
        "procedure": "1. Emergency quick response team deployed with high-capacity pumps. 2. Silt and plastic choke points removed manually or via JCB. 3. Water diverted to nearest natural storm drain valley."
    },
    {
        "id": "GOV-WS-04",
        "category": "Water Supply and Leakage",
        "title": "BWSSB Water Main Leakage & Pipeline Rupture Response Protocol",
        "sla_hours": 12,
        "department": "Water Supply & Sewerage Board",
        "authority": "Bengaluru Water Supply and Sewerage Board (BWSSB)",
        "source": "BWSSB Citizen Service Delivery Manual",
        "url": "https://bwssb.karnataka.gov.in/service-standards",
        "published_date": "2024-03-01",
        "summary": "Major pipeline bursts causing potable water loss or road inundation must be isolated by valve control within 3 hours. Pipeline replacement or clamp welding completed within 12 hours. Contaminated supply lines trigger immediate laboratory sampling.",
        "procedure": "1. Control room alerts local sub-division assistant engineer. 2. Sluice valve isolated to stop wastage. 3. Excavation, sleeve replacement, and pressure restoration completed within 12 hours."
    },
    {
        "id": "GOV-ST-05",
        "category": "Streetlights and Electrical Infrastructure",
        "title": "BESCOM & BBMP Public Lighting & Electrical Safety Standard",
        "sla_hours": 24,
        "department": "Electricity Supply & Street Lighting",
        "authority": "Bangalore Electricity Supply Company Limited (BESCOM) / BBMP Electrical",
        "source": "Central Electricity Authority (CEA) Safety Regulations",
        "url": "https://bescom.karnataka.gov.in/lighting-charter",
        "published_date": "2024-06-15",
        "summary": "Non-functional streetlights on public roads must be repaired within 24 hours. Exposed live wires or damaged electrical junction boxes are classified as Level-1 Critical Safety Hazards and must be de-energized/secured within 60 minutes.",
        "procedure": "1. Lineman dispatched with ladder truck. 2. LED fixture, ignitor, or cable splice repaired. 3. Earthing checked to prevent electrocution during rains."
    }
]

def search_guidelines(query: str, category: str = None):
    query_lower = query.lower()
    matches = []
    for g in GOVERNMENT_GUIDELINES:
        score = 0
        if category and g["category"].lower() == category.lower():
            score += 4
        if any(w in g["title"].lower() or w in g["summary"].lower() or w in g["category"].lower() for w in query_lower.split()):
            score += 2
        if score > 0:
            matches.append((score, g))
    matches.sort(key=lambda x: x[0], reverse=True)
    return [m[1] for m in matches]
