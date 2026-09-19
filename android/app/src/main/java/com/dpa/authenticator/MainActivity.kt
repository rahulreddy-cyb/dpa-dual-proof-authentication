package com.dpa.authenticator
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
class MainActivity:AppCompatActivity(){
 override fun onCreate(b:Bundle?){super.onCreate(b);setContentView(R.layout.activity_main);Crypto.ensureKey()
  val ch=findViewById<EditText>(R.id.challengeInput);val out=findViewById<TextView>(R.id.result)
  findViewById<Button>(R.id.registerButton).setOnClickListener{out.text="Public key DER/Base64:\n"+Crypto.publicKeyBase64()}
  findViewById<Button>(R.id.approveButton).setOnClickListener{val c=ch.text.toString().trim();if(c.isEmpty()){out.text="Enter a challenge";return@setOnClickListener}
   val p=BiometricPrompt(this,ContextCompat.getMainExecutor(this),object:BiometricPrompt.AuthenticationCallback(){
    override fun onAuthenticationSucceeded(r:BiometricPrompt.AuthenticationResult){val sig=Crypto.sign(c);val otp=if(Config.TOTP_SECRET.isBlank())"SET_TOTP_SECRET" else Totp.generate(Config.TOTP_SECRET);out.text="OTP:\n$otp\n\nSignature:\n$sig"}
    override fun onAuthenticationError(code:Int,msg:CharSequence){out.text="Biometric error: $msg"}
    override fun onAuthenticationFailed(){out.text="Biometric authentication failed"}
   })
   p.authenticate(BiometricPrompt.PromptInfo.Builder().setTitle("Approve DPA authentication").setSubtitle("Authorize challenge signing").setAllowedAuthenticators(androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG or androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL).build())
  }
 }
}