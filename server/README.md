# API contract

Implement these server endpoints with Supabase/PostgreSQL and server-side authentication:

GET /api/frames
GET /api/services
POST /api/bookings
POST /api/frame-orders
POST /api/uploads/sign
POST /api/payments/create-order
POST /api/payments/webhook
GET /api/admin/frames
PATCH /api/admin/frames/:id
GET /api/admin/bookings
PATCH /api/admin/bookings/:id
GET /api/admin/frame-orders
PATCH /api/admin/frame-orders/:id

All admin endpoints require an authenticated admin role. Never expose database service-role keys to the browser. Validate every request server-side.
