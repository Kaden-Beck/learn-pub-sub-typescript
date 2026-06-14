import { declareAndBind, type SimpleQueueType } from './bind.js';
import amqp from 'amqplib';

export async function subscribeJSON<T>(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => void,
): Promise<void> {
  const [channel, assertQueue] = await declareAndBind(
    conn,
    exchange,
    queueName,
    key,
    queueType,
  );

  const consumeMsg = (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    const data: T = JSON.parse(msg.content.toString());
    handler(data);
    channel.ack(msg);
  };

  const a = await channel.consume(assertQueue.queue, consumeMsg);
}
