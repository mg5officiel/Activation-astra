import { hmacSign } from './crypto';
//npx ts-node generate.ts "machine-id"
const CHARS = 'BCDFGHJKMNPQRTVWXY2346789';

function toBase25(hex: string, length: number): string {
  let num = BigInt('0x' + hex);
  let result = '';
  for (let i = 0; i < length; i++) {
    result = CHARS[Number(num % BigInt(CHARS.length))] + result;
    num /= BigInt(CHARS.length);
  }
  // Garantir exactement `length` caractères
  return result.padStart(length, CHARS[0]);
}

function formatKey(flat: string): string {
  return flat.match(/.{5}/g)!.join('-');
}

function generateActivationKey(machineId: string): string {
  const mid = machineId.trim().toLowerCase();

  if (!/^[a-f0-9]{8}$/.test(mid)) {
    throw new Error(
      `ID Machine invalide : « ${mid} »\nAttendu : 8 caractères hex (ex: a3f7c291)`
    );
  }

  const iat = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const dataToSign = `v=1|mid=${mid}|iat=${iat}`;
  const sig = hmacSign(dataToSign);

  const payload = mid + iat.replace(/-/g, '') + sig.slice(0, 8);
  const flat = toBase25(payload, 25);

  return formatKey(flat);
}

// ── Main ────────────────────────────────────────────────────────────────
const machineId = process.argv[2];

if (!machineId) {
  console.log('\n ID Machine manquant !');
  console.log('\nUsage :');
  console.log('   npx ts-node generate.ts <machine-id>');
  console.log('\nExemple :');
  console.log('   npx ts-node generate.ts a3f7c291\n');
  process.exit(1);
}

try {
  const key = generateActivationKey(machineId);
  console.log('\n Clé générée avec succès !\n');
  console.log(`   Machine ID : ${machineId.toLowerCase()}`);
  console.log(`   Date       : ${new Date().toISOString().split('T')[0]}`);
  console.log(`   Clé        : ${key}`);
  console.log('\n Envoyez cette clé au client.\n');
} catch (err: any) {
  console.error('\n Erreur :', err.message, '\n');
  process.exit(1);
}
