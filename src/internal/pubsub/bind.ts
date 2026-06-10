import amqp, { type Channel } from 'amqplib';

export enum SimpleQueueType {
  Durable,
  Transient,
}

export async function declareAndBind(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
): Promise<[Channel, amqp.Replies.AssertQueue]> {
  const chan = await conn.createChannel();

  const queueOptions: amqp.Options.AssertQueue =
    queueType === SimpleQueueType.Durable
      ? { durable: true }
      : { autoDelete: true, exclusive: true };
  const q = await chan.assertQueue(queueName, queueOptions);

  chan.bindQueue(queueName, exchange, key);

  return [chan, q];
}
