# Security Specification - Cosmic English Learning App

## 1. Data Invariants
- A User document must match the authenticating user's UID.
- Points cannot be modified by the user directly to gain arbitrarily high values (though currently client-side logic is used, rules should at least check types).
- Pets, Notes, and Logs must strictly belong to the `userId` in their path.
- Logs are immutable once created.
- Timestamps must be validated against `request.time`.

## 2. The "Dirty Dozen" Logic Leaks
1. **Identity Spoofing**: User A tries to read User B's profile by changing the `userId` in the URL.
2. **Path Poisoning**: User A tries to create a long, malicious string as a `petId` to bloat storage.
3. **Ghost Field Injection**: User A tries to add an `isAdmin: true` field to their profile.
4. **Orphaned Writes**: User A tries to create a pet for a non-existent user.
5. **Timeline Fraud**: User A tries to set a `lastFed` time in the future.
6. **Negative Pillage**: User A tries to subtract points from another user.
7. **Type Confusion**: User A tries to set `points` as a string "infinity".
8. **Shadow Update**: User A tries to update a log entry (Logs are immutable).
9. **Blanket Read**: User A tries to query all users' pets at once.
10. **Resource Exhaustion**: User A tries to save a 1MB study note.
11. **Outcome Skips**: User A tries to level up a pet without enough points/XP.
12. **Verification Gap**: User A tries to write data without a verified email (if strict enforcement enabled).

## 3. Test Runner (Conceptual)
All the above payloads MUST return `PERMISSION_DENIED`.
