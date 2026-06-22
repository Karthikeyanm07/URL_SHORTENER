// Sets test environment variables so the app doesn't crash on import.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/urlshortener_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-must-be-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '7d';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.COOKIE_SECRET = 'test-cookie-secret-must-be-at-least-32-chars';
process.env.PORT = '5001';