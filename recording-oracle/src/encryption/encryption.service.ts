import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
@Injectable()
export class EncryptionService {
  static encrypt(value: string): string {
    return CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
  }

  static decrypt(textToDecrypt: string): string {
    const bytes = CryptoJS.AES.decrypt(textToDecrypt, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }
}
