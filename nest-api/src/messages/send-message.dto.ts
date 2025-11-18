// src/messages/send-message.dto.ts
import { IsString, IsIn, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @IsIn(['SMS', 'WHATSAPP'])
  channel: 'SMS' | 'WHATSAPP';

  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}
