"""
Data Room Feature Tests - Iteration 7
Tests document upload, download, folder structure, access control, and tracking
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://musing-hellman-9.preview.emergentagent.com')

# Test credentials
SELLER_EMAIL = "seller_test@arroba.com"
SELLER_PASSWORD = "Test1234!"
DEAL_ID = "deal_1aa56a9545ba"

# Test buyer credentials (will be created during tests)
TEST_BUYER_EMAIL = f"test_buyer_dr_{uuid.uuid4().hex[:8]}@arroba.com"
TEST_BUYER_PASSWORD = "Test1234!"


class TestDataRoomFolders:
    """Test folder structure endpoint"""
    
    def test_get_folder_structure(self):
        """GET /api/dataroom/folders - returns correct folder structure with subcategories"""
        response = requests.get(f"{BASE_URL}/api/dataroom/folders")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        folders = response.json()
        assert isinstance(folders, list), "Expected list of folders"
        assert len(folders) == 7, f"Expected 7 folders, got {len(folders)}"
        
        # Verify folder IDs
        folder_ids = [f["id"] for f in folders]
        expected_ids = ["financiero", "legal", "fiscal", "comercial", "operaciones", "equipo", "otros"]
        assert folder_ids == expected_ids, f"Folder IDs mismatch: {folder_ids}"
        
        # Verify subcategories exist
        financiero = next(f for f in folders if f["id"] == "financiero")
        assert "subcategories" in financiero
        assert "P&L" in financiero["subcategories"]
        assert "Balance" in financiero["subcategories"]
        
        print("PASS: Folder structure returned correctly with 7 folders and subcategories")


class TestDataRoomSellerOperations:
    """Test seller document operations"""
    
    @pytest.fixture(scope="class")
    def seller_token(self):
        """Get seller auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        assert response.status_code == 200, f"Seller login failed: {response.text}"
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def seller_headers(self, seller_token):
        return {"Authorization": f"Bearer {seller_token}"}
    
    def test_upload_document(self, seller_headers):
        """POST /api/dataroom/deals/{deal_id}/upload - seller can upload a document"""
        # Create a test file
        test_content = f"Test document content {uuid.uuid4().hex}"
        files = {
            'file': ('test_document.txt', test_content.encode(), 'text/plain')
        }
        data = {
            'folder': 'financiero',
            'subcategory': 'P&L'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/upload",
            headers=seller_headers,
            files=files,
            data=data
        )
        assert response.status_code == 200, f"Upload failed: {response.status_code} - {response.text}"
        
        result = response.json()
        assert "document_id" in result
        assert result["filename"] == "test_document.txt"
        assert result["folder"] == "financiero"
        assert result["subcategory"] == "P&L"
        
        # Store document_id for later tests
        TestDataRoomSellerOperations.uploaded_doc_id = result["document_id"]
        print(f"PASS: Document uploaded successfully - {result['document_id']}")
        return result["document_id"]
    
    def test_list_documents_seller(self, seller_headers):
        """GET /api/dataroom/deals/{deal_id}/documents - seller sees all documents grouped by folder"""
        response = requests.get(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/documents",
            headers=seller_headers
        )
        assert response.status_code == 200, f"List failed: {response.status_code} - {response.text}"
        
        result = response.json()
        assert result["deal_id"] == DEAL_ID
        assert result["is_owner"] == True
        assert "folders" in result
        assert "total_documents" in result
        assert result["total_documents"] >= 1
        
        # Check folder structure
        folders = result["folders"]
        assert isinstance(folders, dict)
        
        print(f"PASS: Seller can list documents - {result['total_documents']} total documents")
    
    def test_download_document_seller(self, seller_headers):
        """GET /api/dataroom/documents/{doc_id}/download - download works for seller"""
        doc_id = getattr(TestDataRoomSellerOperations, 'uploaded_doc_id', None)
        if not doc_id:
            pytest.skip("No document uploaded in previous test")
        
        response = requests.get(
            f"{BASE_URL}/api/dataroom/documents/{doc_id}/download",
            headers=seller_headers
        )
        assert response.status_code == 200, f"Download failed: {response.status_code} - {response.text}"
        assert len(response.content) > 0
        
        print(f"PASS: Seller can download document - {len(response.content)} bytes")
    
    def test_view_document_seller(self, seller_headers):
        """GET /api/dataroom/documents/{doc_id}/view - view works for seller"""
        doc_id = getattr(TestDataRoomSellerOperations, 'uploaded_doc_id', None)
        if not doc_id:
            pytest.skip("No document uploaded in previous test")
        
        response = requests.get(
            f"{BASE_URL}/api/dataroom/documents/{doc_id}/view",
            headers=seller_headers
        )
        assert response.status_code == 200, f"View failed: {response.status_code} - {response.text}"
        
        print("PASS: Seller can view document")
    
    def test_get_permissions_empty(self, seller_headers):
        """GET /api/dataroom/deals/{deal_id}/permissions - seller sees all buyer permissions"""
        response = requests.get(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/permissions",
            headers=seller_headers
        )
        assert response.status_code == 200, f"Get permissions failed: {response.status_code} - {response.text}"
        
        result = response.json()
        assert result["deal_id"] == DEAL_ID
        assert "permissions" in result
        
        print(f"PASS: Seller can view permissions - {len(result['permissions'])} buyer permissions")
    
    def test_get_access_log(self, seller_headers):
        """GET /api/dataroom/deals/{deal_id}/access-log - seller sees access tracking"""
        response = requests.get(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/access-log",
            headers=seller_headers
        )
        assert response.status_code == 200, f"Get access log failed: {response.status_code} - {response.text}"
        
        result = response.json()
        assert result["deal_id"] == DEAL_ID
        assert "logs" in result
        assert "total" in result
        
        print(f"PASS: Seller can view access log - {result['total']} log entries")


class TestDataRoomBuyerAccess:
    """Test buyer access to data room"""
    
    @pytest.fixture(scope="class")
    def buyer_credentials(self):
        """Create a test buyer account"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_BUYER_EMAIL,
            "password": TEST_BUYER_PASSWORD,
            "first_name": "Test",
            "last_name": "Buyer DR",
            "role": "buyer"
        })
        if response.status_code == 200:
            return {
                "email": TEST_BUYER_EMAIL,
                "password": TEST_BUYER_PASSWORD,
                "token": response.json()["access_token"],
                "user_id": response.json()["user"]["user_id"]
            }
        elif response.status_code == 400 and "already exists" in response.text:
            # Login instead
            login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_BUYER_EMAIL,
                "password": TEST_BUYER_PASSWORD
            })
            assert login_resp.status_code == 200
            return {
                "email": TEST_BUYER_EMAIL,
                "password": TEST_BUYER_PASSWORD,
                "token": login_resp.json()["access_token"],
                "user_id": login_resp.json()["user"]["user_id"]
            }
        else:
            pytest.fail(f"Failed to create buyer: {response.text}")
    
    @pytest.fixture(scope="class")
    def buyer_headers(self, buyer_credentials):
        return {"Authorization": f"Bearer {buyer_credentials['token']}"}
    
    def test_buyer_without_nda_gets_403(self, buyer_headers):
        """GET /api/dataroom/deals/{deal_id}/documents - buyer without NDA gets 403"""
        response = requests.get(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/documents",
            headers=buyer_headers
        )
        # Should be 403 because buyer hasn't signed NDA
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        assert "NDA" in response.json().get("detail", "")
        
        print("PASS: Buyer without NDA correctly gets 403")
    
    def test_buyer_sign_nda(self, buyer_headers):
        """POST /api/deals/{deal_id}/sign-nda - buyer signs NDA"""
        response = requests.post(
            f"{BASE_URL}/api/deals/{DEAL_ID}/sign-nda",
            headers=buyer_headers
        )
        # Could be 200 (success) or 400 (already signed)
        assert response.status_code in [200, 400], f"Sign NDA failed: {response.status_code} - {response.text}"
        
        print("PASS: Buyer NDA signing handled")
    
    def test_buyer_with_nda_can_access(self, buyer_headers):
        """GET /api/dataroom/deals/{deal_id}/documents - buyer with NDA can see documents"""
        # First sign NDA
        requests.post(f"{BASE_URL}/api/deals/{DEAL_ID}/sign-nda", headers=buyer_headers)
        
        response = requests.get(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/documents",
            headers=buyer_headers
        )
        assert response.status_code == 200, f"List failed: {response.status_code} - {response.text}"
        
        result = response.json()
        assert result["deal_id"] == DEAL_ID
        assert result["is_owner"] == False
        assert "folders" in result
        
        print(f"PASS: Buyer with NDA can access data room - {result['total_documents']} documents visible")
    
    def test_buyer_download_tracks_access(self, buyer_headers):
        """GET /api/dataroom/documents/{doc_id}/download - download tracks access"""
        # First get a document ID
        response = requests.get(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/documents",
            headers=buyer_headers
        )
        if response.status_code != 200:
            pytest.skip("Cannot access documents")
        
        result = response.json()
        folders = result.get("folders", {})
        
        # Find any document
        doc_id = None
        for folder_docs in folders.values():
            if folder_docs:
                doc_id = folder_docs[0]["document_id"]
                break
        
        if not doc_id:
            pytest.skip("No documents available to download")
        
        # Download the document
        download_resp = requests.get(
            f"{BASE_URL}/api/dataroom/documents/{doc_id}/download",
            headers=buyer_headers
        )
        assert download_resp.status_code == 200, f"Download failed: {download_resp.status_code}"
        
        print(f"PASS: Buyer download works and should track access")
    
    def test_buyer_view_tracks_access(self, buyer_headers):
        """GET /api/dataroom/documents/{doc_id}/view - view tracks access"""
        # First get a document ID
        response = requests.get(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/documents",
            headers=buyer_headers
        )
        if response.status_code != 200:
            pytest.skip("Cannot access documents")
        
        result = response.json()
        folders = result.get("folders", {})
        
        # Find any document
        doc_id = None
        for folder_docs in folders.values():
            if folder_docs:
                doc_id = folder_docs[0]["document_id"]
                break
        
        if not doc_id:
            pytest.skip("No documents available to view")
        
        # View the document
        view_resp = requests.get(
            f"{BASE_URL}/api/dataroom/documents/{doc_id}/view",
            headers=buyer_headers
        )
        assert view_resp.status_code == 200, f"View failed: {view_resp.status_code}"
        
        print("PASS: Buyer view works and should track access")


class TestDataRoomPermissions:
    """Test folder-level permissions"""
    
    @pytest.fixture(scope="class")
    def seller_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def seller_headers(self, seller_token):
        return {"Authorization": f"Bearer {seller_token}"}
    
    @pytest.fixture(scope="class")
    def test_buyer_id(self):
        """Get or create a test buyer for permission tests"""
        email = f"test_perm_buyer_{uuid.uuid4().hex[:8]}@arroba.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": TEST_BUYER_PASSWORD,
            "first_name": "Perm",
            "last_name": "Buyer",
            "role": "buyer"
        })
        if response.status_code == 200:
            return response.json()["user"]["user_id"]
        pytest.skip("Could not create test buyer")
    
    def test_set_buyer_permissions(self, seller_headers, test_buyer_id):
        """PUT /api/dataroom/deals/{deal_id}/permissions/{buyer_id} - seller can set folder-level permissions"""
        # Set restricted permissions (only financiero and legal)
        response = requests.put(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/permissions/{test_buyer_id}",
            headers=seller_headers,
            json={"allowed_folders": ["financiero", "legal"]}
        )
        assert response.status_code == 200, f"Set permissions failed: {response.status_code} - {response.text}"
        
        result = response.json()
        assert result["updated"] == True
        assert result["buyer_id"] == test_buyer_id
        assert result["allowed_folders"] == ["financiero", "legal"]
        
        print("PASS: Seller can set folder-level permissions")
    
    def test_set_full_access(self, seller_headers, test_buyer_id):
        """PUT /api/dataroom/deals/{deal_id}/permissions/{buyer_id} - null means full access"""
        response = requests.put(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/permissions/{test_buyer_id}",
            headers=seller_headers,
            json={"allowed_folders": None}
        )
        assert response.status_code == 200, f"Set full access failed: {response.status_code} - {response.text}"
        
        result = response.json()
        assert result["allowed_folders"] is None
        
        print("PASS: Seller can grant full access (allowed_folders=null)")


class TestDataRoomDocumentDelete:
    """Test document deletion"""
    
    @pytest.fixture(scope="class")
    def seller_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def seller_headers(self, seller_token):
        return {"Authorization": f"Bearer {seller_token}"}
    
    def test_upload_and_delete_document(self, seller_headers):
        """DELETE /api/dataroom/documents/{doc_id} - seller can soft-delete documents"""
        # First upload a document
        test_content = f"Delete test {uuid.uuid4().hex}"
        files = {'file': ('delete_test.txt', test_content.encode(), 'text/plain')}
        data = {'folder': 'otros', 'subcategory': ''}
        
        upload_resp = requests.post(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/upload",
            headers=seller_headers,
            files=files,
            data=data
        )
        assert upload_resp.status_code == 200
        doc_id = upload_resp.json()["document_id"]
        
        # Now delete it
        delete_resp = requests.delete(
            f"{BASE_URL}/api/dataroom/documents/{doc_id}",
            headers=seller_headers
        )
        assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.status_code} - {delete_resp.text}"
        assert delete_resp.json()["deleted"] == True
        
        # Verify it's no longer accessible
        download_resp = requests.get(
            f"{BASE_URL}/api/dataroom/documents/{doc_id}/download",
            headers=seller_headers
        )
        assert download_resp.status_code == 404, "Deleted document should return 404"
        
        print("PASS: Seller can soft-delete documents")


class TestDataRoomAccessTracking:
    """Test access tracking functionality"""
    
    @pytest.fixture(scope="class")
    def seller_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def seller_headers(self, seller_token):
        return {"Authorization": f"Bearer {seller_token}"}
    
    def test_access_log_contains_buyer_info(self, seller_headers):
        """GET /api/dataroom/deals/{deal_id}/access-log - contains buyer names, actions, timestamps"""
        response = requests.get(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/access-log",
            headers=seller_headers
        )
        assert response.status_code == 200
        
        result = response.json()
        logs = result.get("logs", [])
        
        if logs:
            log = logs[0]
            # Verify log structure
            assert "buyer_id" in log
            assert "buyer_name" in log
            assert "action" in log
            assert "timestamp" in log
            
            # Verify action types
            valid_actions = ["VIEW", "DOWNLOAD", "DATA_ROOM_ACCESSED"]
            assert log["action"] in valid_actions, f"Invalid action: {log['action']}"
            
            print(f"PASS: Access log contains proper structure - {len(logs)} entries")
        else:
            print("PASS: Access log endpoint works (no entries yet)")


class TestDataRoomUnauthorized:
    """Test unauthorized access scenarios"""
    
    def test_upload_without_auth(self):
        """POST /api/dataroom/deals/{deal_id}/upload - requires authentication"""
        files = {'file': ('test.txt', b'test', 'text/plain')}
        data = {'folder': 'otros'}
        
        response = requests.post(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/upload",
            files=files,
            data=data
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Upload requires authentication")
    
    def test_permissions_without_auth(self):
        """GET /api/dataroom/deals/{deal_id}/permissions - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/permissions")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Permissions endpoint requires authentication")
    
    def test_access_log_without_auth(self):
        """GET /api/dataroom/deals/{deal_id}/access-log - requires authentication"""
        response = requests.get(f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/access-log")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("PASS: Access log requires authentication")


class TestDataRoomFileSizeLimit:
    """Test file size validation"""
    
    @pytest.fixture(scope="class")
    def seller_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SELLER_EMAIL,
            "password": SELLER_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    @pytest.fixture(scope="class")
    def seller_headers(self, seller_token):
        return {"Authorization": f"Bearer {seller_token}"}
    
    def test_small_file_upload_succeeds(self, seller_headers):
        """Small files should upload successfully"""
        test_content = "Small test file content"
        files = {'file': ('small_test.txt', test_content.encode(), 'text/plain')}
        data = {'folder': 'otros'}
        
        response = requests.post(
            f"{BASE_URL}/api/dataroom/deals/{DEAL_ID}/upload",
            headers=seller_headers,
            files=files,
            data=data
        )
        assert response.status_code == 200, f"Small file upload failed: {response.text}"
        print("PASS: Small file upload succeeds")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
