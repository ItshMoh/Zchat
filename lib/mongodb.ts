import { MongoClient, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
}

export default clientPromise;

// Database and collection names
const MONGODB_DB = process.env.MONGODB_DB || 'Zchat';
const MONGODB_COLLECTION = process.env.MONGODB_COLLECTION || 'chat';

// Type definitions
export interface ChatMessage {
    role: string;
    content: string;
}

export interface ChatDocument {
    wallet_id: string;
    chat_id: string;
    memory: ChatMessage[];
}

/**
 * Add or update chat messages in the database
 * @param wallet_id - The wallet ID of the user
 * @param chat_id - The unique chat ID
 * @param messages - Array of messages to add to the chat memory
 * @returns The updated chat document
 */
export async function addChat(
    wallet_id: string,
    chat_id: string,
    messages: ChatMessage[]
): Promise<ChatDocument> {
    try {
        const client = await clientPromise;
        const db = client.db(MONGODB_DB);
        const collection = db.collection<ChatDocument>(MONGODB_COLLECTION);

        // Use upsert to either update existing chat or create a new one
        const result = await collection.findOneAndUpdate(
            { wallet_id, chat_id },
            {
                $push: { memory: { $each: messages } },
                $setOnInsert: { wallet_id, chat_id }
            },
            {
                upsert: true,
                returnDocument: 'after'
            }
        );

        if (!result) {
            throw new Error('Failed to add chat messages');
        }

        return result;
    } catch (error) {
        console.error('Error adding chat:', error);
        throw error;
    }
}

/**
 * Fetch chat messages from the database
 * @param wallet_id - The wallet ID of the user
 * @param chat_id - The unique chat ID
 * @returns The chat document with all messages, or null if not found
 */
export async function fetchChat(
    wallet_id: string,
    chat_id: string
): Promise<ChatDocument | null> {
    try {
        const client = await clientPromise;
        const db = client.db(MONGODB_DB);
        const collection = db.collection<ChatDocument>(MONGODB_COLLECTION);

        const chat = await collection.findOne({ wallet_id, chat_id });

        return chat;
    } catch (error) {
        console.error('Error fetching chat:', error);
        throw error;
    }
}
