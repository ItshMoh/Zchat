#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load mock data
const charitiesData = JSON.parse(
    readFileSync(join(__dirname, '..', 'data', 'charities.json'), 'utf-8')
);
const hotelsData = JSON.parse(
    readFileSync(join(__dirname, '..', 'data', 'hotels.json'), 'utf-8')
);

// Zod schemas for tool inputs
const GetTokenPriceSchema = z.object({
    tokenId: z.string().describe('CoinGecko token ID (e.g., zcash, bitcoin, ethereum)'),
    currency: z.string().optional().default('usd').describe('Currency for price (default: usd)'),
});

const GetCharityDetailsSchema = z.object({
    charityId: z.number().optional().describe('Specific charity ID (1-5), or omit to get all charities'),
});

const GetHotelDetailsSchema = z.object({
    hotelId: z.number().optional().describe('Specific hotel ID (1-5), or omit to get all hotels'),
    location: z.string().optional().describe('Filter hotels by location'),
});

const PaymentSchema = z.object({
    amount: z.number().describe('Amount in ZEC to transfer'),
    recipientAddress: z.string().describe('ZEC testnet wallet address to send to'),
    purpose: z.string().optional().describe('Purpose of payment (e.g., donation, hotel booking)'),
});

const GetPriceHistorySchema = z.object({
    tokenId: z.string().describe('CoinGecko token ID (e.g., zcash, bitcoin, ethereum)'),
    days: z.number().optional().default(7).describe('Number of days of history (default: 7)'),
    currency: z.string().optional().default('usd').describe('Currency for price (default: usd)'),
});

// Create MCP Server
const server = new Server(
    {
        name: 'zchat-mcp-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Tool 1: Get Token Price from CoinGecko
async function getTokenPrice(tokenId: string, currency: string = 'usd') {
    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=${currency}&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`
        );

        if (!response.ok) {
            throw new Error(`CoinGecko API error: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data[tokenId]) {
            throw new Error(`Token ${tokenId} not found`);
        }

        return {
            token: tokenId,
            currency: currency.toUpperCase(),
            price: data[tokenId][currency],
            marketCap: data[tokenId][`${currency}_market_cap`] || null,
            volume24h: data[tokenId][`${currency}_24h_vol`] || null,
            priceChange24h: data[tokenId][`${currency}_24h_change`] || null,
        };
    } catch (error: any) {
        throw new Error(`Failed to fetch token price: ${error.message}`);
    }
}

// Tool 2: Get Charity Details
function getCharityDetails(charityId?: number) {
    if (charityId) {
        const charity = charitiesData.find((c: any) => c.id === charityId);
        if (!charity) {
            throw new Error(`Charity with ID ${charityId} not found`);
        }
        return charity;
    }
    return charitiesData;
}

// Tool 3: Get Hotel Details
function getHotelDetails(hotelId?: number, location?: string) {
    let hotels = hotelsData;

    if (location) {
        hotels = hotels.filter((h: any) =>
            h.location.toLowerCase().includes(location.toLowerCase())
        );
    }

    if (hotelId) {
        const hotel = hotels.find((h: any) => h.id === hotelId);
        if (!hotel) {
            throw new Error(`Hotel with ID ${hotelId} not found`);
        }
        return hotel;
    }

    return hotels;
}

// Tool 4: Mock Payment Processing
async function processPayment(amount: number, recipientAddress: string, purpose?: string) {
    // Simulate 3 second processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    return {
        status: 'success',
        message: 'Payment processed successfully',
        amount: amount,
        currency: 'ZEC',
        recipient: recipientAddress,
        purpose: purpose || 'Payment',
        timestamp: new Date().toISOString(),
        network: 'ZEC Testnet',
    };
}

// Tool 5: Get Price History (returns data for frontend chart rendering)
async function getPriceHistory(tokenId: string, days: number = 7, currency: string = 'usd') {
    try {
        console.error(`[getPriceHistory] Fetching data for ${tokenId}, ${days} days, ${currency}`);

        // Fetch historical data from CoinGecko
        const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?vs_currency=${currency}&days=${days}&interval=daily`
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[getPriceHistory] CoinGecko API error: ${response.status} - ${errorText}`);
            throw new Error(`CoinGecko API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.error(`[getPriceHistory] Received ${data.prices?.length || 0} price points`);

        if (!data.prices || data.prices.length === 0) {
            throw new Error(`No price data found for ${tokenId}`);
        }

        // Extract one price per day (take the first price of each day)
        const dailyPrices: { date: string; price: number }[] = [];
        const seenDates = new Set<string>();

        for (const [timestamp, price] of data.prices) {
            const date = new Date(timestamp);
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

            if (!seenDates.has(dateStr)) {
                seenDates.add(dateStr);
                dailyPrices.push({
                    date: dateStr,
                    price: price
                });
            }
        }

        console.error(`[getPriceHistory] Extracted ${dailyPrices.length} daily prices`);

        return {
            token: tokenId,
            currency: currency.toUpperCase(),
            days: days,
            dataPoints: dailyPrices,
            minPrice: Math.min(...dailyPrices.map(d => d.price)),
            maxPrice: Math.max(...dailyPrices.map(d => d.price)),
            currentPrice: dailyPrices[dailyPrices.length - 1].price,
        };
    } catch (error: any) {
        console.error(`[getPriceHistory] Error: ${error.message}`, error.stack);
        throw new Error(`Failed to fetch price history: ${error.message}`);
    }
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'get_token_price',
                description: 'Get current price and market data for a cryptocurrency token from CoinGecko API',
                inputSchema: {
                    type: 'object',
                    properties: {
                        tokenId: {
                            type: 'string',
                            description: 'CoinGecko token ID (e.g., zcash, bitcoin, ethereum, near)',
                        },
                        currency: {
                            type: 'string',
                            description: 'Currency for price (default: usd)',
                            default: 'usd',
                        },
                    },
                    required: ['tokenId'],
                },
            },
            {
                name: 'get_charity_details',
                description: 'Fetch details of child cancer research charities. Can get all charities or a specific one by ID (1-5)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        charityId: {
                            type: 'number',
                            description: 'Specific charity ID (1-5), or omit to get all charities',
                        },
                    },
                },
            },
            {
                name: 'get_hotel_details',
                description: 'Fetch hotel booking details. Returns all hotels filtered by location. Do not use hotelId - always search by location to show all available hotels with their images.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        hotelId: {
                            type: 'number',
                            description: 'Specific hotel ID (1-5), or omit to get all hotels',
                        },
                        location: {
                            type: 'string',
                            description: 'Filter hotels by location (e.g., Denver, Aspen, Boulder, Colorado Springs, Vail)',
                        },
                    },
                },
            },
            {
                name: 'process_payment',
                description: 'Process a payment transaction to a ZEC testnet wallet. Simulates payment with 3 second delay and returns transaction details',
                inputSchema: {
                    type: 'object',
                    properties: {
                        amount: {
                            type: 'number',
                            description: 'Amount in ZEC to transfer',
                        },
                        recipientAddress: {
                            type: 'string',
                            description: 'ZEC testnet wallet address to send to',
                        },
                        purpose: {
                            type: 'string',
                            description: 'Purpose of payment (e.g., donation, hotel booking)',
                        },
                    },
                    required: ['amount', 'recipientAddress'],
                },
            },
            {
                name: 'get_price_history',
                description: 'Get historical price data for a cryptocurrency token and generate a price chart. Returns daily price points and a chart image',
                inputSchema: {
                    type: 'object',
                    properties: {
                        tokenId: {
                            type: 'string',
                            description: 'CoinGecko token ID (e.g., zcash, bitcoin, ethereum)',
                        },
                        days: {
                            type: 'number',
                            description: 'Number of days of history to fetch (default: 7)',
                            default: 7,
                        },
                        currency: {
                            type: 'string',
                            description: 'Currency for price (default: usd)',
                            default: 'usd',
                        },
                    },
                    required: ['tokenId'],
                },
            },
        ],
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case 'get_token_price': {
                const validated = GetTokenPriceSchema.parse(args);
                const result = await getTokenPrice(validated.tokenId, validated.currency);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case 'get_charity_details': {
                const validated = GetCharityDetailsSchema.parse(args);
                const result = getCharityDetails(validated.charityId);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case 'get_hotel_details': {
                const validated = GetHotelDetailsSchema.parse(args);
                const result = getHotelDetails(validated.hotelId, validated.location);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case 'process_payment': {
                const validated = PaymentSchema.parse(args);
                const result = await processPayment(
                    validated.amount,
                    validated.recipientAddress,
                    validated.purpose
                );
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            case 'get_price_history': {
                const validated = GetPriceHistorySchema.parse(args);
                const result = await getPriceHistory(
                    validated.tokenId,
                    validated.days,
                    validated.currency
                );
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            }

            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    } catch (error: any) {
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('ZChat MCP Server running on stdio');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
