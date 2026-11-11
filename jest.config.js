/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          strict: true,
          esModuleInterop: true,
          module: 'commonjs',
          moduleResolution: 'node',
          types: ['jest', 'node'],
        },
      },
    ],
  },
  testPathIgnorePatterns: ['/node_modules/'],
};
