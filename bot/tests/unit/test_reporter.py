import unittest
from unittest.mock import patch, MagicMock
import requests

from utils.reporter import fetch_pending_report, MAX_RETRIES, RETRY_BACKOFF

class TestFetchPendingReport(unittest.TestCase):

    @patch('utils.reporter.requests.get')
    def test_success_status_200_returns_json(self, mock_get):
        expected_json = {"report": "data"}
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = expected_json
        mock_get.return_value = mock_response

        result = fetch_pending_report("http://api.test", headers={"Authorization": "token"})
        self.assertEqual(result, expected_json)

    @patch('utils.reporter.requests.get')
    def test_status_204_returns_none(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 204
        mock_get.return_value = mock_response

        result = fetch_pending_report("http://api.test", headers={})
        self.assertIsNone(result)

    @patch('utils.reporter.requests.get')
    def test_unexpected_status_code_raises_runtime_error(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_get.return_value = mock_response

        with self.assertRaises(RuntimeError) as context:
            fetch_pending_report("http://api.test", headers={})
        self.assertIn("Unexpected status code: 500", str(context.exception))

    @patch('utils.reporter.time.sleep', return_value=None)
    @patch('utils.reporter.requests.get')
    def test_request_exception_retries_and_eventually_raises(self, mock_get, mock_sleep):
        mock_get.side_effect = requests.exceptions.RequestException("Network error")

        with self.assertRaises(RuntimeError) as context:
            fetch_pending_report("http://api.test", headers={})
        self.assertIn("Failed to fetch pending report", str(context.exception))
        self.assertEqual(mock_get.call_count, MAX_RETRIES)

        for i, call in enumerate(mock_sleep.call_args_list):
            self.assertAlmostEqual(call[0][0], RETRY_BACKOFF * (2 ** i))

    @patch('utils.reporter.requests.get')
    def test_verbose_prints_status(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"key": "value"}
        mock_get.return_value = mock_response

        with patch('builtins.print') as mock_print:
            fetch_pending_report("http://api.test", headers={}, verbose=True)
            mock_print.assert_any_call("[FETCH] Attempt 1, Status: 200")

    @patch('utils.reporter.time.sleep', return_value=None)
    @patch('utils.reporter.requests.get')
    def test_verbose_prints_retry_messages(self, mock_get, mock_sleep):
        def side_effect(*args, **kwargs):
            if mock_get.call_count < 3:
                raise requests.exceptions.RequestException("Timeout")
            else:
                mock_response = MagicMock()
                mock_response.status_code = 200
                mock_response.json.return_value = {"ok": True}
                return mock_response

        mock_get.side_effect = side_effect

        with patch('builtins.print') as mock_print:
            result = fetch_pending_report("http://api.test", headers={}, verbose=True)

        self.assertEqual(result, {"ok": True})
        retry_msgs = [call for call in mock_print.call_args_list if "Request failed" in call[0][0]]
        self.assertEqual(len(retry_msgs), 2)

if __name__ == '__main__':
    unittest.main()
