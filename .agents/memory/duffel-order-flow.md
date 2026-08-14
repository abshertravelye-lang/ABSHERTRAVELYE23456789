---
name: Duffel order flow
description: How real Duffel flight booking works end-to-end in absher-travel
---

## Rule
POST /api/flights/book handles both real Duffel orders and mock/fallback bookings.

## How it works
1. Frontend (flight-ticket.tsx) calls POST /api/flights/book with:
   - providerSlug, providerOfferId, passengers[], adults, children, totalPrice, currency
2. Backend (routes/flights.ts) detects if it's a real Duffel offer (slug="duffel", ID starts with "off_")
3. If Duffel: calls GET /air/offers/{id} to get fresh passenger IDs, then POST /air/orders with "balance" payment
4. If fallback (mock, expired, or no credentials): saves pending booking to DB
5. Returns { orderId, bookingReference, bookingId }

## Passenger mapping
- Duffel offer passengers have IDs (pas_...) that must be matched by index to our PassengerInfo
- PassengerInfo now includes: givenName, familyName, title, gender, dob, email, phone, passport, nationality
- Required for Duffel: givenName, familyName, title, gender, dob, email, phone_number
- Optional: passport (identity_documents not sent currently — add later if needed)

## Key files
- Backend route: artifacts/api-server/src/routes/flights.ts → POST /flights/book
- DuffelMapper.ts: DuffelOffer now includes passengers?: DuffelOfferPassenger[]
- Frontend: artifacts/absher-travel/src/components/flight-ticket.tsx
  - handleConfirm is async, uses direct fetch("/api/flights/book")
  - duffelBookingRef state holds real PNR when booking succeeds
  - Falls back gracefully to local ref if API fails

## Why balance payment
Duffel "balance" payment type uses the account's pre-funded balance (works in test mode). Real card payment would need a separate payment intent flow.

## Validation (hasMinData)
Requires all 7 fields: givenName, familyName, title, gender, dob, email, phone for first passenger.
