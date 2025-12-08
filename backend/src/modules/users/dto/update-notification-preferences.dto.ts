import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateNotificationPreferencesDto {
  @ApiProperty({
    description: 'Enable/disable email notifications for ticket purchases',
    example: true,
  })
  @IsBoolean({ message: 'emailTicketPurchase must be a boolean' })
  emailTicketPurchase: boolean;

  @ApiProperty({
    description: 'Enable/disable email notifications for route disruptions (future feature)',
    example: false,
  })
  @IsBoolean({ message: 'emailRouteDisruptions must be a boolean' })
  emailRouteDisruptions: boolean;

  @ApiProperty({
    description: 'Enable/disable promotional email notifications (GDPR-compliant opt-in)',
    example: false,
  })
  @IsBoolean({ message: 'emailPromotional must be a boolean' })
  emailPromotional: boolean;

  @ApiProperty({
    description: 'Enable/disable push notifications (future feature, UI placeholder)',
    example: false,
  })
  @IsBoolean({ message: 'pushNotifications must be a boolean' })
  pushNotifications: boolean;
}
