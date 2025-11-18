// lambdas/process-message/index.js
const mysql = require('mysql2/promise');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DELIVERY_QUEUE_URL,
  AWS_REGION,
} = process.env;

const sqsClient = new SQSClient({ region: AWS_REGION });

exports.handler = async (event) => {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  try {
    for (const record of event.Records) {
      const payload = JSON.parse(record.body);

      const now = new Date();

      // Insertar en MySQL con estado PENDING
      await connection.execute(
        `INSERT INTO messages (id, channel, destination, body, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.messageId,
          payload.channel,
          payload.to,
          payload.body,
          'PENDING',
          now,
          now,
        ],
      );

      // Enviar mensaje a la cola de confirmación con delay
      const confirmPayload = {
        messageId: payload.messageId,
      };

      const command = new SendMessageCommand({
        QueueUrl: DELIVERY_QUEUE_URL,
        MessageBody: JSON.stringify(confirmPayload),
        DelaySeconds: 30, // X segundos de espera
      });

      await sqsClient.send(command);
    }
  } finally {
    await connection.end();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Mensajes procesados y encolados para confirmación.' }),
  };
};
