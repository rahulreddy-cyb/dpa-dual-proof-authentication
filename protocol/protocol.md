# DPA Protocol
Enrollment: generate TOTP secret; generate ECDSA P-256 key in Android Keystore; register only public key.
Authentication: server creates random single-use challenge; Android requires BiometricPrompt; Android generates TOTP and signs the exact challenge; server verifies user, device, TOTP, signature and challenge freshness; server atomically consumes the challenge and issues a session.
Security property: a valid OTP alone is insufficient because the registered device signature is also required. This does not mathematically prove the identity of a human.
