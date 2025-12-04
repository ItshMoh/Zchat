import { NextRequest, NextResponse } from 'next/server';
import { fetchChat } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const chat_id = searchParams.get('chat_id');
        const wallet_id = searchParams.get('wallet_id');

        if (!chat_id || !wallet_id) {
            return NextResponse.json(
                { error: 'chat_id and wallet_id are required' },
                { status: 400 }
            );
        }

        // Fetch chat from MongoDB
        const chatDoc = await fetchChat(wallet_id, chat_id);

        if (!chatDoc || !chatDoc.memory) {
            return NextResponse.json({ messages: [] });
        }

        return NextResponse.json({ messages: chatDoc.memory });
    } catch (error: any) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch chat history' },
            { status: 500 }
        );
    }
}
