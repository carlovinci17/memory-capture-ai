import { CosmosClient, type Container, type Database } from '@azure/cosmos';

const DB_ID = 'memorycapture';

let sharedDb: Promise<Database> | null = null;

function getDb(): Promise<Database> {
  if (sharedDb) return sharedDb;
  const conn = process.env.COSMOS_CONNECTION_STRING;
  if (!conn) throw new Error('Cosmos is not configured.');
  sharedDb = (async () => {
    const { database } = await new CosmosClient(conn).databases.createIfNotExists({ id: DB_ID });
    return database;
  })();
  return sharedDb;
}

export function isCosmosConfigured(): boolean {
  return Boolean(process.env.COSMOS_CONNECTION_STRING);
}

let profilesContainer: Container | null = null;

export async function getProfilesContainer(): Promise<Container> {
  if (profilesContainer) return profilesContainer;
  const db = await getDb();
  const { container } = await db.containers.createIfNotExists({
    id: 'profiles',
    partitionKey: { paths: ['/accountId'] },
  });
  profilesContainer = container;
  return profilesContainer;
}

let usersContainer: Container | null = null;

export async function getUsersContainer(): Promise<Container> {
  if (usersContainer) return usersContainer;
  const db = await getDb();
  const { container } = await db.containers.createIfNotExists({
    id: 'users',
    partitionKey: { paths: ['/id'] },
  });
  usersContainer = container;
  return usersContainer;
}
