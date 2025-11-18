// src/messages/messages.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './send-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('send')
  async sendMessage(@Body() dto: SendMessageDto) {
    //console.log('DTO recibido en el controlador:', dto);
    const { messageId } = await this.messagesService.enqueueMessage(dto);

    return {
      messageId,
      status: 'ENQUEUED',
      message: 'Mensaje recibido y enviado a la cola (simulada).',
    };
  }
}
