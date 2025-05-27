import unittest
from unittest.mock import patch, MagicMock
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src')))

from bot import generate_analysis, perform_scraping, gather_forensics, run_bot

class TestBot(unittest.TestCase):

    def setUp(self):
        self.test_domain = "test.com"

    def tearDown(self):
        pass

    def test_generate_analysis_structure(self):
        result = generate_analysis(self.test_domain)

        self.assertEqual(result["domain"], self.test_domain)
        self.assertIsInstance(result["scannedAt"], str)
        self.assertIn("riskScore", result)
        self.assertIn("title", result)
        self.assertIn("ip", result)
        self.assertIn("registrar", result)
        self.assertIn("sslValid", result)
        self.assertIn("whoisOwner", result)

    def test_perform_scraping_returns_expected_fields(self):
        data = perform_scraping(self.test_domain)
        self.assertIn("title", data)
        self.assertIn("malwareDetected", data)
        self.assertIn("summary", data)
        self.assertIsInstance(data["malwareDetected"], bool)

    def test_gather_forensics_returns_expected_fields(self):
        data = gather_forensics(self.test_domain)
        self.assertIn("ip", data)
        self.assertIn("registrar", data)
        self.assertIn("sslValid", data)
        self.assertIn("whoisOwner", data)

    @patch("bot.requests.get")
    def test_run_bot_with_no_pending_reports(self, mock_get):
        mock_get.return_value.status_code = 204

        with patch("bot.time.sleep", return_value=None), \
             patch("builtins.print") as mock_print:
            run_bot(run_once=True)
            mock_print.assert_any_call("No pending reports. Waiting...")

    @patch("bot.requests.post")
    @patch("bot.requests.get")
    def test_run_bot_processes_pending_report_successfully(self, mock_get, mock_post):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "_id": "abc123",
            "domain": "malicious.com"
        }

        mock_post.return_value.status_code = 200

        with patch("bot.time.sleep", return_value=None), \
             patch("builtins.print") as mock_print:
            run_bot(run_once=True)

            mock_post.assert_called_once()
            url = mock_post.call_args[0][0]
            data = mock_post.call_args[1]["json"]

            self.assertIn("/analyzed-report", url)
            self.assertEqual(data["id"], "abc123")
            self.assertIn("analysis", data)

            mock_print.assert_any_call("Report ID abc123 analyzed and saved.\n")

    @patch("bot.requests.post")
    @patch("bot.requests.get")
    def test_run_bot_handles_analysis_failure(self, mock_get, mock_post):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "_id": "xyz999",
            "domain": "fail.com"
        }

        mock_post.return_value.status_code = 500

        with patch("bot.time.sleep", return_value=None), \
             patch("builtins.print") as mock_print:
            run_bot(run_once=True)

            mock_post.assert_called_once()
            mock_print.assert_any_call("Failed to submit analysis: 500")

