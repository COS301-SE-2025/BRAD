import unittest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone

import bot  # Ensure this matches your actual file name (bot.py)


class TestBotFunctions(unittest.TestCase):

    def test_generate_analysis_basic(self):
        domain = "example.com"
        with patch('bot.gather_forensics', return_value={"forensicKey": "forensicValue"}), \
             patch('bot.perform_scraping', return_value=({"scrapeKey": "scrapeValue"}, {"flag1": True})):

            analysis, scraping_info, abuse_flags = bot.generate_analysis(domain)

            self.assertEqual(analysis["domain"], domain)
            self.assertIn("scannedAt", analysis)
            self.assertEqual(analysis["forensicKey"], "forensicValue")
            self.assertEqual(analysis["riskScore"], 20)
            self.assertEqual(scraping_info, {"scrapeKey": "scrapeValue"})
            self.assertEqual(abuse_flags, {"flag1": True})

            dt = datetime.fromisoformat(analysis["scannedAt"])
            self.assertIsInstance(dt, datetime)
            self.assertEqual(dt.tzinfo, timezone.utc)

    def test_generate_analysis_with_bank_domain(self):
        domain = "mybank.com"
        with patch('bot.gather_forensics', return_value={}), \
             patch('bot.perform_scraping', return_value=({}, {})):

            analysis, _, _ = bot.generate_analysis(domain)
            self.assertEqual(analysis["riskScore"], 100)

    def test_serialize_various_types(self):
        dt = datetime(2020, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        obj = {
            "a": 1,
            "b": [1, 2, {"c": dt}],
            "d": dt,
            "e": "string"
        }
        serialized = bot.serialize(obj)
        self.assertEqual(serialized["a"], 1)
        self.assertEqual(serialized["b"][2]["c"], dt.isoformat())
        self.assertEqual(serialized["d"], dt.isoformat())
        self.assertEqual(serialized["e"], "string")

    @patch('bot.requests.patch')
    def test_report_analysis_success(self, mock_patch):
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_patch.return_value = mock_response

        report_id = "123"
        analysis_data = {"key": "value"}
        scraping_info = {"scrape": True}
        abuse_flags = {"flag": False}

        result = bot.report_analysis(report_id, analysis_data, scraping_info, abuse_flags)

        self.assertTrue(result)
        mock_patch.assert_called_once()
        args, kwargs = mock_patch.call_args
        self.assertIn(f"/reports/{report_id}/analysis", args[0])
        self.assertIn("json", kwargs)
        self.assertEqual(kwargs["json"]["analysis"], analysis_data)
        self.assertEqual(kwargs["json"]["analysisStatus"], "done")

    @patch('bot.requests.patch')
    def test_report_analysis_failure(self, mock_patch):
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = Exception("HTTP error")
        mock_patch.return_value = mock_response

        result = bot.report_analysis("id", {}, {}, {})
        self.assertFalse(result)

    @patch('bot.fetch_pending_report')
    @patch('bot.report_analysis')
    @patch('bot.generate_analysis')
    @patch('time.sleep', return_value=None)
    def test_run_bot_processes_report(self, mock_sleep, mock_generate_analysis, mock_report_analysis, mock_fetch_report):
        report = {"_id": "r1", "domain": "example.com"}
        mock_fetch_report.return_value = report
        mock_generate_analysis.return_value = ({"analysis": True}, {"scraping": True}, {"flags": True})
        mock_report_analysis.return_value = True

        with patch('builtins.print') as mock_print:
            bot.run_bot(run_once=True)

            mock_fetch_report.assert_called_once()
            mock_generate_analysis.assert_called_once_with("example.com")
            mock_report_analysis.assert_called_once_with("r1",
                                                         {"analysis": True},
                                                         {"scraping": True},
                                                         {"flags": True})

            printed = [call.args[0] for call in mock_print.call_args_list]
            self.assertTrue(any("[BOT] Analyzing: example.com (ID: r1)" in line for line in printed))
            self.assertTrue(any("[BOT] Submitted analysis for report r1" in line for line in printed))

    @patch('bot.fetch_pending_report')
    @patch('time.sleep', return_value=None)
    def test_run_bot_no_pending_reports(self, mock_sleep, mock_fetch_report):
        mock_fetch_report.return_value = None

        with patch('builtins.print') as mock_print:
            bot.run_bot(run_once=True)

            mock_fetch_report.assert_called_once()
            printed = [call.args[0] for call in mock_print.call_args_list]
            self.assertIn("No pending reports.", printed)

    @patch('bot.fetch_pending_report')
    @patch('time.sleep', return_value=None)
    def test_run_bot_handles_exception(self, mock_sleep, mock_fetch_report):
        mock_fetch_report.side_effect = Exception("fetch error")

        with patch('builtins.print') as mock_print:
            bot.run_bot(run_once=True)

            printed = [call.args[0] for call in mock_print.call_args_list]
            self.assertTrue(any("Error: fetch error" in line for line in printed))


if __name__ == '__main__':
    unittest.main()
