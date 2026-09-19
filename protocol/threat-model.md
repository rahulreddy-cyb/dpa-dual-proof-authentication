# Threat Model

### Protected assets
- User account
- TOTP secret
- Device private key
- Authenticated session
- Authentication challenge

### Threats
- Attacker obtains a valid TOTP.
- Attacker replays an old challenge/signature.
- Attacker submits a signature from a different device.
- Attacker modifies the challenge.
- Attacker submits an expired challenge.
- Attacker attempts repeated OTP guesses.
- Attacker steals a session token.

### Main mitigations
- Dual proof: TOTP + challenge signature.
- Android Keystore keeps the private key non-exportable.
- BiometricPrompt gates key use.
- Challenge is random, short-lived and single-use.
- Public key is bound to a device record.
- Rate limiting should be added at the reverse proxy/API gateway for deployment.
- HTTPS and secure cookies are required for production.

### Residual risk
If the attacker fully controls the enrolled device after successful local
authentication, this design cannot guarantee protection. Account recovery and
device revocation are therefore important parts of a production system.
