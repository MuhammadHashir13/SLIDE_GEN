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
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { name, slides, theme, slideType } = req.body;

    if (!name || !slides || !theme || !slideType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const { client, db } = await connectToDatabase();

    const result = await db.collection("slide_decks").insertOne({
      name,
      slides,
      theme,
      slideType,
      createdAt: new Date(),
    });

    res.status(200).json({
      message: "Slide deck saved successfully",
      deckId: result.insertedId,
    });
  } catch (error) {
    console.error("Error saving slide deck:", error);
    res.status(500).json({ message: "Error saving slide deck" });
  }
}
