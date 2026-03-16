// Middleware removed — auth is handled at the page level in each dashboard route.
// Each server component calls auth() and redirects to /login if unauthenticated.
export const config = { matcher: [] }
