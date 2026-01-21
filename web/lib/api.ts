import ky from 'ky';

// Base API configuration
export const api = ky.create({
    prefixUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    timeout: 10000,
    retry: {
        limit: 2,
        methods: ['get'],
        statusCodes: [408, 413, 429, 500, 502, 503, 504],
    },
    hooks: {
        beforeRequest: [
            (request) => {
                // TODO: Inject Clerk token here
                request.headers.set('Authorization', 'Bearer mock-token');
            },
        ],
    },
});

// Helper types for API responses
export interface ApiResponse<T> {
    data: T;
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
    };
}
