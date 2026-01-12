#!/usr/bin/env python3
"""
Backend API Testing for Arabic Document Archival System
نظام الأرشفة الإلكترونية للوثائق - مديرية زراعة صلاح الدين

Tests all backend APIs including:
- Authentication (register, login)
- Document management with AI processing
- Search functionality
- Statistics
- Health checks
"""

import requests
import json
import base64
import time
from datetime import datetime
from typing import Dict, Any, Optional
import sys

# Backend URL from environment configuration
BACKEND_URL = "https://farmland-docs.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_user_id = None
        self.test_document_id = None
        self.results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "errors": []
        }
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_api_call(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                     expected_status: int = 200, test_name: str = "") -> Dict[str, Any]:
        """Make API call and validate response"""
        self.results["total_tests"] += 1
        
        try:
            url = f"{self.base_url}{endpoint}"
            self.log(f"Testing {test_name}: {method} {url}")
            
            if method.upper() == "GET":
                response = self.session.get(url, params=data)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            self.log(f"Response Status: {response.status_code}")
            
            if response.status_code == expected_status:
                self.results["passed"] += 1
                self.log(f"✅ {test_name} - PASSED")
                try:
                    return {"success": True, "data": response.json(), "status": response.status_code}
                except:
                    return {"success": True, "data": response.text, "status": response.status_code}
            else:
                self.results["failed"] += 1
                error_msg = f"❌ {test_name} - FAILED: Expected {expected_status}, got {response.status_code}"
                self.log(error_msg)
                self.results["errors"].append(error_msg)
                try:
                    error_data = response.json()
                except:
                    error_data = response.text
                return {"success": False, "data": error_data, "status": response.status_code}
                
        except Exception as e:
            self.results["failed"] += 1
            error_msg = f"❌ {test_name} - ERROR: {str(e)}"
            self.log(error_msg)
            self.results["errors"].append(error_msg)
            return {"success": False, "error": str(e)}

    def create_test_image_base64(self) -> str:
        """Create a simple test image in base64 format"""
        # Create a simple 100x100 white image with some Arabic text simulation
        from PIL import Image, ImageDraw, ImageFont
        import io
        
        try:
            # Create a simple white image
            img = Image.new('RGB', (200, 100), color='white')
            draw = ImageDraw.Draw(img)
            
            # Add some text (simulating Arabic document)
            draw.text((10, 10), "وثيقة اختبار", fill='black')
            draw.text((10, 30), "Test Document", fill='black')
            draw.text((10, 50), "مديرية زراعة صلاح الدين", fill='black')
            
            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return img_base64
            
        except Exception as e:
            self.log(f"Error creating test image: {e}")
            # Fallback: create minimal base64 image
            return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

    def test_health_endpoints(self):
        """Test health check endpoints"""
        self.log("\n=== Testing Health Check Endpoints ===")
        
        # Test root endpoint
        result = self.test_api_call("GET", "/", test_name="Root Endpoint")
        if result["success"]:
            self.log(f"Root response: {result['data']}")
            
        # Test health endpoint
        result = self.test_api_call("GET", "/health", test_name="Health Check")
        if result["success"]:
            self.log(f"Health response: {result['data']}")

    def test_authentication(self):
        """Test authentication endpoints"""
        self.log("\n=== Testing Authentication Endpoints ===")
        
        # Test user registration
        test_user = {
            "username": f"testuser_{int(time.time())}",
            "password": "testpass123",
            "full_name": "مستخدم اختبار",
            "role": "موظف"
        }
        
        result = self.test_api_call("POST", "/auth/register", test_user, 
                                  expected_status=200, test_name="User Registration")
        
        if result["success"]:
            self.test_user_id = result["data"].get("id")
            self.log(f"Created user ID: {self.test_user_id}")
            
            # Test login with created user
            login_data = {
                "username": test_user["username"],
                "password": test_user["password"]
            }
            
            result = self.test_api_call("POST", "/auth/login", login_data,
                                      expected_status=200, test_name="User Login")
            
            if result["success"]:
                self.log(f"Login successful: {result['data']}")
        
        # Test duplicate registration (should fail)
        result = self.test_api_call("POST", "/auth/register", test_user,
                                  expected_status=400, test_name="Duplicate Registration")
        
        # Test invalid login
        invalid_login = {
            "username": "nonexistent",
            "password": "wrongpass"
        }
        result = self.test_api_call("POST", "/auth/login", invalid_login,
                                  expected_status=401, test_name="Invalid Login")

    def test_document_upload_with_ai(self):
        """Test document upload with AI processing"""
        self.log("\n=== Testing Document Upload with AI Processing ===")
        
        if not self.test_user_id:
            self.log("⚠️ No test user available, creating one for document tests")
            test_user = {
                "username": f"docuser_{int(time.time())}",
                "password": "testpass123",
                "full_name": "مستخدم الوثائق",
                "role": "موظف"
            }
            result = self.test_api_call("POST", "/auth/register", test_user)
            if result["success"]:
                self.test_user_id = result["data"].get("id")
        
        # Create test document with image
        test_image_base64 = self.create_test_image_base64()
        
        document_data = {
            "title": "وثيقة اختبار - سند ملكية",
            "description": "وثيقة اختبار لنظام الأرشفة الإلكترونية",
            "file_type": "image",
            "file_data": test_image_base64,
            "category": "سند ملكية",
            "owner_name": "أحمد محمد علي",
            "land_type": "زراعي",
            "location": "صلاح الدين - تكريت",
            "notes": "وثيقة اختبار للنظام",
            "uploaded_by": self.test_user_id or "test_user"
        }
        
        result = self.test_api_call("POST", "/documents", document_data,
                                  expected_status=200, test_name="Document Upload with AI")
        
        if result["success"]:
            self.test_document_id = result["data"].get("id")
            self.log(f"Created document ID: {self.test_document_id}")
            
            # Check AI processing results
            doc_data = result["data"]
            self.log(f"AI Processing Results:")
            self.log(f"  - Extracted Text: {doc_data.get('extracted_text', 'N/A')[:100]}...")
            self.log(f"  - Auto Category: {doc_data.get('auto_category', 'N/A')}")
            self.log(f"  - Summary: {doc_data.get('summary', 'N/A')}")
            self.log(f"  - Keywords: {doc_data.get('keywords', [])}")
            
            # Verify AI features are working
            if doc_data.get('auto_category') and doc_data.get('auto_category') != 'خطأ في التصنيف':
                self.log("✅ AI Classification working")
            else:
                self.log("⚠️ AI Classification may have issues")
                
            if doc_data.get('summary'):
                self.log("✅ AI Summary generation working")
            else:
                self.log("⚠️ AI Summary generation may have issues")

    def test_document_crud(self):
        """Test document CRUD operations"""
        self.log("\n=== Testing Document CRUD Operations ===")
        
        # Test get all documents
        result = self.test_api_call("GET", "/documents", test_name="Get All Documents")
        if result["success"]:
            docs = result["data"]
            self.log(f"Found {len(docs)} documents")
        
        # Test get single document
        if self.test_document_id:
            result = self.test_api_call("GET", f"/documents/{self.test_document_id}",
                                      test_name="Get Single Document")
            if result["success"]:
                self.log(f"Retrieved document: {result['data']['title']}")
            
            # Test update document
            update_data = {
                "title": "وثيقة محدثة - سند ملكية",
                "notes": "تم تحديث الوثيقة"
            }
            result = self.test_api_call("PUT", f"/documents/{self.test_document_id}",
                                      update_data, test_name="Update Document")
            if result["success"]:
                self.log(f"Updated document title: {result['data']['title']}")
        
        # Test get non-existent document
        result = self.test_api_call("GET", "/documents/nonexistent",
                                  expected_status=404, test_name="Get Non-existent Document")

    def test_document_search(self):
        """Test document search functionality"""
        self.log("\n=== Testing Document Search ===")
        
        # Test basic search
        search_data = {
            "query": "اختبار",
            "category": None,
            "land_type": None
        }
        
        result = self.test_api_call("POST", "/documents/search", search_data,
                                  test_name="Basic Search")
        if result["success"]:
            search_results = result["data"]
            self.log(f"Search found {search_results.get('count', 0)} results")
        
        # Test filtered search
        filtered_search = {
            "query": "سند",
            "category": "سند ملكية",
            "land_type": "زراعي"
        }
        
        result = self.test_api_call("POST", "/documents/search", filtered_search,
                                  test_name="Filtered Search")
        if result["success"]:
            search_results = result["data"]
            self.log(f"Filtered search found {search_results.get('count', 0)} results")

    def test_statistics(self):
        """Test statistics endpoint"""
        self.log("\n=== Testing Statistics API ===")
        
        result = self.test_api_call("GET", "/stats", test_name="Get Statistics")
        if result["success"]:
            stats = result["data"]
            self.log(f"Statistics:")
            self.log(f"  - Total Documents: {stats.get('total_documents', 0)}")
            self.log(f"  - Total Users: {stats.get('total_users', 0)}")
            self.log(f"  - Categories: {stats.get('by_category', {})}")
            self.log(f"  - Recent Documents: {len(stats.get('recent_documents', []))}")

    def test_document_deletion(self):
        """Test document deletion (run last to clean up)"""
        self.log("\n=== Testing Document Deletion ===")
        
        if self.test_document_id:
            result = self.test_api_call("DELETE", f"/documents/{self.test_document_id}",
                                      test_name="Delete Document")
            if result["success"]:
                self.log(f"Successfully deleted document: {self.test_document_id}")
        
        # Test delete non-existent document
        result = self.test_api_call("DELETE", "/documents/nonexistent",
                                  expected_status=404, test_name="Delete Non-existent Document")

    def run_all_tests(self):
        """Run all backend tests"""
        self.log("🚀 Starting Backend API Testing for Arabic Document Archival System")
        self.log(f"Backend URL: {self.base_url}")
        
        start_time = time.time()
        
        try:
            # Run tests in order
            self.test_health_endpoints()
            self.test_authentication()
            self.test_document_upload_with_ai()
            self.test_document_crud()
            self.test_document_search()
            self.test_statistics()
            self.test_document_deletion()
            
        except Exception as e:
            self.log(f"Critical error during testing: {e}", "ERROR")
            self.results["errors"].append(f"Critical error: {str(e)}")
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print final results
        self.log("\n" + "="*60)
        self.log("📊 FINAL TEST RESULTS")
        self.log("="*60)
        self.log(f"Total Tests: {self.results['total_tests']}")
        self.log(f"Passed: {self.results['passed']} ✅")
        self.log(f"Failed: {self.results['failed']} ❌")
        self.log(f"Success Rate: {(self.results['passed']/self.results['total_tests']*100):.1f}%")
        self.log(f"Duration: {duration:.2f} seconds")
        
        if self.results["errors"]:
            self.log("\n🔍 ERRORS ENCOUNTERED:")
            for error in self.results["errors"]:
                self.log(f"  - {error}")
        
        self.log("="*60)
        
        return self.results

def main():
    """Main function to run tests"""
    tester = BackendTester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    if results["failed"] > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()