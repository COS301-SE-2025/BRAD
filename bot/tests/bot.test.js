const {
  performScraping,
  gatherForensics,
  generateAnalysis
} = require('../src/bot');

describe('Bot Analysis Mocks', () => {
  const testDomain = 'malicious-example.com';

  test('performScraping returns expected fields', () => {
    const result = performScraping(testDomain);

    expect(result).toHaveProperty('title');
    expect(result).toHaveProperty('malwareDetected');
    expect(result).toHaveProperty('summary');
    expect(typeof result.title).toBe('string');
    expect(typeof result.malwareDetected).toBe('boolean');
  });

  test('gatherForensics returns IP and WHOIS data', () => {
    const result = gatherForensics(testDomain);

    expect(result).toHaveProperty('ip');
    expect(result).toHaveProperty('registrar');
    expect(result).toHaveProperty('sslValid');
    expect(result).toHaveProperty('whoisOwner');
    expect(typeof result.ip).toBe('string');
  });

  test('generateAnalysis includes all combined data', () => {
    const result = generateAnalysis(testDomain);

    expect(result).toMatchObject({
      domain: testDomain,
      title: expect.any(String),
      ip: expect.any(String),
      riskScore: expect.any(Number)
    });

    expect(result).toHaveProperty('scannedAt');
    expect(new Date(result.scannedAt).toISOString()).toBe(result.scannedAt);
  });
});
