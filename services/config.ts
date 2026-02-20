/**
 * CarCard API Configuration
 *
 * Centralized API base URL and endpoint management.
 *
 * HOW TO USE:
 * 1. For local development with backend on same machine:
 *    - Set BACKEND_HOST to your machine's local IP (e.g. '192.168.1.5')
 *    - Run backend with: cd backend && npm run dev
 *
 * 2. For ngrok tunnel:
 *    - Run: ngrok http 5000
 *    - Copy the forwarding URL and set BACKEND_HOST below
 *    - e.g. BACKEND_HOST = 'your-tunnel-id.ngrok-free.dev'
 *    - Set USE_HTTPS = true
 *
 * 3. For production:
 *    - Set BACKEND_HOST to your production domain
 */

// ═══════════════════════════════════════════════════════════
// ▸ CHANGE THIS to match your current backend address
// ═══════════════════════════════════════════════════════════
const BACKEND_HOST = '192.168.1.40'; // ← Your local Wi-Fi IP (found via ipconfig)
const BACKEND_PORT = 5000;           // ← Backend port (ignored for ngrok)
const USE_HTTPS = false;             // ← true for ngrok / production
// ═══════════════════════════════════════════════════════════

const protocol = USE_HTTPS ? 'https' : 'http';
const portSuffix = USE_HTTPS ? '' : `:${BACKEND_PORT}`;

export const API_BASE_URL = `${protocol}://${BACKEND_HOST}${portSuffix}/api`;

/**
 * Centralized API endpoint paths.
 * All stores should reference these instead of hardcoding strings.
 */
export const ENDPOINTS = {
    // Auth
    AUTH_SEND_OTP: '/auth/send-otp',
    AUTH_VERIFY_OTP: '/auth/verify-otp',

    // Tags
    TAGS: '/tags',
    TAGS_ACTIVATE: '/tags/activate',
    TAGS_PUBLIC: (id: string) => `/tags/public/${id}`,
    TAGS_UPDATE: (id: string) => `/tags/${id}`,
    TAGS_PRIVACY: (id: string) => `/tags/${id}/privacy`,
    TAGS_OTP_SEND: (id: string) => `/tags/${id}/otp/send`,
    TAGS_OTP_VERIFY: (id: string) => `/tags/${id}/otp/verify`,

    // Shop
    SHOP_PRODUCTS: '/shop/products',
    SHOP_ORDERS: '/shop/orders',

    // Admin
    ADMIN_TAGS: '/admin/tags/generate',
} as const;
