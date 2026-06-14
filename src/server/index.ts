import amqp, { type ConfirmChannel } from 'amqplib';
import { publishJSON } from '../internal/pubsub/publish.js';
import {
  ExchangePerilDirect,
  ExchangePerilTopic,
  GameLogSlug,
  PauseKey,
} from '../internal/routing/routing.js';
import type { PlayingState } from '../internal/gamelogic/gamestate.js';
import { getInput, printServerHelp } from '../internal/gamelogic/gamelogic.js';
import { declareAndBind, SimpleQueueType } from '../internal/pubsub/bind.js';

async function main() {
  const rabbitConnString = 'amqp://guest:guest@localhost:5672/';
  const conn = await amqp.connect(rabbitConnString);
  console.log('Peril game server connected to RabbitMQ!');

  const confirm = await conn.createConfirmChannel();

  await publishJSON(confirm, ExchangePerilDirect, PauseKey, {
    isPaused: true,
  } as PlayingState);

  const [channel, assertQueue] = await declareAndBind(
    conn,
    ExchangePerilTopic,
    GameLogSlug,
    `${GameLogSlug}.*`,
    SimpleQueueType.Durable,
  );

  printServerHelp();

  while (true) {
    const words = await getInput();
    if (words.length === 0) {
      continue;
    }
    const command = words[0];

    // REPL Loop
    if (command === 'pause') {
      console.log('Sending a pause message... ');
      await publishJSON(confirm, ExchangePerilDirect, PauseKey, {
        isPaused: true,
      });
    } else if (command === 'resume') {
      console.log('Sending a resume message... ');
      await publishJSON(confirm, ExchangePerilDirect, PauseKey, {
        isPaused: false,
      });
    } else if (command === 'quit') {
      console.log('Exiting...');
      break;
    } else {
      console.log('Invalid input... Try again.');
      continue;
    }
  }

  // Shutdown on kill
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
