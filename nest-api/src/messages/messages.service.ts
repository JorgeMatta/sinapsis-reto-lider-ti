// src/messages/messages.service.ts
import { Injectable } from '@nestjs/common';
import { SendMessageDto } from './send-message.dto';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

@Injectable()
export class MessagesService {
  private sqsClient: SQSClient;
  private messageQueueUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.sqsClient = new SQSClient({
      region: this.configService.get<string>('AWS_REGION'),
    });

    this.messageQueueUrl = this.configService.getOrThrow<string>('MESSAGE_QUEUE_URL');
  }

  async enqueueMessage(dto: SendMessageDto): Promise<{ messageId: string }> {
    const messageId = randomUUID();

    const payload = {
      messageId,
      channel: dto.channel,
      to: dto.to,
      body: dto.body,
      createdAt: new Date().toISOString(),
    };

    // Enviar a SQS
    const command = new SendMessageCommand({
      QueueUrl: this.messageQueueUrl,
      MessageBody: JSON.stringify(payload),
    });

    await this.sqsClient.send(command);

    console.log('Mensaje enviado a SQS:', payload);

    return { messageId };
  }
}
