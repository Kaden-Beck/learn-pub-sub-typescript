import amqp, { type ConfirmChannel } from 'amqplib';
import { publishJSON } from '../internal/pubsub/publish.js';
import { ExchangePerilDirect, PauseKey } from '../internal/routing/routing.js';
import type { PlayingState } from '../internal/gamelogic/gamestate.js';
import { getInput, printServerHelp } from '../internal/gamelogic/gamelogic.js';

async function main() {
  const rabbitConnString = 'amqp://guest:guest@localhost:5672/';
  const conn = await amqp.connect(rabbitConnString);
  console.log('Peril game server connected to RabbitMQ!');

  const confirm = await conn.createConfirmChannel();

  await publishJSON(confirm, ExchangePerilDirect, PauseKey, {
    isPaused: true,
  } as PlayingState);

  printServerHelp();

  while (true) {
    const words = await getInput();

    if (words.length !== 0) {
      const firstWord = words[0];
      if (firstWord === 'pause') {
        console.log('Sending a pause message... ');

        await publishJSON(confirm, ExchangePerilDirect, PauseKey, {
          isPaused: true,
        } as PlayingState);
      } else if (firstWord === 'resume') {
        console.log('Sending a resume message... ');

        await publishJSON(confirm, ExchangePerilDirect, PauseKey, {
          isPaused: false,
        } as PlayingState);
      } else if (firstWord === 'quit') {
        console.log('Exiting...');
        break;
      } else {
        console.log('Invalid input... Try again.');
        continue;
      }
    }
  }

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
