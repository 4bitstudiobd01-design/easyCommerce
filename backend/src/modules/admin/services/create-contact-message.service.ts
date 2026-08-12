import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ContactMessageEntity } from '../entities/contact-message.entity';
import { CreateContactMessageDto } from '../dto/create-contact-message.dto';
import { SmtpEmailDriver } from '../../sms/drivers/smtp-email.driver';

@Injectable()
export class CreateContactMessageService {
  private readonly logger = new Logger(CreateContactMessageService.name);

  constructor(
    @InjectRepository(ContactMessageEntity)
    private readonly contactMessageRepository: Repository<ContactMessageEntity>,
    private readonly smtpEmailDriver: SmtpEmailDriver,
    private readonly configService: ConfigService,
  ) {}

  async execute(dto: CreateContactMessageDto): Promise<ContactMessageEntity> {
    const contactMessage = this.contactMessageRepository.create(dto);
    const saved = await this.contactMessageRepository.save(contactMessage);

    const adminEmail = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');

    if (adminEmail && smtpHost && smtpUser && smtpPass) {
      const result = await this.smtpEmailDriver.sendEmail({
        toEmail: adminEmail,
        subject: `[Contact Form] ${dto.subject} — ${dto.name}`,
        htmlBody: `
          <p><strong>From:</strong> ${dto.name} (${dto.email})</p>
          <p><strong>Phone:</strong> ${dto.phone || 'N/A'}</p>
          <p><strong>Subject:</strong> ${dto.subject}</p>
          <p><strong>Message:</strong></p>
          <p>${dto.message.replace(/\n/g, '<br/>')}</p>
        `,
        smtpHost,
        smtpPort: this.configService.get<number>('SMTP_PORT', 587),
        smtpUser,
        smtpPass,
        fromEmail: this.configService.get<string>('SMTP_FROM_EMAIL', smtpUser),
      });

      if (!result.success) {
        this.logger.warn(`Contact message ${saved.id} saved but notification email failed to send.`);
      }
    } else {
      this.logger.warn(
        `Contact message ${saved.id} saved but platform SMTP is not configured — no notification email sent.`,
      );
    }

    return saved;
  }
}
