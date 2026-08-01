export interface SmsPayload {
  phone: string;
  message: string;
  apiKey?: string;
  senderId?: string;
}

export interface EmailPayload {
  toEmail: string;
  subject: string;
  htmlBody: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail?: string;
}

export interface ISmsDriver {
  sendSms(payload: SmsPayload): Promise<{ success: boolean; gatewayResponse: any }>;
}

export interface IEmailDriver {
  sendEmail(payload: EmailPayload): Promise<{ success: boolean; gatewayResponse: any }>;
}
