#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta
import os

class NucleusAPITester:
    def __init__(self):
        # Use the public backend URL from frontend/.env
        self.base_url = "https://diet-companion-63.preview.emergentagent.com/api"
        self.session_token = "test_session_1772574502972"  # From MongoDB setup
        self.user_id = "test-user-1772574502971"
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.session_token}'
        }
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=self.headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=self.headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=self.headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=self.headers)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            return False, {}

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("=" * 50)
        print("🔐 Testing Authentication Endpoints")
        print("=" * 50)
        
        # Test GET /auth/me
        success, user_data = self.run_test(
            "Get current user",
            "GET", 
            "auth/me",
            200
        )
        
        if success:
            print(f"   User: {user_data.get('name', 'Unknown')}")
            print(f"   Email: {user_data.get('email', 'Unknown')}")
        
        return success

    def test_habit_endpoints(self):
        """Test habit management endpoints"""
        print("=" * 50)
        print("🎯 Testing Habit Management Endpoints")
        print("=" * 50)
        
        habit_id = None
        
        # Test GET /habits (empty initially)
        self.run_test("Get habits (empty)", "GET", "habits", 200)
        
        # Test POST /habits
        habit_data = {
            "name": "Test Habit",
            "color": "#7C9A6E", 
            "icon": "check",
            "group": "Morning",
            "why_started": "For testing purposes"
        }
        
        success, response = self.run_test(
            "Create habit",
            "POST",
            "habits", 
            200,  # Note: Based on code, POST returns 200, not 201
            habit_data
        )
        
        if success and 'habit_id' in response:
            habit_id = response['habit_id']
            print(f"   Created habit ID: {habit_id}")
        
        # Test GET /habits (should have one habit)
        self.run_test("Get habits (with data)", "GET", "habits", 200)
        
        if habit_id:
            # Test POST /habits/{id}/toggle
            today = datetime.now().strftime("%Y-%m-%d")
            toggle_data = {
                "date": today,
                "completed": True,
                "freeze": False
            }
            
            self.run_test(
                "Toggle habit completion",
                "POST",
                f"habits/{habit_id}/toggle",
                200,
                toggle_data
            )
            
            # Test PUT /habits/{id}
            update_data = {
                "name": "Updated Test Habit",
                "color": "#C1714A"
            }
            
            self.run_test(
                "Update habit",
                "PUT",
                f"habits/{habit_id}",
                200,
                update_data
            )
            
            # Test DELETE /habits/{id}
            self.run_test(
                "Delete habit",
                "DELETE",
                f"habits/{habit_id}",
                200
            )
        
        return habit_id is not None

    def test_task_endpoints(self):
        """Test task management endpoints"""
        print("=" * 50)
        print("📋 Testing Task Management Endpoints")
        print("=" * 50)
        
        task_id = None
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Test GET /tasks
        self.run_test("Get tasks", "GET", "tasks", 200, params={"date": today})
        
        # Test POST /tasks
        task_data = {
            "title": "Test Task",
            "estimated_time": 30,
            "priority": "important",
            "scheduled_time": "09:00",
            "tags": ["test"],
            "date": today
        }
        
        success, response = self.run_test(
            "Create task",
            "POST",
            "tasks",
            200,
            task_data
        )
        
        if success and 'task_id' in response:
            task_id = response['task_id']
            print(f"   Created task ID: {task_id}")
        
        if task_id:
            # Test PUT /tasks/{id}
            update_data = {
                "completed": True
            }
            
            self.run_test(
                "Update task (toggle completion)",
                "PUT",
                f"tasks/{task_id}",
                200,
                update_data
            )
            
            # Test DELETE /tasks/{id}
            self.run_test(
                "Delete task",
                "DELETE",
                f"tasks/{task_id}",
                200
            )
        
        return task_id is not None

    def test_braindump_endpoints(self):
        """Test brain dump endpoints"""
        print("=" * 50)
        print("🧠 Testing Brain Dump Endpoints")
        print("=" * 50)
        
        today = datetime.now().strftime("%Y-%m-%d")
        item_id = None
        
        # Test GET /brain-dump
        self.run_test("Get brain dump items", "GET", "brain-dump", 200, params={"date": today})
        
        # Test POST /brain-dump
        dump_data = {
            "text": "Test brain dump item",
            "date": today
        }
        
        success, response = self.run_test(
            "Create brain dump item",
            "POST",
            "brain-dump",
            200,
            dump_data
        )
        
        if success and 'item_id' in response:
            item_id = response['item_id']
            print(f"   Created item ID: {item_id}")
        
        if item_id:
            # Test DELETE /brain-dump/{id}
            self.run_test(
                "Delete brain dump item",
                "DELETE",
                f"brain-dump/{item_id}",
                200
            )
        
        return item_id is not None

    def test_intention_endpoints(self):
        """Test daily intention endpoints"""
        print("=" * 50)
        print("🎯 Testing Daily Intention Endpoints")
        print("=" * 50)
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Test GET /intention/{date}
        self.run_test(
            "Get daily intention (empty)",
            "GET",
            f"intention/{today}",
            200
        )
        
        # Test PUT /intention/{date}
        intention_data = {
            "intention": "Test daily intention"
        }
        
        self.run_test(
            "Update daily intention",
            "PUT",
            f"intention/{today}",
            200,
            intention_data
        )
        
        # Test GET /intention/{date} again
        success, response = self.run_test(
            "Get daily intention (with data)",
            "GET",
            f"intention/{today}",
            200
        )
        
        return success and response.get('intention') == "Test daily intention"

    def test_stats_endpoint(self):
        """Test stats endpoint"""
        print("=" * 50)
        print("📊 Testing Stats Endpoint")
        print("=" * 50)
        
        success, stats = self.run_test("Get user stats", "GET", "stats", 200)
        
        if success:
            expected_fields = ['habits_streak', 'habits_total', 'tasks_completed', 'tasks_total', 
                             'ideas_captured', 'words_collected', 'links_saved']
            for field in expected_fields:
                if field in stats:
                    print(f"   {field}: {stats[field]}")
                else:
                    print(f"   Missing field: {field}")
                    return False
        
        return success
    
    def test_link_vault_endpoints(self):
        """Test Link Vault endpoints"""
        print("=" * 50)
        print("🔗 Testing Link Vault Endpoints")
        print("=" * 50)
        
        link_id = None
        
        # Test GET /links
        self.run_test("Get links (empty)", "GET", "links", 200)
        
        # Test POST /links - Create a link
        link_data = {
            "url": "https://example.com/test-article",
            "title": "Test Article for Backend Testing",
            "category": "article",
            "source": "manual",
            "note": "This is a test link for API testing"
        }
        
        success, response = self.run_test("Create link", "POST", "links", 200, link_data)
        
        if success and 'link_id' in response:
            link_id = response['link_id']
            print(f"   Created link ID: {link_id}")
        
        if link_id:
            # Test PUT /links/{id} - Update link status
            update_data = {"status": "reviewed"}
            self.run_test("Update link status", "PUT", f"links/{link_id}", 200, update_data)
            
            # Test DELETE /links/{id}
            self.run_test("Delete link", "DELETE", f"links/{link_id}", 200)
        
        return link_id is not None
    
    def test_calorie_tracker_endpoints(self):
        """Test Calorie Tracker endpoints with AI estimation"""
        print("=" * 50)
        print("🍎 Testing Calorie Tracker Endpoints")
        print("=" * 50)
        
        today = datetime.now().strftime("%Y-%m-%d")
        log_id = None
        
        # Test GET /calories
        self.run_test("Get calorie logs", "GET", "calories", 200, params={"date": today})
        
        # Test POST /calories - Log a meal
        meal_data = {
            "description": "2 slices of toast with butter and jam, 1 cup of coffee",
            "date": today,
            "meal_type": "breakfast"
        }
        
        success, response = self.run_test("Log meal", "POST", "calories", 200, meal_data)
        
        if success and 'log_id' in response:
            log_id = response['log_id']
            print(f"   Created calorie log ID: {log_id}")
        
        if log_id:
            # Test POST /calories/{id}/estimate - AI calorie estimation
            print("   🤖 Testing AI calorie estimation...")
            success, estimated = self.run_test("AI estimate calories", "POST", f"calories/{log_id}/estimate", 200)
            
            if success and estimated.get('calories'):
                print(f"   AI estimated: {estimated.get('calories')} calories")
            
            # Test GET /calories/daily-summary/{date}
            success, summary = self.run_test("Get daily calorie summary", "GET", f"calories/daily-summary/{today}", 200)
            
            if success:
                total_calories = summary.get('total_calories', 0)
                meals = summary.get('meals', 0)
                print(f"   Daily summary: {total_calories} calories from {meals} meals")
            
            # Clean up
            self.run_test("Delete calorie log", "DELETE", f"calories/{log_id}", 200)
        
        return log_id is not None
    
    def test_vocabulary_endpoints(self):
        """Test Vocabulary Bank endpoints with AI generation"""
        print("=" * 50)
        print("📚 Testing Vocabulary Bank Endpoints")
        print("=" * 50)
        
        word_id = None
        
        # Test GET /vocabulary
        self.run_test("Get vocabulary (empty)", "GET", "vocabulary", 200)
        
        # Test POST /vocabulary - Add a word
        word_data = {
            "word": "serendipity",
            "source_context": "Found in a novel during testing",
            "tags": ["rare", "test"]
        }
        
        success, response = self.run_test("Add word", "POST", "vocabulary", 200, word_data)
        
        if success and 'word_id' in response:
            word_id = response['word_id']
            print(f"   Created word ID: {word_id}")
        
        if word_id:
            # Test POST /vocabulary/{id}/generate - AI definition generation
            print("   🤖 Testing AI definition generation...")
            success, generated = self.run_test("Generate definition", "POST", f"vocabulary/{word_id}/generate", 200)
            
            if success and generated.get('definition'):
                print(f"   AI generated definition: {generated.get('definition')[:100]}...")
            
            # Test PUT /vocabulary/{id} - Update mastery level
            update_data = {"mastery_level": "familiar"}
            self.run_test("Update word mastery", "PUT", f"vocabulary/{word_id}", 200, update_data)
            
            # Test GET /vocabulary/word-of-day
            self.run_test("Get word of day", "GET", "vocabulary/word-of-day", 200)
            
            # Clean up
            self.run_test("Delete word", "DELETE", f"vocabulary/{word_id}", 200)
        
        return word_id is not None
    
    def test_ideas_endpoints(self):
        """Test Ideas Notepad endpoints with AI expansion"""
        print("=" * 50)
        print("💡 Testing Ideas Notepad Endpoints")
        print("=" * 50)
        
        idea_id = None
        
        # Test GET /ideas
        self.run_test("Get ideas (empty)", "GET", "ideas", 200)
        
        # Test POST /ideas - Create an idea
        idea_data = {
            "title": "AI-powered testing framework",
            "content": "Initial idea for automated testing",
            "idea_type": "project",
            "tags": ["AI", "testing"]
        }
        
        success, response = self.run_test("Create idea", "POST", "ideas", 200, idea_data)
        
        if success and 'idea_id' in response:
            idea_id = response['idea_id']
            print(f"   Created idea ID: {idea_id}")
        
        if idea_id:
            # Test POST /ideas/{id}/expand - AI idea expansion
            print("   🤖 Testing AI idea expansion...")
            success, expanded = self.run_test("Expand idea with AI", "POST", f"ideas/{idea_id}/expand", 200)
            
            if success and expanded.get('content'):
                print(f"   AI expanded content: {len(expanded.get('content', ''))} characters")
            
            # Test PUT /ideas/{id} - Update status
            update_data = {"status": "in-progress", "starred": True}
            self.run_test("Update idea status", "PUT", f"ideas/{idea_id}", 200, update_data)
            
            # Test GET /ideas/resurface
            self.run_test("Get resurfaced idea", "GET", "ideas/resurface", 200)
            
            # Clean up
            self.run_test("Delete idea", "DELETE", f"ideas/{idea_id}", 200)
        
        return idea_id is not None
    
    def test_bq_practice_endpoints(self):
        """Test BQ Practice endpoints with AI feedback"""
        print("=" * 50)
        print("🎤 Testing BQ Practice Endpoints")
        print("=" * 50)
        
        answer_id = None
        
        # Test GET /bq/questions
        success, questions = self.run_test("Get BQ questions", "GET", "bq/questions", 200)
        
        if not success or not questions:
            print("   No questions available for testing")
            return False
        
        question = questions[0]  # Use first available question
        
        # Test POST /bq/answers - Create STAR answer
        answer_data = {
            "question_id": question.get('question_id', 'default_0'),
            "question_text": question.get('question'),
            "situation": "During my role as a software tester, our team faced a critical bug just before release",
            "task": "I needed to coordinate with developers to identify and fix the issue within 24 hours",
            "action": "I organized testing sessions, documented all findings, and facilitated communication between teams",
            "result": "We successfully identified and fixed the bug, releasing on schedule with zero customer-facing issues",
            "tags": ["problem-solving", "teamwork"]
        }
        
        success, response = self.run_test("Create STAR answer", "POST", "bq/answers", 200, answer_data)
        
        if success and 'answer_id' in response:
            answer_id = response['answer_id']
            print(f"   Created answer ID: {answer_id}")
        
        if answer_id:
            # Test POST /bq/answers/{id}/feedback - AI feedback
            print("   🤖 Testing AI feedback generation...")
            success, feedback = self.run_test("Get AI feedback", "POST", f"bq/answers/{answer_id}/feedback", 200)
            
            if success and feedback.get('ai_feedback'):
                print(f"   AI feedback received: {len(feedback.get('ai_feedback', ''))} characters")
            
            # Test GET /bq/answers
            self.run_test("Get BQ answers", "GET", "bq/answers", 200)
            
            # Test GET /bq/practice-session
            self.run_test("Get practice session", "GET", "bq/practice-session", 200)
            
            # Clean up
            self.run_test("Delete BQ answer", "DELETE", f"bq/answers/{answer_id}", 200)
        
        return answer_id is not None
    
    def test_global_search_endpoint(self):
        """Test Global Search endpoint"""
        print("=" * 50)
        print("🔍 Testing Global Search Endpoint")
        print("=" * 50)
        
        # Test GET /search?q=test
        success, results = self.run_test("Global search", "GET", "search", 200, params={"q": "test"})
        
        if success:
            results_count = len(results.get('results', []))
            query = results.get('query', '')
            print(f"   Search for '{query}' found {results_count} results")
        
        return success
    
    def test_weekly_review_endpoint(self):
        """Test Weekly Review endpoint"""
        print("=" * 50)
        print("📅 Testing Weekly Review Endpoint")
        print("=" * 50)
        
        # Test POST /weekly-review - Generate weekly review
        week_start = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        review_data = {"week_start": week_start}
        
        print("   🤖 Testing AI weekly review generation...")
        success, review = self.run_test("Generate weekly review", "POST", "weekly-review", 200, review_data)
        
        if success and review.get('summary'):
            print(f"   AI generated review: {len(review.get('summary', ''))} characters")
            stats = review.get('stats', {})
            print(f"   Stats: {stats}")
        
        # Test GET /weekly-reviews
        self.run_test("Get weekly reviews", "GET", "weekly-reviews", 200)
        
        return success
    
    def test_export_endpoints(self):
        """Test Export endpoints"""
        print("=" * 50)
        print("📤 Testing Export Endpoints")
        print("=" * 50)
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Test GET /export/daily-note/{date}
        success, daily_note = self.run_test("Export daily note", "GET", f"export/daily-note/{today}", 200)
        
        if success and daily_note.get('content'):
            print(f"   Daily note exported: {len(daily_note.get('content', ''))} characters")
        
        # Test GET /export/all-data
        success, all_data = self.run_test("Export all data", "GET", "export/all-data", 200)
        
        if success and isinstance(all_data, dict):
            data_keys = list(all_data.keys())
            print(f"   Full export includes: {len(data_keys)} data categories")
            print(f"   Categories: {', '.join(data_keys[:5])}...")
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Nucleus API Tests")
        print(f"Backend URL: {self.base_url}")
        print(f"Session Token: {self.session_token[:20]}...")
        print("=" * 80)
        
        # Test authentication first
        auth_success = self.test_auth_endpoints()
        if not auth_success:
            print("❌ Authentication failed - stopping tests")
            return False
        
        # Run all endpoint tests - Phase 1
        self.test_habit_endpoints()
        self.test_task_endpoints() 
        self.test_braindump_endpoints()
        self.test_intention_endpoints()
        
        # Phase 2: Link Vault and Calorie Tracker with AI
        self.test_link_vault_endpoints()
        self.test_calorie_tracker_endpoints()
        
        # Phase 3: Vocabulary and Ideas with AI
        self.test_vocabulary_endpoints()
        self.test_ideas_endpoints()
        
        # Phase 4: BQ Practice, Global Search, Weekly Review, Export
        self.test_bq_practice_endpoints()
        self.test_global_search_endpoint()
        self.test_weekly_review_endpoint()
        self.test_export_endpoints()
        
        self.test_stats_endpoint()
        
        # Print summary
        print("=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = NucleusAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)