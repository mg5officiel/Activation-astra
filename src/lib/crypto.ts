/** HMAC-SHA256 compatible navigateur/Capacitor avec secret fourni par l'utilisateur. */

const rotr = (x: number, n: number): number => (x >>> n) | (x << (32 - n));
const PRIMES: number[] = (() => { const p: number[] = []; for (let n = 2; p.length < 64; n++) if (p.every((q) => n % q)) p.push(n); return p; })();
const frac32 = (x: number): number => Math.floor((x - Math.floor(x)) * 4294967296) >>> 0;
const K = PRIMES.map((p) => frac32(Math.cbrt(p)));
const H0 = PRIMES.slice(0, 8).map((p) => frac32(Math.sqrt(p)));

function sha256(bytes: Uint8Array): Uint8Array {
  const len = bytes.length;
  const padded = new Uint8Array(((len + 9 + 63) >> 6) << 6);
  padded.set(bytes); padded[len] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, Math.floor((len * 8) / 4294967296));
  dv.setUint32(padded.length - 4, (len * 8) >>> 0);
  const h = H0.slice(); const w = new Array<number>(64);
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a,b,c,d,e,f,g,hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e,6)^rotr(e,11)^rotr(e,25); const ch = (e&f)^(~e&g);
      const t1 = (hh+S1+ch+K[i]+w[i])>>>0; const S0 = rotr(a,2)^rotr(a,13)^rotr(a,22);
      const maj = (a&b)^(a&c)^(b&c); const t2 = (S0+maj)>>>0;
      hh=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
    }
    h[0]=(h[0]+a)>>>0; h[1]=(h[1]+b)>>>0; h[2]=(h[2]+c)>>>0; h[3]=(h[3]+d)>>>0;
    h[4]=(h[4]+e)>>>0; h[5]=(h[5]+f)>>>0; h[6]=(h[6]+g)>>>0; h[7]=(h[7]+hh)>>>0;
  }
  const out = new Uint8Array(32); const odv = new DataView(out.buffer); h.forEach((v,i)=>odv.setUint32(i*4,v)); return out;
}
function hmacSha256(key: Uint8Array, msg: Uint8Array): Uint8Array {
  const B=64, k=new Uint8Array(B); k.set(key.length>B?sha256(key):key);
  const inner=new Uint8Array(B+msg.length); for(let i=0;i<B;i++) inner[i]=k[i]^0x36; inner.set(msg,B);
  const outer=new Uint8Array(B+32); for(let i=0;i<B;i++) outer[i]=k[i]^0x5c; outer.set(sha256(inner),B); return sha256(outer);
}
const toHex=(bytes: Uint8Array): string=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');

export async function hmacSign(data: string, secret: string, forceFallback = false): Promise<string> {
  const normalizedSecret = secret.trim();
  if (!normalizedSecret) throw new Error('La phrase secrète est obligatoire.');
  const keyBytes = new TextEncoder().encode(normalizedSecret);
  const msg = new TextEncoder().encode(data);
  const subtle = globalThis.crypto?.subtle;
  if (!forceFallback && subtle) {
    try {
      const key = await subtle.importKey('raw', keyBytes, { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
      return toHex(new Uint8Array(await subtle.sign('HMAC', key, msg)));
    } catch { /* repli JS */ }
  }
  return toHex(hmacSha256(keyBytes, msg));
}
