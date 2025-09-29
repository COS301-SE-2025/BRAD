import { Test, TestingModule } from '@nestjs/testing';
import { DomainSimilarityService } from './domain-similarity.service';

describe('DomainSimilarityService', () => {
  let service: DomainSimilarityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DomainSimilarityService],
    }).compile();

    service = module.get<DomainSimilarityService>(DomainSimilarityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
