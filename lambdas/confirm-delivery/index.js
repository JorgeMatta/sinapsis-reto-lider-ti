// lambdas/confirm-delivery/index.js
const mysql = require('mysql2/promise');

const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env;

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

      await connection.execute(
        `UPDATE messages SET status = ?, updated_at = ? WHERE id = ?`,
        ['DELIVERED', now, payload.messageId],
      );
    }
  } finally {
    await connection.end();
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Mensajes marcados como DELIVERED.' }),
  };
};
