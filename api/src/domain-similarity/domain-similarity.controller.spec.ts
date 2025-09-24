import { Test, TestingModule } from '@nestjs/testing';
import { DomainSimilarityController } from './domain-similarity.controller';

describe('DomainSimilarityController', () => {
  let controller: DomainSimilarityController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DomainSimilarityController],
    }).compile();

    controller = module.get<DomainSimilarityController>(DomainSimilarityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
