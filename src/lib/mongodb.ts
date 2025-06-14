
import { MongoClient, type Db } from 'mongodb';

// MONGODB_URI and DB_NAME will be accessed when connectToDatabase is called

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient, db: Db }> {
  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME || 'myFirstProjectDB';

  if (!MONGODB_URI) {
    const detailedErrorMessage = `
CRITICAL CONFIGURATION ERROR:
The MONGODB_URI environment variable is not defined.
This application cannot connect to MongoDB without it.

To resolve this:
1. For local development:
   - Ensure you have a MongoDB instance.
   - Create a file named '.env.local' in the ROOT directory of your project.
   - Add: MONGODB_URI="your_mongodb_connection_string_here"
   - Optionally add: DB_NAME="your_preferred_database_name" (defaults to ${DB_NAME} if not set)
   - Example MONGODB_URI: "mongodb+srv://<username>:<password>@<your-cluster-address>/<your-db-name>?retryWrites=true&w=majority"
   - RESTART your Next.js development server after changes.

2. For deployment (e.g., on Railway):
   - Set MONGODB_URI as an environment variable in your hosting provider's settings.
   - Optionally set DB_NAME as an environment variable.

This application will not function correctly until MONGODB_URI is properly configured.
`;
    console.error(detailedErrorMessage);
    throw new Error("MONGODB_URI environment variable is not set. Refer to console for details.");
  }

  if (cachedClient && cachedDb) {
    // Ensure the cachedDb is for the correct DB_NAME if DB_NAME could vary dynamically,
    // though typically it's fixed per MONGODB_URI.
    // For this app structure, if client is cached, the db associated with it is also assumed correct.
    if (cachedDb.databaseName === DB_NAME) {
        try {
            await cachedClient.db(DB_NAME).command({ ping: 1 });
            console.log("Using cached MongoDB connection.");
            return { client: cachedClient, db: cachedDb };
        } catch (e) {
            console.warn("Cached MongoDB connection failed ping, attempting to reconnect.", e);
            // Invalidate cache if ping fails
            await cachedClient.close().catch(closeError => console.error("Error closing stale cached client:", closeError));
            cachedClient = null;
            cachedDb = null;
        }
    } else {
        console.warn(`Cached DB name "${cachedDb.databaseName}" does not match requested DB_NAME "${DB_NAME}". Forcing reconnect.`);
        await cachedClient.close().catch(closeError => console.error("Error closing client due to DB_NAME mismatch:", closeError));
        cachedClient = null;
        cachedDb = null;
    }
  }

  console.log(`Attempting to connect to MongoDB. URI: [${MONGODB_URI.substring(0,20)}...], DB: ${DB_NAME}`);
  const client = new MongoClient(MONGODB_URI); 
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    cachedClient = client;
    cachedDb = db;
    
    console.log(`Successfully connected to MongoDB. Database: ${DB_NAME}`);
    return { client, db };
  } catch (error) {
    console.error("Failed to establish a new connection to MongoDB:", error);
    // client.close() might not be safe if client.connect() failed partway.
    // MongoClient handles its own state on connect failure.
    throw error; 
  }
}

export async function closeDatabaseConnection() {
  if (cachedClient) {
    try {
        await cachedClient.close();
        console.log("MongoDB connection closed successfully.");
    } catch (error) {
        console.error("Error closing MongoDB connection:", error);
    } finally {
        cachedClient = null;
        cachedDb = null;
    }
  } else {
    console.log("No active MongoDB connection to close.");
  }
}
