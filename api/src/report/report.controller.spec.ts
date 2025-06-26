import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';

describe('ReportController', () => {
  let controller: ReportController;
  let mockReportService: {
    getReports: jest.Mock;
  };

  beforeEach(async () => {
    mockReportService = {
      getReports: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        {
          provide: ReportService,
          useValue: mockReportService,
        },
      ],
    }).compile();

    controller = module.get<ReportController>(ReportController);
  });

  describe('getReports', () => {
    it('should call reportService.getReports with userId and role', async () => {
      const mockReports = [{ domain: 'test.com' }];
      mockReportService.getReports.mockResolvedValue(mockReports);

      const mockRequest = {
        user: { id: 'user123', role: 'general' } as JwtPayload,
      } as any;

      const result = await controller.getReports(mockRequest);

      expect(mockReportService.getReports).toHaveBeenCalledWith('user123', 'general');
      expect(result).toEqual(mockReports);
    });
  });
});
