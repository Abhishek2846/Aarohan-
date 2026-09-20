import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class SanitizeInputPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' || value === null || value === undefined) {
      return value;
    }
    return this.sanitizeValue(value);
  }

  private sanitizeValue(val: any): any {
    if (typeof val === 'string') {
      return this.sanitizeString(val);
    }
    if (Array.isArray(val)) {
      return val.map((item) => this.sanitizeValue(item));
    }
    if (typeof val === 'object' && val !== null) {
      const sanitizedObj: Record<string, any> = {};
      for (const key of Object.keys(val)) {
        sanitizedObj[key] = this.sanitizeValue(val[key]);
      }
      return sanitizedObj;
    }
    return val;
  }

  private sanitizeString(str: string): string {
    // Strip <script>...</script> tags and contents
    let cleaned = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Strip <iframe>...</iframe> tags and contents
    cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
    // Strip dangerous HTML event handlers like onload, onerror, onclick, etc.
    cleaned = cleaned.replace(/\bon\w+\s*=\s*(['"]).*?\1/gi, '');
    cleaned = cleaned.replace(/\bon\w+\s*=\s*[^>\s]+/gi, '');
    // Strip javascript: pseudo-protocol
    cleaned = cleaned.replace(/javascript:[^"'>\s]*/gi, '');
    return cleaned;
  }
}
