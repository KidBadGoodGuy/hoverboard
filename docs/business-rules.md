# HOVERBOARD V1 Business Rules

## Roles

There are exactly two V1 roles: Solo DJ and Client.

## DJ Rules

A DJ must have a DJ profile before receiving bookings. A DJ can accept or decline booking requests. A DJ can view upcoming and historical gigs and receives payment through the payment system after a completed gig.

## Client Rules

A client can search and filter DJs, view public DJ information, request a booking, pay for an accepted booking, view bookings, and review a DJ after a completed gig.

## Booking Rules

A booking belongs to exactly one DJ and one client. A request begins as `requested`. The DJ may accept or decline it. Payment is required after acceptance. A successful payment changes the booking to `confirmed`. After the gig is completed, the booking becomes `completed` and the DJ payment process can proceed.

## Reviews

Reviews are associated with completed bookings. A client reviews the DJ they booked.

## Payments

Stripe handles payment processing. HOVERBOARD must not store sensitive payment card information directly.

## Scope Rule

No V1 feature may introduce teams, venues, other performer types, GPS verification, QR verification, AI matching, payroll, or other explicitly future systems without an approved scope change.
