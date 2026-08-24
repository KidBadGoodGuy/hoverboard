# HOVERBOARD V1 API Notes

This document will record backend/API behavior as the application is implemented.

## Current Status

No production API has been implemented yet. Step 1 establishes the documentation structure only.

## Planned Backend Responsibilities

The backend will eventually support:

- Authentication and authorization through Supabase
- DJ profile management
- Client profile management
- DJ discovery and filtering
- Booking creation and status changes
- Payment-state coordination with Stripe
- Reviews

## Security

Protected operations must verify the authenticated user and their role. Sensitive credentials and Stripe secrets must remain server-side.

## Documentation Rule

Whenever an API or backend contract is implemented, document its purpose, inputs, outputs, authentication requirements, authorization rules, and error behavior here.
