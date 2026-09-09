import { BadGatewayException, BadRequestException } from '@nestjs/common';
import axios from 'axios';

/**
 * Turns a failed courier HTTP call into the right exception for the merchant.
 *
 * The distinction that matters:
 *  - 4xx (validation / bad data) → BadRequestException. The merchant must fix
 *    the order (phone, address, weight…) — retrying the same payload will fail
 *    the same way. The message carries the provider's own field-level reasons
 *    when it sends them.
 *  - anything else (network error, 5xx, timeout) → BadGatewayException. The
 *    provider is unreachable or broke; the shipment stays PENDING and the
 *    merchant can retry.
 *
 * `provider` is the display name used in the message. `alreadyTyped` lets a
 * caller pass exceptions it raised itself straight through unchanged.
 */
export function throwCourierError(
  provider: string,
  err: unknown,
  alreadyTyped: Array<new (...args: any[]) => Error> = [BadGatewayException, BadRequestException],
): never {
  if (alreadyTyped.some((Type) => err instanceof Type)) {
    throw err as Error;
  }

  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const body = err.response?.data as any;

    if (status && status >= 400 && status < 500) {
      const reasons = extractValidationReasons(body);
      throw new BadRequestException(
        reasons
          ? `${provider} rejected the parcel: ${reasons}`
          : body?.message
            ? `${provider} rejected the parcel: ${body.message}`
            : `${provider} rejected the parcel (HTTP ${status}). Check the order details and try again.`,
      );
    }
  }

  throw new BadGatewayException(
    `Unable to reach ${provider} courier service. Please try again shortly.`,
  );
}

/**
 * Flattens the common courier validation-error shapes into one readable string.
 * Handles CarryBee's `{ causes: { field: [{ type }] } }` and Pathao's
 * `{ errors: { field: [msg] } }` / `{ errors: [msg] }`.
 */
function extractValidationReasons(body: any): string | null {
  if (!body) return null;

  const causes = body.causes ?? body.errors;
  if (!causes) return null;

  if (Array.isArray(causes)) {
    return causes.map(String).join('; ') || null;
  }

  if (typeof causes === 'object') {
    const parts: string[] = [];
    for (const [field, val] of Object.entries(causes)) {
      const detail = Array.isArray(val)
        ? val
            .map((v: any) => (typeof v === 'string' ? v : v?.type ?? JSON.stringify(v)))
            .join(', ')
        : String(val);
      parts.push(`${field} (${detail})`);
    }
    return parts.join('; ') || null;
  }

  return null;
}
