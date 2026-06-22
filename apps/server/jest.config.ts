import type {Config} from 'jest';

const config: Config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
	},
	setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
	testMatch: ['**/src/tests/**/*.test.ts'],
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/tests/**',
		'!src/app.ts',
	],
};

export default config;