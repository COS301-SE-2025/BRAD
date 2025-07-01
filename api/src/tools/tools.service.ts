import { Injectable, NotFoundException } from '@nestjs/common';
import * as whois from 'whois-json';
import * as dns from 'dns/promises';
import * as tls from 'tls';
import * as https from 'https';
//import * as net from 'net';

@Injectable()
export class ToolsService {
  async performWhoisLookup(domain: string): Promise<any> {
    try {
      const result = await whois(domain);
      if (!result || Object.keys(result).length === 0) {
        throw new NotFoundException('WHOIS data not found');
      }
      return result;
    } catch (err) {
      throw new NotFoundException('Failed to retrieve WHOIS data');
    }
  }

  async performReverseDns(ip: string): Promise<any> {
    try {
      const hostnames = await dns.reverse(ip);
      return { ip, hostnames };
    } catch (err) {
      throw new NotFoundException(`No reverse DNS found for IP: ${ip}`);
    }
  }

  async getSslCertificateInfo(domain: string): Promise<any> {
    const port = 443;

    return new Promise((resolve, reject) => {
      const socket = tls.connect(port, domain, { servername: domain, timeout: 5000 }, () => {
        const cert = socket.getPeerCertificate(true);

        if (!cert || Object.keys(cert).length === 0) {
          reject(new NotFoundException(`No certificate found for ${domain}`));
        } else {
          resolve({
            subject: cert.subject,
            issuer: cert.issuer,
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            serialNumber: cert.serialNumber,
            fingerprint: cert.fingerprint,
          });
        }

        socket.end();
      });

      socket.on('error', () => {
        reject(new NotFoundException(`Could not retrieve SSL info for ${domain}`));
      });

      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new NotFoundException(`SSL request to ${domain} timed out`));
      });
    });
  }

  async getIpGeolocation(ip: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = `https://ipwho.is/${ip}`;

      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (!json.success) {
              return reject(new NotFoundException(json.message || 'IP not found'));
            }

            resolve({
              ip: json.ip,
              city: json.city,
              region: json.region,
              country: json.country,
              continent: json.continent,
              latitude: json.latitude,
              longitude: json.longitude,
              isp: json.connection?.isp,
              org: json.connection?.org,
              timezone: json.timezone,
            });
          } catch (e) {
            reject(new NotFoundException('Failed to parse geolocation response'));
          }
        });
      }).on('error', () => {
        reject(new NotFoundException(`Failed to fetch IP info for ${ip}`));
      });
    });
  }

  
}
