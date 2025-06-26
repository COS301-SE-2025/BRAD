import unittest
from unittest.mock import patch, MagicMock
from bs4 import BeautifulSoup

# Assuming the function is in a module named scraping_module
from utils.analysis import perform_scraping

class TestPerformScraping(unittest.TestCase):

    @patch("utils.analysis.sync_playwright")
    def test_basic_scraping_flow(self, mock_playwright):
            # Setup mocks
            mock_p = MagicMock()
            mock_browser = MagicMock()
            mock_page = MagicMock()
            mock_response = MagicMock()

            # Redirect chain
            mock_request = MagicMock()
            mock_redirected_from = MagicMock()
            mock_request.url = "https://redirect1.com"
            mock_redirected_from.url = "https://redirect2.com"
            mock_request.redirected_from = None
            mock_redirected_from.redirected_from = mock_request
            mock_response.request = mock_redirected_from

            mock_page.goto.return_value = mock_response
            mock_page.url = "https://example.com/final"
            html_content = """
            <html>
                <head>
                    <title>Test Page</title>
                    <meta http-equiv="refresh" content="5; url=https://redirect.com">
                </head>
                <body onload="alert('load')">
                    <h1>Main Heading</h1>
                    <h2>Subheading</h2>
                    <h3>Another Heading</h3>
                    <a href="/link1">Link1</a>
                    <a href="https://external.com/link2">Link2</a>
                    <form action="/submit"></form>
                    <form></form>
                    <script>console.log("safe script");</script>
                    <script>eval("alert('bad')");</script>
                    <script>var x = "base64encoded";</script>
                </body>
            </html>
            """
            mock_page.content.return_value = html_content
            mock_page.screenshot.return_value = None

            mock_p.chromium.launch.return_value = mock_browser
            mock_browser.new_page.return_value = mock_page
            mock_playwright.return_value.__enter__.return_value = mock_p

            # Run function
            scraping_info, abuse_flags = perform_scraping("https://example.com")

            # Validate scraping_info
            self.assertEqual(scraping_info["title"], "Test Page")
            self.assertIn("<h1>Main Heading</h1>", scraping_info["htmlRaw"])
            self.assertEqual(scraping_info["screenshotPath"], "/tmp/screenshot.png")
            self.assertListEqual(scraping_info["structuredInfo"]["headings"], ["Main Heading", "Subheading", "Another Heading"])
            expected_links = ["https://example.com/link1", "https://external.com/link2"]
            self.assertListEqual(scraping_info["structuredInfo"]["links"], expected_links)
            self.assertIn("https://example.com/submit", scraping_info["structuredInfo"]["forms"])
            self.assertIn("https://example.com", scraping_info["structuredInfo"]["forms"])
            self.assertListEqual(scraping_info["crawledLinks"], expected_links)

            # Validate abuse_flags
            self.assertTrue(any("eval" in js for js in abuse_flags["suspiciousJS"]))
            self.assertTrue(abuse_flags["obfuscatedScripts"])
            self.assertTrue(abuse_flags["usesMetaRefresh"])
            self.assertTrue(any("onload" in d for d in abuse_flags["suspiciousInlineEvents"]))

            expected_redirect_chain = [
                "https://redirect1.com",
                "https://example.com/final"
            ]

            self.assertListEqual(abuse_flags["redirectChain"], expected_redirect_chain)

    @patch("utils.analysis.sync_playwright")
    def test_no_title_and_no_scripts(self, mock_playwright):
        # Setup mocks for playwright context
        mock_p = MagicMock()
        mock_browser = MagicMock()
        mock_page = MagicMock()
        mock_response = MagicMock()

        mock_response.request = None
        mock_page.goto.return_value = mock_response
        mock_page.url = "https://example.com"
        # HTML with no title, no scripts, no meta refresh
        html_content = """
        <html>
            <head></head>
            <body>
                <h1>Heading1</h1>
                <a href="/link"></a>
                <form action="/formaction"></form>
            </body>
        </html>
        """
        mock_page.content.return_value = html_content
        mock_page.screenshot.return_value = None

        mock_p.chromium.launch.return_value = mock_browser
        mock_browser.new_page.return_value = mock_page
        mock_playwright.return_value.__enter__.return_value = mock_p

        scraping_info, abuse_flags = perform_scraping("https://example.com")

        # Title fallback
        self.assertEqual(scraping_info["title"], "No title")

        # No suspiciousJS or obfuscatedScripts
        self.assertListEqual(abuse_flags["suspiciousJS"], [])
        self.assertFalse(abuse_flags["obfuscatedScripts"])

        # No meta refresh
        self.assertFalse(abuse_flags["usesMetaRefresh"])

        # redirectChain contains only final url because no redirects and no request
        self.assertListEqual(abuse_flags["redirectChain"], ["https://example.com"])

        # suspiciousInlineEvents empty
        self.assertListEqual(abuse_flags["suspiciousInlineEvents"], [])

        # Check headings
        self.assertListEqual(scraping_info["structuredInfo"]["headings"], ["Heading1"])

        # Check links resolved correctly
        self.assertListEqual(scraping_info["structuredInfo"]["links"], ["https://example.com/link"])

        # Check forms
        self.assertListEqual(scraping_info["structuredInfo"]["forms"], ["https://example.com/formaction"])

    @patch("utils.analysis.sync_playwright")
    def test_handles_exception_and_closes_browser(self, mock_playwright):
        # Setup mocks to raise exception on goto
        mock_p = MagicMock()
        mock_browser = MagicMock()
        mock_page = MagicMock()

        def raise_timeout(*args, **kwargs):
            raise Exception("Timeout")

        mock_page.goto.side_effect = raise_timeout
        mock_p.chromium.launch.return_value = mock_browser
        mock_browser.new_page.return_value = mock_page
        mock_playwright.return_value.__enter__.return_value = mock_p

        # Call function and expect exception to propagate
        with self.assertRaises(Exception) as context:
            perform_scraping("https://example.com")

        self.assertIn("Timeout", str(context.exception))
        # browser.close should be called despite exception
        mock_browser.close.assert_called_once()

if __name__ == "__main__":
    unittest.main()
