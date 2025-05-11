import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

if (!MONGODB_DB) {
  throw new Error("Please define the MONGODB_DB environment variable");
}

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { client, db } = await connectToDatabase();

      const decks = await db
        .collection("slide_decks")
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      res.status(200).json({ decks });
    } catch (error) {
      console.error("Error fetching decks:", error);
      res.status(500).json({ message: "Error fetching decks" });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
