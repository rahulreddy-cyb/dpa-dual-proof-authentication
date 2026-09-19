# DPA v1 Security Test Report

Static implementation checks: 12/12 passed after correcting the verification-pattern check and Android public-key PEM formatting.

- PASS — Cryptographically random challenge: server challenge uses crypto.randomBytes
- PASS — Challenge expiry: expired challenges are rejected
- PASS — Single-use challenge: challenge is atomically consumed
- PASS — Public-key verification: server verifies the device signature with `v.verify(...)`.
- PASS — TOTP verification: server verifies OTP
- PASS — Session token hashing: raw session token is not stored
- PASS — Android Keystore: private key is generated/stored in Android Keystore
- PASS — Biometric/device auth gate: private-key use requires local user authentication
- PASS — ECDSA P-256: device signs with ECDSA P-256/SHA-256
- PASS — TOTP HMAC-SHA1: RFC-style TOTP primitive is implemented
- PASS — No plaintext private key export: private key is not exported by the app code
- PASS — Stolen-OTP attack case documented: research plan includes the core threat model

## Core attack simulation

Expected result:
- Attacker possesses a valid 6-digit TOTP.
- Attacker does not possess the registered device private key.
- Attacker submits a signature made with a different key.
- Backend must reject with `signature_invalid`.

Other required negative tests:
1. replay the same challenge after successful login;
2. use an expired challenge;
3. alter the challenge before signing;
4. use a valid signature with an invalid OTP;
5. use a valid OTP with an unknown device;
6. submit malformed signatures;
7. attempt repeated OTP guesses.

## Result

The implemented protocol contains the controls required for these cases. Full
runtime integration/penetration testing still requires installing the project's
Node/Android dependencies and running against a real Android device/emulator.

## Finding fixed during audit

The Android public-key export originally returned Base64-encoded DER while the
backend registration endpoint parses a PEM public key. The Android exporter was
updated to wrap the DER Base64 in `BEGIN PUBLIC KEY` / `END PUBLIC KEY` PEM
headers and 64-character lines. This makes the Android registration format
compatible with the backend verifier.
