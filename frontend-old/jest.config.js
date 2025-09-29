export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  moduleNameMapper: {
  '\\.(css|less|scss)$': 'identity-obj-proxy',
  '\\.(png|jpg|svg|pdf)$': '<rootDir>/_mocks_/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
