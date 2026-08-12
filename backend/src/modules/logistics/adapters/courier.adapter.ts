import { ConsignmentStatusEnum } from '../entities/consignment.entity';

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

export interface CourierTrackingEvent {
  status: ConsignmentStatusEnum;
  timestamp: Date;
  location?: string;
  description?: string;
}

export interface CourierTrackingResult {
  trackingCode: string;
  currentStatus: ConsignmentStatusEnum;
  events: CourierTrackingEvent[];
}

export interface ICourierAdapter {
  bookParcel(payload: CourierBookingPayload): Promise<CourierBookingResult>;
  trackParcel(trackingCode: string, payload: any): Promise<CourierTrackingResult>;
}
