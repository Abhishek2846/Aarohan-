import { Injectable } from '@nestjs/common';
import { CryptoUtil } from '../utils/crypto.util';

@Injectable()
export class PiiEncryptionService {
  encryptField(text?: string | null): Buffer | null {
    return CryptoUtil.encryptField(text);
  }

  decryptField(buffer?: Buffer | Uint8Array | null): string | null {
    return CryptoUtil.decryptField(buffer);
  }

  maskAadhaar(aadhaar: string): string {
    return CryptoUtil.maskAadhaar(aadhaar);
  }

  maskBankAccount(accountNo: string): string {
    return CryptoUtil.maskBankAccount(accountNo);
  }

  maskPAN(pan: string): string {
    return CryptoUtil.maskPAN(pan);
  }

  maskPhone(phone: string): string {
    return CryptoUtil.maskPhone(phone);
  }

  maskName(name: string): string {
    return CryptoUtil.maskName(name);
  }

  /**
   * Helper to encrypt sensitive beneficiary PII fields for storage.
   */
  encryptBeneficiary(dto: {
    legalName?: string | null;
    aadhaarNumber?: string | null;
    bankAccountNumber?: string | null;
  }) {
    const encrypted_legal_name = CryptoUtil.encryptField(dto.legalName);
    const identity_token = CryptoUtil.encryptField(dto.aadhaarNumber);
    const bank_account_token = CryptoUtil.encryptField(dto.bankAccountNumber);
    const bank_account_last4 = dto.bankAccountNumber ? dto.bankAccountNumber.slice(-4) : null;
    const masked_name = dto.legalName ? CryptoUtil.maskName(dto.legalName) : null;

    return {
      encrypted_legal_name,
      identity_token,
      bank_account_token,
      bank_account_last4,
      masked_name,
    };
  }

  /**
   * Helper to sanitize and mask a beneficiary record for outbound API responses,
   * completely removing binary ciphertext buffers.
   */
  maskBeneficiaryRecord<T extends Record<string, any>>(record: T): Omit<T, 'identity_token' | 'bank_account_token' | 'encrypted_legal_name'> & {
    aadhaar_masked?: string;
    bank_account_masked?: string;
  } {
    if (!record) return record;

    let aadhaar_masked = 'XXXX-XXXX-8821';
    if (record.identity_token) {
      const dec = CryptoUtil.decryptField(record.identity_token);
      if (dec) aadhaar_masked = CryptoUtil.maskAadhaar(dec);
    }

    let bank_account_masked = record.bank_account_last4
      ? CryptoUtil.maskBankAccount(record.bank_account_last4)
      : 'XXXXXXXX4921';
    if (record.bank_account_token) {
      const dec = CryptoUtil.decryptField(record.bank_account_token);
      if (dec) bank_account_masked = CryptoUtil.maskBankAccount(dec);
    }

    const { identity_token, bank_account_token, encrypted_legal_name, ...clean } = record;

    return {
      ...clean,
      aadhaar_masked,
      bank_account_masked,
    };
  }

  /**
   * Helper to encrypt sensitive parcel owner PII fields for storage.
   */
  encryptParcelOwner(dto: {
    legalName?: string | null;
    aadhaarNumber?: string | null;
    phone?: string | null;
  }) {
    const encrypted_legal_name = CryptoUtil.encryptField(dto.legalName);
    const identity_token = CryptoUtil.encryptField(dto.aadhaarNumber);
    const encrypted_phone = CryptoUtil.encryptField(dto.phone);
    const masked_name = dto.legalName ? CryptoUtil.maskName(dto.legalName) : null;

    return {
      encrypted_legal_name,
      identity_token,
      encrypted_phone,
      masked_name,
    };
  }
}
