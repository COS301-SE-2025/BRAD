import unittest
from unittest.mock import patch, MagicMock
import socket
import ssl
from datetime import datetime

import utils.metadata as metadata  # Actual import

class TestGatherForensics(unittest.TestCase):

    @patch('utils.metadata.socket.gethostbyname')
    @patch('utils.metadata.whois.whois')
    @patch('utils.metadata.get_ssl_info')
    @patch('utils.metadata.get_dns_records')
    @patch('utils.metadata.socket.gethostbyaddr')
    def test_gather_forensics_all_success(self, mock_gethostbyaddr, mock_get_dns_records,
                                        mock_get_ssl_info, mock_whois, mock_gethostbyname):
        mock_gethostbyname.return_value = '93.184.216.34'

        mock_data = {
            'registrar': 'Registrar Inc',
            'org': 'Example Org',
            'name': None
        }
        mock_whois_result = MagicMock(**mock_data)
        mock_whois_result.items.return_value = mock_data.items()
        mock_whois.return_value = mock_whois_result

        mock_get_ssl_info.return_value = {"valid": True, "expires": "2024-12-31T23:59:59"}
        mock_get_dns_records.return_value = {
            'MX': ['mx1.example.com.'],
            'NS': ['ns1.example.com.'],
            'TXT': ['v=spf1 include:_spf.example.com ~all']
        }
        mock_gethostbyaddr.return_value = ('reverse.example.com', [], [])

        result = metadata.gather_forensics('https://www.example.com/path')

        self.assertEqual(result['ip'], '93.184.216.34')
        self.assertEqual(result['reverseIp'], 'reverse.example.com')
        self.assertEqual(result['registrar'], 'Registrar Inc')
        self.assertEqual(result['whoisOwner'], 'Example Org')
        self.assertIn('registrar', result['whoisRaw'])
        self.assertTrue(result['sslValid'])
        self.assertEqual(result['sslExpires'], "2024-12-31T23:59:59")
        self.assertIn('MX', result['dns'])


    @patch('utils.metadata.socket.gethostbyname')
    def test_gather_forensics_ip_lookup_fail(self, mock_gethostbyname):
        mock_gethostbyname.side_effect = socket.gaierror('Name or service not known')

        with patch('utils.metadata.whois.whois', side_effect=Exception("fail")), \
             patch('utils.metadata.get_ssl_info', return_value={"valid": False, "expires": "Unknown"}), \
             patch('utils.metadata.get_dns_records', return_value={}), \
             patch('utils.metadata.socket.gethostbyaddr', side_effect=socket.herror):
            result = metadata.gather_forensics('invalid-domain')

        self.assertEqual(result['ip'], 'Unavailable')
        self.assertEqual(result['reverseIp'], 'Unknown')
        self.assertEqual(result['registrar'], 'Unavailable')
        self.assertEqual(result['whoisOwner'], 'Unknown')
        self.assertEqual(result['whoisRaw'], {})
        self.assertFalse(result['sslValid'])
        self.assertEqual(result['sslExpires'], 'Unknown')
        self.assertEqual(result['dns'], {})

    @patch('utils.metadata.whois.whois')
    @patch('utils.metadata.socket.gethostbyname')
    def test_gather_forensics_whois_partial_data(self, mock_gethostbyname, mock_whois):
        mock_gethostbyname.return_value = '1.2.3.4'
        mock = MagicMock()
        mock.registrar = None
        mock.org = None
        mock.name = 'Owner Name'
        mock.__iter__.return_value = iter({'registrar': None, 'org': None, 'name': 'Owner Name'}.items())
        mock.items.return_value = {'registrar': None, 'org': None, 'name': 'Owner Name'}.items()
        mock_whois.return_value = mock
        with patch('utils.metadata.get_ssl_info', return_value={"valid": True, "expires": "2024-01-01T00:00:00"}), \
             patch('utils.metadata.get_dns_records', return_value={'MX': [], 'NS': [], 'TXT': []}), \
             patch('utils.metadata.socket.gethostbyaddr', return_value=('rev.domain', [], [])):
            result = metadata.gather_forensics('example.com')

        self.assertEqual(result['registrar'], 'Unavailable')
        self.assertEqual(result['whoisOwner'], 'Owner Name')

    @patch('utils.metadata.ssl.create_default_context')
    @patch('utils.metadata.socket.socket')
    def test_get_ssl_info_success(self, mock_socket_class, mock_ssl_context):
        mock_socket = MagicMock()
        mock_socket.getpeercert.return_value = {
            "notAfter": "Dec 31 23:59:59 2024 GMT"
        }
        mock_socket_class.return_value = mock_socket

        mock_ctx = MagicMock()
        mock_ctx.wrap_socket.return_value.__enter__.return_value = mock_socket
        mock_ssl_context.return_value = mock_ctx

        result = metadata.get_ssl_info('example.com')

        self.assertTrue(result['valid'])
        self.assertEqual(result['expires'], "2024-12-31T23:59:59")

    @patch('utils.metadata.ssl.create_default_context')
    def test_get_ssl_info_failure(self, mock_ssl_context):
        mock_ssl_context.side_effect = Exception("SSL context failure")

        result = metadata.get_ssl_info('example.com')
        self.assertFalse(result['valid'])
        self.assertEqual(result['expires'], "Unknown")

    @patch('utils.metadata.dns.resolver.resolve')
    def test_get_dns_records_success_and_failure(self, mock_resolve):
        def side_effect(domain, record_type):
            if record_type == 'MX':
                r = MagicMock()
                r.to_text.return_value = '10 mail.example.com.'
                return [r]
            elif record_type == 'NS':
                raise Exception("No NS record")
            elif record_type == 'TXT':
                r = MagicMock()
                r.to_text.return_value = '"v=spf1 include:_spf.example.com ~all"'
                return [r]
            else:
                return []

        mock_resolve.side_effect = side_effect

        result = metadata.get_dns_records('example.com')

        self.assertIn('MX', result)
        self.assertEqual(result['MX'], ['10 mail.example.com.'])
        self.assertIn('NS', result)
        self.assertTrue(result['NS'][0].startswith("Unavailable:"))
        self.assertIn('TXT', result)
        self.assertEqual(result['TXT'], ['"v=spf1 include:_spf.example.com ~all"'])

if __name__ == '__main__':
    unittest.main()
