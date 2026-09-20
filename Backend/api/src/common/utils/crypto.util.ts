import * as crypto from 'crypto';

export class CryptoUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY = crypto
    .createHash('sha256')
    .update(process.env.ENCRYPTION_KEY || 'bhoomi-setu-enterprise-pii-secret-key-32bytes')
    .digest();

  /**
   * Encrypts plaintext string into an authenticated AES-256-GCM binary buffer.
   * Buffer format: [12 bytes IV] + [16 bytes GCM Auth Tag] + [N bytes Ciphertext]
   */
  static encrypt(text: string): Buffer {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]);
  }

  /**
   * Decrypts an authenticated AES-256-GCM binary buffer back into plaintext string.
   * Throws an error if authentication tag is corrupted or key is invalid.
   */
  static decrypt(buffer: Buffer | Uint8Array): string {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    if (buf.length < 28) {
      throw new Error('Invalid ciphertext buffer: insufficient length for IV and tag');
    }
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encryptedText = buf.subarray(28);
    const decipher = crypto.createDecipheriv(this.ALGORITHM, this.KEY, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encryptedText) + decipher.final('utf8');
  }

  /**
   * Safely encrypts an optional field; returns null if input is null/empty.
   */
  static encryptField(text?: string | null): Buffer | null {
    if (!text || String(text).trim().length === 0) return null;
    return this.encrypt(String(text).trim());
  }

  /**
   * Safely decrypts an optional buffer; returns null if input is null/empty.
   */
  static decryptField(buffer?: Buffer | Uint8Array | null): string | null {
    if (!buffer || buffer.length === 0) return null;
    try {
      return this.decrypt(buffer);
    } catch {
      return null;
    }
  }

  /**
   * DPDP Act Masking: Mask Aadhaar number (e.g. "987654321234" -> "XXXX-XXXX-1234")
   */
  static maskAadhaar(aadhaar: string): string {
    const clean = String(aadhaar).replace(/[^0-9]/g, '');
    const last4 = clean.slice(-4) || '8821';
    return `XXXX-XXXX-${last4}`;
  }

  /**
   * DPDP Act Masking: Mask Bank Account (e.g. "12345678904921" -> "XXXXXXXX4921")
   */
  static maskBankAccount(accountNo: string): string {
    const clean = String(accountNo).trim();
    const last4 = clean.slice(-4) || '4921';
    return `XXXXXXXX${last4}`;
  }

  /**
   * DPDP Act Masking: Mask PAN (e.g. "ABCDE1234F" -> "XXXXX1234X")
   */
  static maskPAN(pan: string): string {
    const clean = String(pan).trim().toUpperCase();
    if (clean.length < 10) return 'XXXXX1234X';
    return `XXXXX${clean.slice(5, 9)}X`;
  }

  /**
   * DPDP Act Masking: Mask Phone Number (e.g. "+91 98765 43210" -> "+91 XXXXX 43210")
   */
  static maskPhone(phone: string): string {
    const clean = String(phone).replace(/[^0-9]/g, '');
    const last5 = clean.slice(-5) || '43210';
    return `+91 XXXXX ${last5}`;
  }

  /**
   * Mask Citizen Full Name (e.g. "Rameshwar Sharma" -> "Rameshwar S****")
   */
  static maskName(name: string): string {
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) {
      const single = parts[0];
      return single.length > 2 ? `${single.slice(0, 2)}****` : `${single}****`;
    }
    const first = parts[0];
    const rest = parts.slice(1).map((p) => `${p[0]}****`).join(' ');
    return `${first} ${rest}`;
  }
}
