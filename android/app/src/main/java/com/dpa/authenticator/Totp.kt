package com.dpa.authenticator
import java.nio.ByteBuffer
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec
object Totp {
 fun generate(secret:String,time:Long=System.currentTimeMillis()):String{val key=decode(secret);val c=time/1000/30;val m=Mac.getInstance("HmacSHA1");m.init(SecretKeySpec(key,"HmacSHA1"));val h=m.doFinal(ByteBuffer.allocate(8).putLong(c).array());val o=h.last().toInt() and 15;val b=((h[o].toInt() and 127) shl 24) or ((h[o+1].toInt() and 255) shl 16) or ((h[o+2].toInt() and 255) shl 8) or (h[o+3].toInt() and 255);return (b%1000000).toString().padStart(6,'0')}
 private fun decode(s:String):ByteArray{val a="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";var buf=0;var bits=0;val out=ArrayList<Byte>();for(c in s.uppercase().replace(" ","")){val v=a.indexOf(c);if(v<0)continue;buf=(buf shl 5) or v;bits+=5;if(bits>=8){bits-=8;out.add(((buf shr bits) and 255).toByte())}};return out.toByteArray()}
}