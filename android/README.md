# Android DPA Authenticator

Open this directory in Android Studio.

The app:
- generates an ECDSA P-256 key in Android Keystore;
- exports only the public key;
- uses BiometricPrompt to authorize private-key use;
- generates RFC 6238 TOTP locally;
- signs a server challenge with the Keystore private key;
- displays the TOTP and signature for the prototype web flow.

For production, the browser/app handoff should use a secure application protocol rather than manual copying.
