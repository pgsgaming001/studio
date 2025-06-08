
import { MongoClient, type Db } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://pgsgaming001:pgsgaming@cluster0.4uvwyr6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'myFirstProjectDB';

if (!MONGODB_URI) {
  const detailedErrorMessage = `
CRITICAL CONFIGURATION ERROR:
The MONGODB_URI environment variable is not defined.
This application cannot connect to MongoDB without it.

To resolve this:
1. Ensure you have a MongoDB instance (e.g., MongoDB Atlas free tier, or a local instance).
2. Create a file named '.env.local' in the ROOT directory of your project (the same level as package.json).
3. Add the following lines to your .env.local file, replacing the placeholder values with your actual MongoDB connection string and desired database name:

   MONGODB_URI="your_mongodb_connection_string_here"
   DB_NAME="your_preferred_database_name"

   Example for MONGODB_URI (replace with your actual string):
   MONGODB_URI="mongodb+srv://<username>:<password>@<your-cluster-address>/<your-db-name>?retryWrites=true&w=majority"
   
   Example for DB_NAME:
   DB_NAME="myFirstProjectDB"

4. IMPORTANT: After creating or modifying the .env.local file, you MUST STOP and RESTART your Next.js development server for the changes to be loaded.

If you are deploying this application, these environment variables must be set in your hosting provider's environment settings.
`;
  console.error(detailedErrorMessage); // Log to server console for clarity
  throw new Error(detailedErrorMessage);
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient, db: Db }> {
  if (cachedClient && cachedDb) {
    try {
      // Verify connection by pinging the admin database
      await cachedClient.db(DB_NAME).command({ ping: 1 });
      // console.log("Using cached MongoDB connection.");
      return { client: cachedClient, db: cachedDb };
    } catch (e) {
      // console.warn("Cached MongoDB connection lost, attempting to reconnect.", e);
      // Connection was lost, clear cache and reconnect
      cachedClient = null;
      cachedDb = null;
    }
  }

  // console.log("Attempting to establish new MongoDB connection...");
  const client = new MongoClient(MONGODB_URI!); // MONGODB_URI is guaranteed to be defined here due to the check above
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    // console.log(`Successfully connected to MongoDB database: ${DB_NAME}`);
    
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    // Attempt to close client if connection failed partway
    await client.close().catch(closeError => console.error("Failed to close MongoDB client after connection error:", closeError));
    throw error; // Re-throw the connection error to be handled by the caller
  }
}

// Optional: Function to explicitly close the connection if needed (e.g., in serverless environments or tests)
export async function closeDatabaseConnection() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    // console.log("MongoDB connection closed.");
  }
}
