import unittest
from unittest.mock import patch
from src.bot import generate_analysis, perform_scraping, gather_forensics, run_bot

class TestBot(unittest.TestCase):

    def test_generate_analysis_contains_required_fields(self):
        domain = "test.com"
        result = generate_analysis(domain)

        self.assertEqual(result["domain"], domain)
        self.assertIn("scannedAt", result)
        self.assertIn("riskScore", result)
        self.assertIn("title", result)
        self.assertIn("ip", result)
        self.assertIn("registrar", result)

    def test_scraping_returns_expected_fields(self):
        data = perform_scraping("test.com")
        self.assertIn("title", data)
        self.assertIn("malwareDetected", data)
        self.assertIn("summary", data)

    def test_forensics_returns_expected_fields(self):
        data = gather_forensics("test.com")
        self.assertIn("ip", data)
        self.assertIn("registrar", data)
        self.assertIn("sslValid", data)
        self.assertIn("whoisOwner", data)

    @patch("src.bot.requests.get")
    def test_handle_no_pending_reports(self, mock_get):
        mock_get.return_value.status_code = 204

        with patch("src.bot.time.sleep", return_value=None), \
             patch("builtins.print") as mock_print:
            try:
                run_bot(run_once=True)
            except KeyboardInterrupt:
                pass

            mock_print.assert_any_call("No pending reports. Waiting...")

    @patch("src.bot.requests.post")
    @patch("src.bot.requests.get")
    def test_submit_analysis_success(self, mock_get, mock_post):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "id": 42,
            "domain": "malicious.com"
        }
        mock_post.return_value.status_code = 200

        with patch("src.bot.time.sleep", return_value=None), \
            patch("builtins.print") as mock_print:
            run_bot(run_once=True)

            mock_post.assert_called_once()
            args, kwargs = mock_post.call_args
            self.assertIn("/analyzed-report", args[0])
            self.assertEqual(kwargs["json"]["id"], 42)
    
