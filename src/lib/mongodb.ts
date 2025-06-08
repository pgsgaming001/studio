
import { MongoClient, type Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'xeroxAppDB';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient, db: Db }> {
  if (cachedClient && cachedDb) {
    try {
      // Verify connection status before returning cached client
      await cachedClient.db(DB_NAME).command({ ping: 1 });
      // console.log("Using cached MongoDB connection.");
      return { client: cachedClient, db: cachedDb };
    } catch (e) {
      // console.warn("Cached MongoDB connection lost, attempting to reconnect.", e);
      cachedClient = null;
      cachedDb = null;
    }
  }

  // console.log("Attempting to establish new MongoDB connection...");
  const client = new MongoClient(MONGODB_URI!);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    // console.log(`Successfully connected to MongoDB database: ${DB_NAME}`);
    cachedClient = client;
    cachedDb = db;
    return { client, db };
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    // If connection fails, ensure client is closed to prevent hanging resources
    await client.close().catch(closeError => console.error("Failed to close MongoDB client after connection error:", closeError));
    throw error; // Re-throw the error after attempting to close client
  }
}

// Optional: A function to gracefully close the connection when the app shuts down
// This is more relevant for serverless functions or scripts that have a clear end.
// For a long-running Next.js app, the connection might be kept open.
export async function closeDatabaseConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    // console.log("MongoDB connection closed.");
  }
}
