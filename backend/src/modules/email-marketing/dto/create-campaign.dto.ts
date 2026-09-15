import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { CampaignRecipientTypeEnum } from '../entities/email-campaign.entity';

export class CreateEmailCampaignDto {
  @ApiProperty({ example: 'Summer Clearance Sale Offer' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: '🔥 Get 20% OFF on all products today!' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ example: '<p>Dear customer, enjoy 20% OFF using promo code SUMMER20.</p>' })
  @IsNotEmpty()
  @IsString()
  contentHtml: string;

  @ApiProperty({
    enum: CampaignRecipientTypeEnum,
    example: CampaignRecipientTypeEnum.ALL_SUBSCRIBERS,
  })
  @IsNotEmpty()
  @IsEnum(CampaignRecipientTypeEnum)
  recipientType: CampaignRecipientTypeEnum;
}
