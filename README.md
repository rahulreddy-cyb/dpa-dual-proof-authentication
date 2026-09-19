# DPA — Dual-Proof Authentication

A research prototype implementing session-bound dual-proof authentication:
1. RFC 6238-compatible TOTP proves possession of the enrolled OTP secret.
2. A device-held asymmetric private key signs a fresh server challenge.
3. Android BiometricPrompt gates use of the private key.
4. The backend accepts login only when both proofs verify.

## Status

This version implements the end-to-end prototype flow:
- Node.js/Express backend
- SQLite persistence
- TOTP enrollment and verification
- Web login
- Android Kotlin authenticator
- Android Keystore key generation
- BiometricPrompt-gated signing
- Public-key registration
- Session-bound challenge signing
- Replay protection
- Rate limiting and audit logging
- Basic automated backend tests

It is a research prototype, not a production identity provider. Review the security documentation before deployment.

## Requirements

- Node.js 20+
- Android Studio / Android SDK
- Android device or emulator supporting Android Keystore and BiometricPrompt
- A browser

## Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API listens on `http://localhost:4000`.

## Web

```bash
cd web
npm install
npm run dev
```

Open the Vite URL shown by the terminal.

## Android

Open `android/` in Android Studio. Set the backend base URL in
`app/src/main/java/com/dpa/authenticator/Config.kt`.

For a physical phone, the phone must be able to reach the development machine over the local network. Do not use plain HTTP in production.

## Protocol

See `protocol/protocol.md` and `protocol/threat-model.md`.

## Security

See `docs/security.md`. This project deliberately uses standard primitives:
- TOTP: RFC 6238 / HMAC-SHA-1
- Device key: Android Keystore, ECDSA P-256
- Challenge: cryptographically random, single-use, short-lived
- Transport: HTTPS required for deployment

The system does not claim that software can identify a human with absolute certainty.
