import os
import sys
import io
import unittest
from unittest.mock import patch

os.environ["TESTING"] = "1"
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from starlette.testclient import TestClient
from app.main import app
from app.database import init_db, get_db_connection

class TestCityPulseAPI(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        init_db()
        conn = get_db_connection()
        conn.execute("DELETE FROM complaint_updates;")
        conn.execute("DELETE FROM complaint_supports;")
        conn.execute("DELETE FROM resolution_evidence;")
        conn.execute("DELETE FROM notifications;")
        conn.execute("DELETE FROM complaints;")
        conn.execute("DELETE FROM incidents;")
        conn.commit()
        conn.close()

        cls.client = TestClient(app)

        cls.citizen_email = f"test_citizen_{os.urandom(4).hex()}@citypulse.org"
        reg_resp = cls.client.post("/api/auth/register", json={
            "name": "Kavya Patel",
            "email": cls.citizen_email,
            "password": "Password123!",
            "role": "citizen"
        })
        cls.citizen_token = reg_resp.json()["access_token"]
        cls.citizen_headers = {"Authorization": f"Bearer {cls.citizen_token}"}

        cls.citizen2_email = f"test_citizen2_{os.urandom(4).hex()}@citypulse.org"
        reg2_resp = cls.client.post("/api/auth/register", json={
            "name": "Rohan Kumar",
            "email": cls.citizen2_email,
            "password": "Password123!",
            "role": "citizen"
        })
        cls.citizen2_token = reg2_resp.json()["access_token"]
        cls.citizen2_headers = {"Authorization": f"Bearer {cls.citizen2_token}"}

        cls.admin_email = f"test_admin_{os.urandom(4).hex()}@citypulse.org"
        admin_resp = cls.client.post("/api/auth/register", json={
            "name": "Commissioner Rao",
            "email": cls.admin_email,
            "password": "AdminPassword123!",
            "role": "admin"
        })
        cls.admin_token = admin_resp.json()["access_token"]
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

    def test_00_empty_database_state(self):
        """Test 20: Run application without complaint records -> genuine empty states"""
        resp = self.client.get("/api/analytics/overview")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["summary"]["total_complaints"], 0)
        list_resp = self.client.get("/api/complaints")
        self.assertEqual(list_resp.json(), [])

    def test_01_user_registration_duplicate_and_login(self):
        """Test 1: User registration, duplicate rejection, and login flow"""
        dup_resp = self.client.post("/api/auth/register", json={
            "name": "Kavya Duplicate",
            "email": self.citizen_email,
            "password": "Password123!",
            "role": "citizen"
        })
        self.assertEqual(dup_resp.status_code, 400)

        login_resp = self.client.post("/api/auth/login", json={
            "email": self.citizen_email,
            "password": "Password123!"
        })
        self.assertEqual(login_resp.status_code, 200)
        self.assertIn("access_token", login_resp.json())

    def test_02_role_based_access_control(self):
        """Test 2: Citizen cannot access admin-only endpoints"""
        resp = self.client.get("/api/admin/complaints", headers=self.citizen_headers)
        self.assertEqual(resp.status_code, 403)

    def test_03_text_based_complaint_submission(self):
        """Test 3: Text-based complaint submission"""
        resp = self.client.post(
            "/api/complaints",
            data={
                "title": "Deep dangerous pothole",
                "description": "There is a massive pothole in the middle of 100ft road near Indiranagar KFC. Causing bikes to slip.",
                "latitude": 12.9719,
                "longitude": 77.6412,
                "locality": "Indiranagar",
                "ward": "Ward 112"
            },
            headers=self.citizen_headers
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertTrue(data["id"].startswith("CP-2026-"))
        self.assertEqual(data["category"].lower(), "roads and potholes")

    def test_04_image_based_complaint_submission(self):
        """Test 4: Image-based complaint upload and classification"""
        fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
        resp = self.client.post(
            "/api/complaints",
            data={
                "description": "Damaged road surface with deep pothole captured in photo.",
                "latitude": 12.9720,
                "longitude": 77.6415,
                "locality": "Indiranagar"
            },
            files=[("images", ("pothole.png", io.BytesIO(fake_png), "image/png"))],
            headers=self.citizen_headers
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(len(data["media_urls"]), 1)
        self.assertTrue(data["media_urls"][0].startswith("/uploads/"))

    def test_05_missing_location_saves_as_location_pending(self):
        """Test 5: Submit complaint without GPS coordinates -> saved as location_pending, no fabricated coords"""
        resp = self.client.post(
            "/api/complaints",
            data={
                "description": "Broken streetlight near main bus stand.",
                "address": "MG Road Bus Stand"
            },
            headers=self.citizen_headers
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["status"], "location_pending")
        self.assertIsNone(data["latitude"])
        self.assertIsNone(data["longitude"])

    def test_06_ai_classification_sanitation_and_duration(self):
        """Test 6: Complaint classification extracts category, subcategory, and 3-day duration"""
        resp = self.client.post(
            "/api/complaints",
            data={
                "description": "Garbage has been accumulating outside our apartment for three days with terrible stench.",
                "latitude": 12.9116,
                "longitude": 77.6534,
                "locality": "HSR Layout"
            },
            headers=self.citizen_headers
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["category"].lower(), "garbage and sanitation")
        self.assertEqual(data["ai_classification"]["duration_days"], 3)

    def test_07_geospatial_duplicate_detection_and_merging(self):
        """Test 7 & Test 14: Duplicate detection and admin incident merging preserving both reports"""
        resp1 = self.client.post(
            "/api/complaints",
            data={
                "title": "Open drain overflow",
                "description": "Open storm drain overflowing on Margosa Road Malleshwaram.",
                "latitude": 12.9982,
                "longitude": 77.5714,
                "locality": "Malleshwaram"
            },
            headers=self.citizen_headers
        )
        c1_id = resp1.json()["id"]

        resp2 = self.client.post(
            "/api/complaints",
            data={
                "title": "Drain water spilling on road",
                "description": "Drain overflowing with foul water right outside Margosa Road bus stop.",
                "latitude": 12.9984,
                "longitude": 77.5716,
                "locality": "Malleshwaram"
            },
            headers=self.citizen2_headers
        )
        c2_id = resp2.json()["id"]
        self.assertGreaterEqual(resp2.json()["potential_duplicates_count"], 1)

        merge_resp = self.client.post(
            "/api/admin/incidents/merge",
            json={
                "parent_complaint_id": c1_id,
                "duplicate_complaint_ids": [c2_id],
                "notes": "Confirmed same storm drain overflow on Margosa Road."
            },
            headers=self.admin_headers
        )
        self.assertEqual(merge_resp.status_code, 200)
        incident_id = merge_resp.json()["incident_id"]
        self.assertTrue(incident_id.startswith("INC-"))

        d1 = self.client.get(f"/api/complaints/{c1_id}").json()
        d2 = self.client.get(f"/api/complaints/{c2_id}").json()
        self.assertEqual(d1["incident_id"], incident_id)
        self.assertEqual(d2["incident_id"], incident_id)

    def test_08_severity_comparison_and_factors(self):
        """Test 8: Different safety conditions produce different severity recommendations with visible factors"""
        low_resp = self.client.post(
            "/api/complaints",
            data={
                "description": "Minor cosmetic paint peeling on footpath curb.",
                "latitude": 12.9300,
                "longitude": 77.6100
            },
            headers=self.citizen_headers
        ).json()

        high_resp = self.client.post(
            "/api/complaints",
            data={
                "description": "Critical danger! Live wire from BESCOM transformer sparking on submerged main road near school.",
                "latitude": 12.9850,
                "longitude": 77.7440
            },
            headers=self.citizen_headers
        ).json()

        self.assertGreater(high_resp["severity_score"], low_resp["severity_score"])
        self.assertIn("safety_risk", high_resp["severity_factors"])

    def test_09_civic_assistant_nearby_personal_guidelines_and_unsupported(self):
        """Tests 9, 10, 11, and 12: AI Assistant intents & unsupported query refusal"""
        r9 = self.client.post("/api/assistant/chat", json={
            "message": "How many unresolved pothole complaints are near me?",
            "latitude": 12.9719,
            "longitude": 77.6412
        }, headers=self.citizen_headers).json()
        self.assertEqual(r9["tool_used"], "search_nearby")

        r10 = self.client.post("/api/assistant/chat", json={
            "message": "What is the status of my complaints?"
        }, headers=self.citizen_headers).json()
        self.assertEqual(r10["tool_used"], "get_my_complaints")
        self.assertIn("CP-2026-", r10["answer"])

        r11 = self.client.post("/api/assistant/chat", json={
            "message": "What is the BBMP SLA for repairing potholes?"
        }).json()
        self.assertEqual(r11["tool_used"], "search_government_guidelines")
        self.assertTrue(len(r11["sources"]) > 0)

        r12 = self.client.post("/api/assistant/chat", json={
            "message": "Write a recipe for chocolate fudge cake."
        }).json()
        self.assertEqual(r12["tool_used"], "unsupported_query")
        self.assertIn("outside my scope", r12["answer"].lower())

    def test_10_admin_assignment_override_and_resolution_verification(self):
        """Test 13, Test 15 & Test 16: Admin assignment, resolution evidence upload, and citizen dispute"""
        c = self.client.post(
            "/api/complaints",
            data={
                "description": "Garbage dump near park entrance.",
                "latitude": 12.9600,
                "longitude": 77.6300
            },
            headers=self.citizen_headers
        ).json()

        up = self.client.post(
            f"/api/admin/complaints/{c['id']}/status",
            json={"status": "in_progress", "assigned_department": "Solid Waste Management Department"},
            headers=self.admin_headers
        )
        self.assertEqual(up.status_code, 200)

        fake_img = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
        res_ev = self.client.post(
            f"/api/admin/complaints/{c['id']}/resolve",
            data={"notes": "Cleared garbage dump and sanitized spot."},
            files=[("resolution_photo", ("after.png", io.BytesIO(fake_img), "image/png"))],
            headers=self.admin_headers
        )
        self.assertEqual(res_ev.status_code, 200)
        self.assertEqual(res_ev.json()["status"], "resolution_pending")
        self.assertIn("ai_verification", res_ev.json())

        disp = self.client.post(
            f"/api/complaints/{c['id']}/dispute",
            json={"confirmed": False, "dispute_reason": "Half the waste is still lying on the footpath."},
            headers=self.citizen_headers
        )
        self.assertEqual(disp.status_code, 200)
        self.assertEqual(disp.json()["status"], "disputed")

    def test_11_ai_service_unavailable_graceful_degradation(self):
        """Test 17: Simulate AI timeout/failure -> complaint still saved with ai_status='failed'"""
        with patch("app.routers.complaints_router.classify_complaint_multimodal", side_effect=TimeoutError("AI API timed out")):
            resp = self.client.post(
                "/api/complaints",
                data={
                    "description": "Water pipe leaking near 4th block.",
                    "latitude": 12.9344,
                    "longitude": 77.6288
                },
                headers=self.citizen_headers
            )
            self.assertEqual(resp.status_code, 201)
            self.assertEqual(resp.json()["ai_status"], "failed")

    def test_12_idempotency_prevents_duplicate_submission(self):
        """Test 18: Repeated submission with same Idempotency-Key returns same complaint ID"""
        headers = {**self.citizen_headers, "Idempotency-Key": "IDEMP-KEY-9991"}
        payload = {
            "description": "Streetlight pole leaning dangerously after storm.",
            "latitude": 12.9500,
            "longitude": 77.6200
        }
        r1 = self.client.post("/api/complaints", data=payload, headers=headers)
        r2 = self.client.post("/api/complaints", data=payload, headers=headers)
        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r2.status_code, 201)
        self.assertEqual(r1.json()["id"], r2.json()["id"])
        self.assertTrue(r2.json().get("idempotent_replay"))

    def test_13_unauthorised_private_complaint_access_rejected(self):
        """Test 19: Citizen 2 cannot access Citizen 1's private complaint"""
        priv = self.client.post(
            "/api/complaints",
            data={
                "description": "Private sewer backflow inside residential compound.",
                "latitude": 12.9400,
                "longitude": 77.6100,
                "is_public": 0
            },
            headers=self.citizen_headers
        ).json()

        unauth = self.client.get(f"/api/complaints/{priv['id']}", headers=self.citizen2_headers)
        self.assertEqual(unauth.status_code, 403)

        owner_resp = self.client.get(f"/api/complaints/{priv['id']}", headers=self.citizen_headers)
        self.assertEqual(owner_resp.status_code, 200)

    def test_14_public_analytics_data_integrity(self):
        """Test 14: Analytics reflects real DB records without exposing private citizen PII"""
        resp = self.client.get("/api/analytics/overview")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("summary", data)
        self.assertGreater(data["summary"]["total_complaints"], 0)

        # Map incidents check: ensure NO email or phone is returned
        map_resp = self.client.get("/api/analytics/map-incidents")
        self.assertEqual(map_resp.status_code, 200)
        incidents = map_resp.json()
        for inc in incidents[:5]:
            self.assertNotIn("citizen_email", inc)
            self.assertNotIn("citizen_phone", inc)
            self.assertIn("latitude", inc)
            self.assertIn("longitude", inc)

    def test_15_civic_hotspots_clustering(self):
        """Test 15: Spatial hotspot detection identifies complaint density"""
        resp = self.client.get("/api/analytics/hotspots")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("hotspots", data)
        self.assertIsInstance(data["hotspots"], list)

    def test_16_ai_connector_complaint_analysis_and_review(self):
        """Test 16: AI Complaint Analysis Connector with 5 return fields & review persistence"""
        # Step 1: Call AI Analysis endpoint
        ai_resp = self.client.post(
            "/api/ai/analyze-complaint",
            json={"description": "Large water main rupture leaking thousands of liters on Margosa road Malleshwaram"}
        )
        self.assertEqual(ai_resp.status_code, 200)
        data = ai_resp.json()

        # Check the 5 required fields:
        # 1. Complaint category (from supported categories)
        self.assertIn(data["category"], [
            "Roads and potholes", "Garbage and sanitation", "Water supply and leakage",
            "Streetlights and electricity", "Drainage and sewage", "Other civic issues"
        ])
        self.assertEqual(data["category"], "Water supply and leakage")

        # 2. Suggested priority (Low, Medium, or High)
        self.assertIn(data["priority"], ["Low", "Medium", "High"])

        # 3. Responsible municipal department
        self.assertEqual(data["department"], "Water Supply and Sewerage Board")

        # 4. Short complaint summary
        self.assertTrue(len(data["summary"]) > 5)

        # 5. Suggested next action
        self.assertTrue(len(data["suggested_next_action"]) > 10)

        # Non-exposing credentials check & disclaimer
        self.assertIn("disclaimer", data)
        self.assertNotIn("GEMINI_API_KEY", data)

        # Step 2: Citizen reviews, tweaks priority to High, and submits
        sub_resp = self.client.post(
            "/api/complaints",
            data={
                "title": data["summary"],
                "description": "Large water main rupture leaking thousands of liters on Margosa road Malleshwaram",
                "category": data["category"],
                "priority": "High",
                "assigned_department": data["department"],
                "ai_summary": data["summary"],
                "suggested_next_action": data["suggested_next_action"],
                "latitude": 12.9982,
                "longitude": 77.5714,
                "locality": "Malleshwaram"
            },
            headers=self.citizen_headers
        )
        self.assertEqual(sub_resp.status_code, 201)
        created_complaint = sub_resp.json()

        # Step 3: Verify the final reviewed values are saved in the database
        detail = self.client.get(f"/api/complaints/{created_complaint['id']}").json()
        self.assertEqual(detail["category"], "Water supply and leakage")
        self.assertEqual(detail["severity"], "High")
        self.assertEqual(detail["assigned_department"], "Water Supply and Sewerage Board")

if __name__ == "__main__":
    unittest.main()
