import { Injectable, NotFoundException } from '@nestjs/common';
import * as whois from 'whois-json';
import * as dns from 'dns/promises';

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
}
