// cosmos.ts — lazily-constructed Cosmos DB container for storyteller profiles.
// Connection string lives only here (server-side). Documents are partitioned by
// /accountId so every read/write is naturally scoped to one owner.
import { CosmosClient, type Container } from '@azure/cosmos';

const DB_ID = 'memorycapture';
const CONTAINER_ID = 'profiles';

let container: Container | null = null;

export function isCosmosConfigured(): boolean {
  return Boolean(process.env.COSMOS_CONNECTION_STRING);
}

export async function getProfilesContainer(): Promise<Container> {
  if (container) return container;
  const conn = process.env.COSMOS_CONNECTION_STRING;
  if (!conn) throw new Error('Cosmos is not configured.');
  const client = new CosmosClient(conn);
  const { database } = await client.databases.createIfNotExists({ id: DB_ID });
  const created = await database.containers.createIfNotExists({
    id: CONTAINER_ID,
    partitionKey: { paths: ['/accountId'] },
  });
  container = created.container;
  return container;
}
