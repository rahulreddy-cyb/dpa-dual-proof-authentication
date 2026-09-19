import express from "express";
import cors from "cors";
import helmet from "helmet";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import { authenticator } from "otplib";
import dotenv from "dotenv";
dotenv.config();

const PORT=Number(process.env.PORT||4000);
const db=new Database(process.env.DB_PATH||"./dpa.sqlite");
db.pragma("journal_mode=WAL");
db.exec(`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT UNIQUE NOT NULL,totp_secret TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS devices(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,public_key_pem TEXT NOT NULL,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS challenges(id TEXT PRIMARY KEY,user_id TEXT NOT NULL,value TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id TEXT,event TEXT,success INTEGER,ip TEXT,created_at INTEGER);`);

const app=express();
app.use(helmet());
app.use(cors({origin:process.env.WEB_ORIGIN||"http://localhost:5173"}));
app.use(express.json({limit:"32kb"}));

const now=()=>Date.now();
const rid=(n=24)=>crypto.randomBytes(n).toString("base64url");
const hash=x=>crypto.createHash("sha256").update(x).digest("hex");
const audit=(u,e,s,req)=>db.prepare("INSERT INTO audit(user_id,event,success,ip,created_at) VALUES(?,?,?,?,?)").run(u,e,s?1:0,req.ip,now());

function demo(){
  let u=db.prepare("SELECT * FROM users WHERE username='demo'").get();
  if(!u){const secret=authenticator.generateSecret(); u={id:rid(12),username:"demo",totp_secret:secret,created_at:now()};
    db.prepare("INSERT INTO users VALUES(?,?,?,?)").run(u.id,u.username,u.totp_secret,u.created_at);
    console.log("DEV demo TOTP secret:",secret);
    console.log("DEV otpauth URI:",authenticator.keyuri("demo","DPA",secret));
  } return u;
}
demo();

app.get("/health",(_,r)=>r.json({ok:true,service:"dpa-backend"}));

app.post("/api/auth/challenge",(req,res)=>{
  const u=db.prepare("SELECT id FROM users WHERE username=?").get(String(req.body.username||"").trim());
  if(!u)return res.status(401).json({error:"invalid_credentials"});
  const id=rid(18), value=rid(32), t=now(), exp=t+Number(process.env.CHALLENGE_TTL_MS||60000);
  db.prepare("INSERT INTO challenges VALUES(?,?,?,?,?,0)").run(id,u.id,value,t,exp);
  audit(u.id,"challenge_created",true,req); res.json({challengeId:id,challenge:value,expiresAt:exp});
});

app.post("/api/dev/device/register",(req,res)=>{
  const {username,deviceId,publicKeyPem}=req.body||{};
  const u=db.prepare("SELECT id FROM users WHERE username=?").get(username);
  if(!u||!deviceId||!publicKeyPem)return res.status(400).json({error:"invalid_registration"});
  try{crypto.createPublicKey(publicKeyPem)}catch{return res.status(400).json({error:"invalid_public_key"})}
  db.prepare(`INSERT INTO devices VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET user_id=excluded.user_id,public_key_pem=excluded.public_key_pem`)
    .run(deviceId,u.id,publicKeyPem,now());
  audit(u.id,"device_registered",true,req); res.json({ok:true});
});

app.post("/api/auth/verify",(req,res)=>{
  const {username,challengeId,deviceId,otp,signature}=req.body||{};
  const u=db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if(!u||!challengeId||!deviceId||!otp||!signature)return res.status(400).json({error:"missing_fields"});
  const c=db.prepare("SELECT * FROM challenges WHERE id=? AND user_id=?").get(challengeId,u.id);
  if(!c||c.used||c.expires_at<now()){audit(u.id,"challenge_rejected",false,req);return res.status(401).json({error:"challenge_invalid_or_expired"})}
  const d=db.prepare("SELECT * FROM devices WHERE id=? AND user_id=?").get(deviceId,u.id);
  if(!d)return res.status(401).json({error:"device_not_registered"});
  authenticator.options={step:Number(process.env.TOTP_STEP||30),window:Number(process.env.TOTP_WINDOW||1)};
  if(!authenticator.check(String(otp),u.totp_secret)){audit(u.id,"totp_failed",false,req);return res.status(401).json({error:"otp_invalid"})}
  let ok=false; try{const v=crypto.createVerify("SHA256");v.update(c.value);v.end();ok=v.verify(d.public_key_pem,Buffer.from(signature,"base64url"))}catch{}
  if(!ok){audit(u.id,"signature_failed",false,req);return res.status(401).json({error:"signature_invalid"})}
  const consumed=db.prepare("UPDATE challenges SET used=1 WHERE id=? AND used=0").run(challengeId);
  if(consumed.changes!==1)return res.status(401).json({error:"challenge_already_used"});
  const token=rid(32), exp=now()+Number(process.env.SESSION_TTL_MS||3600000);
  db.prepare("INSERT INTO sessions VALUES(?,?,?,?)").run(hash(token),u.id,now(),exp);
  audit(u.id,"login_success",true,req); res.json({ok:true,sessionToken:token,expiresAt:exp});
});

app.get("/api/session",(req,res)=>{
  const h=String(req.headers.authorization||""); const t=h.startsWith("Bearer ")?h.slice(7):"";
  const s=t&&db.prepare("SELECT * FROM sessions WHERE token_hash=?").get(hash(t));
  if(!s||s.expires_at<now())return res.status(401).json({authenticated:false});
  res.json({authenticated:true,user:db.prepare("SELECT id,username FROM users WHERE id=?").get(s.user_id),expiresAt:s.expires_at});
});
app.post("/api/session/logout",(req,res)=>{
  const h=String(req.headers.authorization||"");const t=h.startsWith("Bearer ")?h.slice(7):"";
  if(t)db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hash(t));res.json({ok:true});
});

const server=app.listen(PORT,()=>console.log(`DPA backend: http://localhost:${PORT}`));
export {app,server,db};
