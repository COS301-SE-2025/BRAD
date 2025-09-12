// api/jest.config.ts
export default {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    testEnvironment: 'node',
    roots: ['<rootDir>/src', '<rootDir>/test'], // pick up unit/integration tests
  };
  