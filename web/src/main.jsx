import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = "http://localhost:4000";

function App() {
  const [username, setUsername] = useState("demo");
  const [deviceId, setDeviceId] = useState("android-demo-device");
  const [challenge, setChallenge] = useState(null);
  const [otp, setOtp] = useState("");
  const [signature, setSignature] = useState("");
  const [status, setStatus] = useState("");

  async function createChallenge() {
    setStatus("Creating fresh server challenge...");
    const r = await fetch(`${API}/api/auth/challenge`, {
      method: "POST", headers: {"content-type":"application/json"},
      body: JSON.stringify({ username })
    });
    const body = await r.json();
    if (!r.ok) return setStatus(body.error || "challenge failed");
    setChallenge(body);
    setStatus("Challenge created. In the Android app, approve and sign this challenge.");
  }

  async function verify() {
    setStatus("Verifying OTP + device signature...");
    const r = await fetch(`${API}/api/auth/verify`, {
      method: "POST", headers: {"content-type":"application/json"},
      body: JSON.stringify({ username, deviceId, challengeId: challenge?.challengeId, otp, signature })
    });
    const body = await r.json();
    setStatus(r.ok ? `Authenticated. Session expires ${new Date(body.expiresAt).toLocaleString()}` : `Rejected: ${body.error}`);
  }

  return <main>
    <section className="card">
      <h1>DPA Authentication</h1>
      <p>Dual proof: valid TOTP <strong>and</strong> valid device signature.</p>
      <label>Username<input value={username} onChange={e=>setUsername(e.target.value)} /></label>
      <label>Device ID<input value={deviceId} onChange={e=>setDeviceId(e.target.value)} /></label>
      <button onClick={createChallenge}>1. Create challenge</button>
      {challenge && <div className="challenge"><small>Challenge</small><code>{challenge.challenge}</code></div>}
      <label>6-digit TOTP<input maxLength="6" inputMode="numeric" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,""))}/></label>
      <label>Base64url signature<input value={signature} onChange={e=>setSignature(e.target.value)} placeholder="Produced by Android app"/></label>
      <button disabled={!challenge || otp.length !== 6 || !signature} onClick={verify}>2. Verify & Login</button>
      <p className="status">{status}</p>
      <p className="note">For the real Android flow, the app should send the signature to the backend or hand it to this client securely; this demo field makes the protocol visible for testing.</p>
    </section>
  </main>
}
createRoot(document.getElementById("root")).render(<App />);
