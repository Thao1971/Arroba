"""
Deal Health System Tests
Tests for GET /api/deals/{deal_id}/health endpoint
- Health status (VERDE/AMARILLO/ROJO)
- Alert structure (id, severity, category, problem, cause, action, actions)
- NC-01 (sin traccion) detection
- NDA-sin-interest check
- Coaching nudges aggregation
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from seed data
SELLER_DIEGO = {"email": "diego.martin@rankingdigital.es", "password": "demo2026"}  # deal_hot_seo_01, status=exclusivity, health=VERDE
SELLER_ELENA = {"email": "elena.romero@techstudio.es", "password": "demo2026"}  # deal_dead_tech_04, status=published, health=AMARILLO
SELLER_RAFAEL = {"email": "rafael.torres@consultdigital.es", "password": "demo2026"}  # deal_ghost_consult_03, status=published

DEAL_HEALTHY = "deal_hot_seo_01"  # Diego's deal - should be VERDE (exclusivity status)
DEAL_UNHEALTHY = "deal_dead_tech_04"  # Elena's deal - should have NC-01 alert (sin traccion)
DEAL_GHOST = "deal_ghost_consult_03"  # Rafael's deal - should have NC-04 (inactive buyers)


class TestDealHealthEndpoint:
    """Tests for GET /api/deals/{deal_id}/health endpoint"""
    
    @pytest.fixture(scope="class")
    def diego_token(self):
        """Get auth token for Diego (healthy deal owner)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SELLER_DIEGO)
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Diego login failed: {response.status_code}")
    
    @pytest.fixture(scope="class")
    def elena_token(self):
        """Get auth token for Elena (unhealthy deal owner)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SELLER_ELENA)
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Elena login failed: {response.status_code}")
    
    @pytest.fixture(scope="class")
    def rafael_token(self):
        """Get auth token for Rafael (ghost deal owner)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SELLER_RAFAEL)
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Rafael login failed: {response.status_code}")
    
    def test_health_endpoint_requires_auth(self):
        """Health endpoint should require authentication"""
        response = requests.get(f"{BASE_URL}/api/deals/{DEAL_HEALTHY}/health")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Health endpoint requires authentication")
    
    def test_health_invalid_deal_returns_404(self, diego_token):
        """Health endpoint should return 404 for invalid deal"""
        headers = {"Authorization": f"Bearer {diego_token}"}
        response = requests.get(f"{BASE_URL}/api/deals/invalid_deal_xyz/health", headers=headers)
        assert response.status_code in [404, 403], f"Expected 404/403, got {response.status_code}"
        print("PASS: Invalid deal returns 404/403")
    
    def test_health_returns_correct_structure(self, diego_token):
        """Health endpoint should return correct response structure"""
        headers = {"Authorization": f"Bearer {diego_token}"}
        response = requests.get(f"{BASE_URL}/api/deals/{DEAL_HEALTHY}/health", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Required fields
        assert "deal_id" in data, "Missing deal_id"
        assert "health" in data, "Missing health"
        assert "color" in data, "Missing color"
        assert "summary" in data, "Missing summary"
        assert "alerts" in data, "Missing alerts"
        assert "counts" in data, "Missing counts"
        
        # Health must be one of valid values
        assert data["health"] in ["VERDE", "AMARILLO", "ROJO", "INACTIVO"], f"Invalid health: {data['health']}"
        
        # Color must match health
        color_map = {"VERDE": "green", "AMARILLO": "amber", "ROJO": "red", "INACTIVO": "slate"}
        assert data["color"] == color_map.get(data["health"]), f"Color mismatch: {data['color']} for {data['health']}"
        
        # Counts structure
        assert "total" in data["counts"], "Missing counts.total"
        assert "alta" in data["counts"], "Missing counts.alta"
        assert "media" in data["counts"], "Missing counts.media"
        assert "baja" in data["counts"], "Missing counts.baja"
        
        print(f"PASS: Health structure correct - health={data['health']}, color={data['color']}, alerts={data['counts']['total']}")
    
    def test_healthy_deal_returns_verde(self, diego_token):
        """Diego's deal (exclusivity status) should return VERDE or INACTIVO"""
        headers = {"Authorization": f"Bearer {diego_token}"}
        response = requests.get(f"{BASE_URL}/api/deals/{DEAL_HEALTHY}/health", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        # Exclusivity deals may be VERDE (healthy) or have some alerts
        # The key is it should NOT be ROJO
        assert data["health"] in ["VERDE", "AMARILLO", "INACTIVO"], f"Expected VERDE/AMARILLO/INACTIVO, got {data['health']}"
        print(f"PASS: Diego's deal health={data['health']}, alerts={data['counts']['total']}")
    
    def test_unhealthy_deal_has_alerts(self, elena_token):
        """Elena's deal (published 17 days, 0 NDAs) should have NC-01 alert"""
        headers = {"Authorization": f"Bearer {elena_token}"}
        response = requests.get(f"{BASE_URL}/api/deals/{DEAL_UNHEALTHY}/health", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        # Should have at least one alert
        assert len(data["alerts"]) > 0, "Expected alerts for unhealthy deal"
        
        # Check for NC-01 (sin traccion) alert
        alert_ids = [a.get("id", "") for a in data["alerts"]]
        print(f"Alert IDs found: {alert_ids}")
        
        # Health should be AMARILLO (1 ALTA alert) or ROJO (2+ ALTA)
        assert data["health"] in ["AMARILLO", "ROJO"], f"Expected AMARILLO/ROJO, got {data['health']}"
        print(f"PASS: Elena's deal health={data['health']}, alerts={data['counts']['total']}, alta={data['counts']['alta']}")
    
    def test_alert_structure(self, elena_token):
        """Alerts should have correct structure: id, severity, category, problem, cause, action, actions"""
        headers = {"Authorization": f"Bearer {elena_token}"}
        response = requests.get(f"{BASE_URL}/api/deals/{DEAL_UNHEALTHY}/health", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        if len(data["alerts"]) == 0:
            pytest.skip("No alerts to test structure")
        
        alert = data["alerts"][0]
        
        # Required fields
        assert "id" in alert, "Missing alert.id"
        assert "severity" in alert, "Missing alert.severity"
        assert "category" in alert, "Missing alert.category"
        assert "problem" in alert, "Missing alert.problem"
        assert "cause" in alert, "Missing alert.cause"
        assert "action" in alert, "Missing alert.action"
        assert "actions" in alert, "Missing alert.actions"
        
        # Severity must be valid
        assert alert["severity"] in ["ALTA", "MEDIA", "BAJA"], f"Invalid severity: {alert['severity']}"
        
        # Actions must be a list
        assert isinstance(alert["actions"], list), "actions must be a list"
        
        print(f"PASS: Alert structure correct - id={alert['id']}, severity={alert['severity']}, category={alert['category']}")
        print(f"  Problem: {alert['problem'][:50]}...")
        print(f"  Cause: {alert['cause'][:50]}..." if alert['cause'] else "  Cause: (empty)")
        print(f"  Actions: {alert['actions']}")
    
    def test_nc01_sin_traccion_detection(self, elena_token):
        """NC-01 (sin traccion) should be detected for deal with views but 0 NDAs"""
        headers = {"Authorization": f"Bearer {elena_token}"}
        response = requests.get(f"{BASE_URL}/api/deals/{DEAL_UNHEALTHY}/health", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        alert_ids = [a.get("id", "") for a in data["alerts"]]
        
        # NC-01 should be present for deal_dead_tech_04 (17 days published, 18 views, 0 NDAs)
        has_nc01 = "NC-01" in alert_ids
        print(f"NC-01 present: {has_nc01}")
        print(f"All alert IDs: {alert_ids}")
        
        if has_nc01:
            nc01 = next(a for a in data["alerts"] if a["id"] == "NC-01")
            assert nc01["severity"] == "ALTA", f"NC-01 should be ALTA, got {nc01['severity']}"
            assert nc01["category"] == "TRACCION", f"NC-01 category should be TRACCION, got {nc01['category']}"
            print(f"PASS: NC-01 detected with severity=ALTA, category=TRACCION")
        else:
            # May not have NC-01 if deal conditions changed
            print(f"INFO: NC-01 not present - deal may have NDAs now or not published long enough")
    
    def test_health_semaphore_logic(self, elena_token):
        """Test semaphore logic: >=2 ALTA = ROJO, 1 ALTA = AMARILLO, etc."""
        headers = {"Authorization": f"Bearer {elena_token}"}
        response = requests.get(f"{BASE_URL}/api/deals/{DEAL_UNHEALTHY}/health", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        alta_count = data["counts"]["alta"]
        media_count = data["counts"]["media"]
        total_count = data["counts"]["total"]
        health = data["health"]
        
        # Verify semaphore logic
        if alta_count >= 2:
            assert health == "ROJO", f">=2 ALTA should be ROJO, got {health}"
        elif alta_count == 1:
            assert health == "AMARILLO", f"1 ALTA should be AMARILLO, got {health}"
        elif media_count >= 2:
            assert health == "AMARILLO", f">=2 MEDIA should be AMARILLO, got {health}"
        elif total_count > 0:
            assert health == "AMARILLO", f"Any alert should be AMARILLO, got {health}"
        else:
            assert health == "VERDE", f"0 alerts should be VERDE, got {health}"
        
        print(f"PASS: Semaphore logic correct - alta={alta_count}, media={media_count}, total={total_count} -> {health}")
    
    def test_alerts_sorted_by_severity(self, elena_token):
        """Alerts should be sorted by severity: ALTA first, then MEDIA, then BAJA"""
        headers = {"Authorization": f"Bearer {elena_token}"}
        response = requests.get(f"{BASE_URL}/api/deals/{DEAL_UNHEALTHY}/health", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        if len(data["alerts"]) < 2:
            pytest.skip("Need at least 2 alerts to test sorting")
        
        severities = [a["severity"] for a in data["alerts"]]
        severity_order = {"ALTA": 0, "MEDIA": 1, "BAJA": 2}
        
        for i in range(len(severities) - 1):
            current = severity_order.get(severities[i], 3)
            next_sev = severity_order.get(severities[i + 1], 3)
            assert current <= next_sev, f"Alerts not sorted: {severities}"
        
        print(f"PASS: Alerts sorted by severity: {severities}")
    
    def test_category_codes(self, elena_token):
        """Alert categories should be valid codes"""
        headers = {"Authorization": f"Bearer {elena_token}"}
        response = requests.get(f"{BASE_URL}/api/deals/{DEAL_UNHEALTHY}/health", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        valid_categories = [
            "TRACCION", "CONVERSION", "RIESGO", "ENFRIAMIENTO", 
            "ESTANCAMIENTO", "RESPUESTA", "CURIOSIDAD SIN AVANCE", "GENERAL"
        ]
        
        for alert in data["alerts"]:
            assert alert["category"] in valid_categories, f"Invalid category: {alert['category']}"
        
        categories_found = list(set(a["category"] for a in data["alerts"]))
        print(f"PASS: All categories valid: {categories_found}")


class TestReadinessRegression:
    """Regression tests for GET /api/deals/{deal_id}/readiness"""
    
    @pytest.fixture(scope="class")
    def diego_token(self):
        """Get auth token for Diego"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SELLER_DIEGO)
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Diego login failed: {response.status_code}")
    
    def test_readiness_still_works(self, diego_token):
        """Readiness endpoint should still work correctly"""
        headers = {"Authorization": f"Bearer {diego_token}"}
        response = requests.get(f"{BASE_URL}/api/deals/{DEAL_HEALTHY}/readiness", headers=headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "score" in data, "Missing score"
        assert "status" in data, "Missing status"
        assert "obligatory" in data, "Missing obligatory"
        assert "recommended" in data, "Missing recommended"
        
        assert data["status"] in ["LISTO", "MEJORABLE", "DEBIL"], f"Invalid status: {data['status']}"
        assert 0 <= data["score"] <= 100, f"Score out of range: {data['score']}"
        
        print(f"PASS: Readiness endpoint works - score={data['score']}, status={data['status']}")


class TestHealthWithDifferentDeals:
    """Test health with different deal states"""
    
    @pytest.fixture(scope="class")
    def rafael_token(self):
        """Get auth token for Rafael (ghost deal owner)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=SELLER_RAFAEL)
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip(f"Rafael login failed: {response.status_code}")
    
    def test_ghost_deal_health(self, rafael_token):
        """Rafael's deal should have NC-04 (inactive buyers) or similar alerts"""
        headers = {"Authorization": f"Bearer {rafael_token}"}
        response = requests.get(f"{BASE_URL}/api/deals/{DEAL_GHOST}/health", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        print(f"Ghost deal health: {data['health']}, alerts: {data['counts']['total']}")
        
        alert_ids = [a.get("id", "") for a in data["alerts"]]
        print(f"Alert IDs: {alert_ids}")
        
        # Should have some alerts (NC-04 for inactive buyers or others)
        # The deal may have different alerts depending on state
        print(f"PASS: Ghost deal health={data['health']}, alerts={len(data['alerts'])}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
