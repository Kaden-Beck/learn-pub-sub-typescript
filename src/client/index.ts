import amqp from 'amqplib';
import { clientWelcome } from '../internal/gamelogic/gamelogic.js';
import { SimpleQueueType, declareAndBind } from '../internal/pubsub/bind.js';
import { ExchangePerilDirect, PauseKey } from '../internal/routing/routing.js';

async function main() {
  const rabbitConnString = 'amqp://guest:guest@localhost:5672/';
  const conn = await amqp.connect(rabbitConnString);

  console.log('Starting Peril client...');

  const username = await clientWelcome();

  const [channel, assertQueue] = await declareAndBind(
    conn,
    ExchangePerilDirect,
    `${PauseKey}.${username}`,
    PauseKey,
    SimpleQueueType.Transient,
  );
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
