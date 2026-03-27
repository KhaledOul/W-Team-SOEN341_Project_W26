export default {
  testEnvironment: 'node',
  clearMocks: true,
  transform: {},
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/setup/'],
  collectCoverageFrom: ['src/**/*.js', '!src/index.js'],
  coverageReporters: ['lcov', 'text-summary'],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
};
