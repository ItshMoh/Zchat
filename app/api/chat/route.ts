import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { addChat, ChatMessage } from '@/lib/mongodb';

// OpenRouter configuration
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';

// System prompt with tool descriptions
const SYSTEM_PROMPT = `You are ZChat AI, a helpful assistant for ZCash-based transactions on testnet.

You have access to the following tools:

1. **get_token_price**: Get real-time cryptocurrency prices from CoinGecko
   - Use when users ask about token prices, market data, or crypto values
   - Example: "What's the price of ZEC?" or "How much is Bitcoin worth?"
   - **Important**: For ZEC, use tokenId "zcash" (not "zec")

2. **get_price_history**: Get historical price data and generate price charts
   - Use when users ask about price trends, history, or want to see price graphs
   - Returns daily price points that will be displayed as an interactive chart
   - Example: "Show me ZEC price for the last 7 days" or "Give me a Bitcoin price chart"
   - **Important**: For ZEC, use tokenId "zcash" (not "zec")

3. **get_charity_details**: Fetch information about child cancer research charities
   - Use when users want to donate or learn about charities
   - Returns 5 charities with wallet addresses, impact stats, and focus areas
   - Example: "Show me charities for children's cancer research"

4. **get_hotel_details**: Get hotel booking information
   - Use when users want to book hotels or see accommodation options
   - Returns 5 hotels with rooms, prices in ZEC, and amenities
   - Can filter by location
   - Example: "Find hotels in Miami" or "Show me hotels"

5. **process_payment**: Process ZEC testnet payment transactions
   - **CRITICAL**: Only use this tool AFTER the user explicitly confirms the payment
   - Always show the user the details (amount, recipient, purpose) and ask for confirmation first
   - Returns payment confirmation after 3-second processing delay (no transaction hash)
   - Example flow: User says "donate 2 ZEC to charity #1" → You show details → User confirms → Then call this tool

**Important Guidelines:**
- Be conversational and helpful
- When users want to donate or book, first use get_charity_details or get_hotel_details
- Present options clearly with numbers (1-5)
- Before calling process_payment, ALWAYS confirm with the user: amount, recipient, and purpose
- Use the user's connected wallet: utest14ay3pwkzrp24hssupus9wamx6r8tqcfr8z0vn58t7ytar4xaw7lks98
- All payments are on ZEC Testnet
- When you generate charts, inform the user and include the chart path in your response
- **Token ID Mapping**: When users ask about "ZEC", use tokenId "zcash" for CoinGecko API calls

Remember: Never process payments without explicit user confirmation!`;

// MCP Client setup
let mcpClient: Client | null = null;
let mcpTransport: StdioClientTransport | null = null;

async function initializeMCPClient() {
    if (mcpClient) return mcpClient;

    try {
        // Create transport with command
        mcpTransport = new StdioClientTransport({
            command: 'pnpm',
            args: ['run', 'mcp-server'],
            env: process.env as Record<string, string>,
        });

        // Create client
        mcpClient = new Client(
            {
                name: 'zchat-client',
                version: '1.0.0',
            },
            {
                capabilities: {},
            }
        );

        // Connect to server
        await mcpClient.connect(mcpTransport);
        console.log('MCP Client connected to server');

        return mcpClient;
    } catch (error) {
        console.error('Failed to initialize MCP client:', error);
        throw error;
    }
}

// Convert MCP tools to OpenAI function format
async function getMCPTools() {
    const client = await initializeMCPClient();
    const toolsList = await client.listTools();

    return toolsList.tools.map((tool: any) => ({
        type: 'function' as const,
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
        },
    }));
}

// Execute MCP tool
async function executeMCPTool(toolName: string, args: any) {
    const client = await initializeMCPClient();
    const result = await client.callTool({
        name: toolName,
        arguments: args,
    });

    // Extract text content from result
    if (result.content && Array.isArray(result.content)) {
        const textContent = result.content.find((c: any) => c.type === 'text');
        return textContent?.text || JSON.stringify(result.content);
    }

    return JSON.stringify(result);
}

export async function POST(req: NextRequest) {
    try {
        const { messages, chat_id, wallet_id } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Invalid request: messages array required' },
                { status: 400 }
            );
        }

        if (!chat_id || !wallet_id) {
            return NextResponse.json(
                { error: 'chat_id and wallet_id are required' },
                { status: 400 }
            );
        }

        if (!OPENROUTER_API_KEY) {
            return NextResponse.json(
                { error: 'OpenRouter API key not configured' },
                { status: 500 }
            );
        }

        // Get MCP tools
        const tools = await getMCPTools();

        // Helper function to call OpenRouter API
        async function callOpenRouter(conversationMessages: any[]) {
            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': SITE_URL,
                    'X-Title': 'ZChat',
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4.1-nano',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...conversationMessages,
                    ],
                    tools,
                    tool_choice: 'auto',
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `OpenRouter API error: ${response.status} - ${errorData.error?.message || response.statusText}`
                );
            }

            return await response.json();
        }

        // Make initial LLM call
        let apiResponse = await callOpenRouter(messages);
        let assistantMessage = apiResponse.choices[0].message;
        const conversationMessages = [...messages];

        // Handle tool calls in a loop
        while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            // Add assistant message with tool calls to conversation
            conversationMessages.push(assistantMessage);

            // Debug: log the tool calls to see the format
            console.log('Tool calls received:', JSON.stringify(assistantMessage.tool_calls, null, 2));

            // Execute all tool calls
            const toolResults = await Promise.all(
                assistantMessage.tool_calls.map(async (toolCall: any) => {
                    // Handle arguments - it might be a string or already an object
                    let args;
                    if (typeof toolCall.function.arguments === 'string') {
                        args = JSON.parse(toolCall.function.arguments);
                    } else if (typeof toolCall.function.arguments === 'object') {
                        args = toolCall.function.arguments;
                    } else {
                        args = {};
                    }

                    const result = await executeMCPTool(toolCall.function.name, args);

                    return {
                        role: 'tool' as const,
                        tool_call_id: toolCall.id,
                        content: result,
                    };
                })
            );

            // Add tool results to conversation
            conversationMessages.push(...toolResults);

            // Get next LLM response
            apiResponse = await callOpenRouter(conversationMessages);
            assistantMessage = apiResponse.choices[0].message;
        }

        // Save messages to MongoDB
        try {
            // Prepare messages for saving (only user and assistant messages, not tool calls)
            const messagesToSave: ChatMessage[] = [];

            // Get the last user message from input
            const lastUserMessage = messages[messages.length - 1];
            if (lastUserMessage) {
                messagesToSave.push({
                    role: lastUserMessage.role,
                    content: lastUserMessage.content,
                });
            }

            // Add assistant's final response
            messagesToSave.push({
                role: 'assistant',
                content: assistantMessage.content || '',
            });

            await addChat(wallet_id, chat_id, messagesToSave);
        } catch (dbError) {
            console.error('Failed to save to MongoDB:', dbError);
            // Don't fail the request if DB save fails
        }

        // Return final response
        // Extract price history data if it was called
        let priceHistoryData = null;
        let hotelData = null;
        const toolMessages = conversationMessages.filter((m: any) => m.role === 'tool');
        for (const toolMsg of toolMessages) {
            try {
                const result = JSON.parse(toolMsg.content);
                // Check for price history data
                if (result.dataPoints && result.token) {
                    priceHistoryData = result;
                }
                // Check for hotel data (array of hotels)
                if (Array.isArray(result) && result.length > 0 && result[0].hotelImage) {
                    hotelData = result;
                }
            } catch (e) {
                // Not JSON or not relevant data, skip
            }
        }

        return NextResponse.json({
            message: assistantMessage.content,
            toolCalls: conversationMessages.filter((m: any) => m.tool_calls).length,
            priceData: priceHistoryData,
            hotelData: hotelData,
        });
    } catch (error: any) {
        console.error('Chat API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

