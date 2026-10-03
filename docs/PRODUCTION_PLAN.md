# Devesh Digital Studio — Production Plan

## Core data
- users: customer profile and contact details
- admins: secure admin accounts/roles
- frames: catalogue, images, sizes, prices, availability
- services: wedding/pre-wedding/video/drone services and pricing
- bookings: event date, location, service, customer, status, payment status
- frame_orders: selected frame, uploaded photo, quantity, delivery details, status, payment status

## Customer flow
1. Browse frames/services
2. Upload photo for frame preview
3. Create frame order
4. Request wedding booking
5. Receive confirmation/status
6. Pay securely online or choose configured payment option

## Admin flow
1. Secure login
2. Dashboard
3. CRUD frames and services
4. Upload/replace catalogue images
5. Edit prices without app update
6. Manage bookings/orders/status
7. View customer details
8. Configure WhatsApp/contact settings
9. Review payment state

## Production requirements
- Server-side authorization; never trust client-side admin flags
- Database-backed prices and inventory
- Object storage for customer/catalogue images
- Signed/private URLs for customer uploads where supported
- Server-side payment verification and webhook handling
- Input validation, rate limiting and audit logs
- HTTPS and environment secrets
- Backups and error logging
- No payment credentials in source control

## Recommended deployment
Frontend: Vercel/Cloudflare Pages
API: managed serverless/API service
Database: PostgreSQL/Supabase
Storage: Supabase Storage/S3-compatible object storage
Payments: Razorpay/UPI-capable gateway after merchant onboarding
Notifications: WhatsApp Business/API or controlled click-to-chat fallback
