import { Injectable, NotFoundException } from '@nestjs/common';
import * as whois from 'whois-json';

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
}
