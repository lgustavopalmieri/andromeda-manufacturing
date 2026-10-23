import { randomUUID } from "node:crypto";
import {
  CreateQueueCommand,
  SQSClient,
  type CreateQueueCommandInput,
  type SQSClientConfig,
} from "@aws-sdk/client-sqs";
import { GenericContainer, type StartedTestContainer, Wait } from "testcontainers";

export const LOCALSTACK_SQS_DEFAULT_REGION = "us-east-1";
export interface LocalStackSqsCredentialsInterface {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}

export const LOCALSTACK_SQS_DEFAULT_CREDENTIALS: LocalStackSqsCredentialsInterface = {
  accessKeyId: "test",
  secretAccessKey: "test",
};

export interface CreateLocalStackSqsClientConfigOptionsInterface {
  readonly endpoint: string;
  readonly region?: string;
  readonly credentials?: LocalStackSqsCredentialsInterface;
}

export const createLocalStackSqsClientConfig = ({
  endpoint,
  region = LOCALSTACK_SQS_DEFAULT_REGION,
  credentials = LOCALSTACK_SQS_DEFAULT_CREDENTIALS,
}: CreateLocalStackSqsClientConfigOptionsInterface): SQSClientConfig => ({
  endpoint,
  region,
  credentials,
});

type SqsQueueAttributes = NonNullable<CreateQueueCommandInput["Attributes"]>;

export interface CreateSqsQueueOptionsInterface {
  readonly queueName?: string;
  readonly attributes?: SqsQueueAttributes;
}

export interface CreateFifoSqsQueueOptionsInterface extends CreateSqsQueueOptionsInterface {
  readonly contentBasedDeduplication?: boolean;
}

export interface SqsTestQueueInterface {
  readonly queueName: string;
  readonly queueUrl: string;
}

export interface LocalStackSqsTestContainerInterface {
  readonly container: StartedTestContainer;
  readonly endpoint: string;
  readonly region: string;
  readonly credentials: LocalStackSqsCredentialsInterface;
  readonly clientConfig: SQSClientConfig;
  readonly client: SQSClient;
  createQueue(options?: CreateSqsQueueOptionsInterface): Promise<SqsTestQueueInterface>;
  createFifoQueue(options?: CreateFifoSqsQueueOptionsInterface): Promise<SqsTestQueueInterface>;
  stop(): Promise<void>;
}

export interface StartLocalStackSqsOptionsInterface {
  readonly image?: string;
  readonly region?: string;
  readonly credentials?: LocalStackSqsCredentialsInterface;
}

const LOCALSTACK_SQS_IMAGE = "localstack/localstack:3.8.0";
const LOCALSTACK_EDGE_PORT = 4566;

const createQueue = async (
  client: SQSClient,
  options: CreateSqsQueueOptionsInterface = {},
): Promise<SqsTestQueueInterface> => {
  const queueName = options.queueName ?? `andromeda-test-${randomUUID()}`;
  const queue = await client.send(
    new CreateQueueCommand({
      QueueName: queueName,
      ...(options.attributes ? { Attributes: options.attributes } : {}),
    }),
  );

  if (!queue.QueueUrl) throw new Error("LocalStack did not create an SQS queue URL.");

  return { queueName, queueUrl: queue.QueueUrl };
};

const fifoQueueName = (queueName: string): string =>
  queueName.endsWith(".fifo") ? queueName : `${queueName}.fifo`;

export const startLocalStackSqs = async (
  options: StartLocalStackSqsOptionsInterface = {},
): Promise<LocalStackSqsTestContainerInterface> => {
  const region = options.region ?? LOCALSTACK_SQS_DEFAULT_REGION;
  const credentials = options.credentials ?? LOCALSTACK_SQS_DEFAULT_CREDENTIALS;
  const container = await new GenericContainer(options.image ?? LOCALSTACK_SQS_IMAGE)
    .withEnvironment({ SERVICES: "sqs", DEFAULT_REGION: region })
    .withExposedPorts(LOCALSTACK_EDGE_PORT)
    .withWaitStrategy(Wait.forHealthCheck())
    .withStartupTimeout(120_000)
    .start();
  const endpoint = `http://${container.getHost()}:${container.getMappedPort(LOCALSTACK_EDGE_PORT)}`;
  const clientConfig = createLocalStackSqsClientConfig({ endpoint, region, credentials });
  const client = new SQSClient(clientConfig);

  return {
    container,
    endpoint,
    region,
    credentials,
    clientConfig,
    client,
    createQueue: (queueOptions = {}) => createQueue(client, queueOptions),
    createFifoQueue: async (queueOptions = {}) =>
      createQueue(client, {
        queueName: fifoQueueName(queueOptions.queueName ?? `andromeda-test-${randomUUID()}`),
        attributes: {
          ...queueOptions.attributes,
          FifoQueue: "true",
          ContentBasedDeduplication: String(queueOptions.contentBasedDeduplication ?? false),
        },
      }),
    stop: async () => {
      client.destroy();
      await container.stop();
    },
  };
};
