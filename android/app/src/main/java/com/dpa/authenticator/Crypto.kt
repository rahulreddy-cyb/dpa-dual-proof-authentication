package com.dpa.authenticator
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.Signature
import java.util.Base64
object Crypto {
 private const val KS="AndroidKeyStore"
 fun ensureKey(){val k=KeyStore.getInstance(KS).apply{load(null)};if(k.containsAlias(Config.KEY_ALIAS))return
  val g=KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC,KS)
  g.initialize(KeyGenParameterSpec.Builder(Config.KEY_ALIAS,KeyProperties.PURPOSE_SIGN)
   .setAlgorithmParameterSpec(java.security.spec.ECGenParameterSpec("secp256r1")).setDigests(KeyProperties.DIGEST_SHA256)
   .setUserAuthenticationRequired(true).setUserAuthenticationParameters(60,KeyProperties.AUTH_BIOMETRIC_STRONG or KeyProperties.AUTH_DEVICE_CREDENTIAL).build())
  g.generateKeyPair()}
 fun publicKeyBase64():String{val k=KeyStore.getInstance(KS).apply{load(null)};val raw = Base64.getEncoder().encodeToString(k.getCertificate(Config.KEY_ALIAS).publicKey.encoded)
        return "-----BEGIN PUBLIC KEY-----\\n" +
                raw.chunked(64).joinToString("\\n") +
                "\\n-----END PUBLIC KEY-----"}
 fun sign(challenge:String):String{val k=KeyStore.getInstance(KS).apply{load(null)};val p=(k.getEntry(Config.KEY_ALIAS,null) as KeyStore.PrivateKeyEntry).privateKey
  val s=Signature.getInstance("SHA256withECDSA");s.initSign(p);s.update(challenge.toByteArray());return Base64.getUrlEncoder().withoutPadding().encodeToString(s.sign())}
}