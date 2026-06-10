import amqp, { type ConfirmChannel } from 'amqplib';
import { publishJSON } from '../internal/pubsub/pubsub.js';
import { ExchangePerilDirect, PauseKey } from '../internal/routing/routing.js';
import {
  type PlayingState,
} from '../internal/gamelogic/gamestate.js';


async function main() {
  const rabbitConnString = 'amqp://guest:guest@localhost:5672/';
  const conn = await amqp.connect(rabbitConnString);
  console.log('Peril game server connected to RabbitMQ!');

  const confirm = await conn.createConfirmChannel();

  await publishJSON(confirm, ExchangePerilDirect, PauseKey, {
    isPaused: true,
  } as PlayingState);

  ['SIGINT', 'SIGTERM'].forEach((signal) =>
    process.on(signal, async () => {
      try {
        await conn.close();
        console.log('RabbitMQ connection closed.');
      } catch (err) {
        console.error('Error closing RabbitMQ connection:', err);
      } finally {
        process.exit(0);
      }
    }),
  );
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
