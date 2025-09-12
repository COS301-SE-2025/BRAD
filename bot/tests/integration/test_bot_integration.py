import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime
import bot

class TestBotIntegration(unittest.TestCase):

    @patch('bot.report_analysis') # only mocking external request
    def test_full_bot_run_end_to_end(self, mock_patch):
        # Setup a fake API PATCH response
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_patch.return_value = mock_response

        # Simulate a real pending report (skip mocking fetch)
        test_report = {
            "_id": "integration-test-id",
            "domain": "httpbin.org"  # safe test domain
        }

        # Patch `fetch_pending_report` inline here for isolation
        with patch('bot.fetch_pending_report', return_value=test_report):

            with patch('builtins.print') as mock_print:
                bot.run_bot(run_once=True)

        # Ensure patch request was called with expected keys
        mock_patch.assert_called_once()
        request_json = mock_patch.call_args.kwargs['json']
        self.assertIn("analysis", request_json)
        self.assertIn("scrapingInfo", request_json)
        self.assertIn("abuseFlags", request_json)
        self.assertEqual(request_json["analysisStatus"], "done")

        # Check prints for success
        printed_lines = [call.args[0] for call in mock_print.call_args_list]
        self.assertTrue(any("Analyzing" in line for line in printed_lines))
        self.assertTrue(any("Submitted analysis" in line for line in printed_lines))

        # Check analysis structure
        analysis = request_json["analysis"]
        self.assertEqual(analysis["domain"], "httpbin.org")
        self.assertIsInstance(datetime.fromisoformat(analysis["scannedAt"]), datetime)

        # Check scraping info
        scraping = request_json["scrapingInfo"]
        self.assertIn("title", scraping)
        self.assertIn("structuredInfo", scraping)

        # Check abuse flags
        flags = request_json["abuseFlags"]
        self.assertIsInstance(flags, dict)

if __name__ == '__main__':
    unittest.main()
