import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class QueueService {
  constructor(private readonly http: HttpService) {}

  async queueToFastAPI(domain: string, reportId: string) {
    const fastApiUrl = process.env.FASTAPI_URL;
    const payload = { domain, report_id: reportId };

    try {
      const res = await firstValueFrom(
        this.http.post(`${fastApiUrl}/queue`, payload),
      );
      return res.data;
    } catch (err) {
      console.error('[QueueService] Failed to queue:', err.message);
      throw err;
    }
  }
}

