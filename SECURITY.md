# Security rules

- Never put Razorpay secret keys, database credentials, admin passwords or session secrets in frontend code.
- Admin authorization must be enforced by the server/API, not by a React state variable.
- Validate all uploaded images by MIME type, size and server-side processing before storage.
- Customer uploads should not be publicly enumerable.
- Verify payment signatures/webhooks on the server before marking an order paid.
- Use HTTPS, secure cookies, CSRF protection where applicable, rate limiting and audit logs.
