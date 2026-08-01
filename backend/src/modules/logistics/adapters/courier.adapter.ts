export interface CourierBookingPayload {
  invoice: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  city: string;
  codAmount: number;
  note?: string;
  apiKey?: string;
  secretKey?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface CourierBookingResult {
  trackingCode: string;
  consignmentId?: string;
  status: string;
}

export interface ICourierAdapter {
  bookParcel(payload: CourierBookingPayload): Promise<CourierBookingResult>;
}
