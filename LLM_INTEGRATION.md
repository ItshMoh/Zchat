# ZChat - LLM Integration Guide

## Environment Setup

You need to add your OpenRouter API key to the `.env` file:

```bash
OPENROUTER_API_KEY=your_api_key_here
SITE_URL=http://localhost:3000
```

Get your API key from: https://openrouter.ai/keys

## How It Works

1. **User sends message** → Frontend sends to `/api/chat`
2. **Backend receives message** → Initializes MCP client if needed
3. **LLM processes** → OpenRouter (Claude 3.5 Sonnet) with system prompt
4. **Tool calling** → If LLM needs data, it calls MCP tools:
   - `get_token_price` - CoinGecko API
   - `get_charity_details` - Local JSON data
   - `get_hotel_details` - Local JSON data
   - `process_payment` - Mock payment (3s delay)
5. **Tool execution** → MCP client executes tools via server
6. **Loop continues** → Results sent back to LLM until final answer
7. **Response returned** → Frontend displays message

## System Prompt Highlights

- Instructs LLM about all 4 available tools
- **Payment confirmation** - Must get explicit user confirmation before calling `process_payment`
- Conversational and helpful tone
- Uses user's wallet: `utest14ay3pwkzrp24hssupus9wamx6r8tqcfr8z0vn58t7ytar4xaw7lks98`

## Testing

Start both servers:

```bash
# Terminal 1: Start Next.js dev server
pnpm dev

# Terminal 2: MCP server runs automatically via API
```

Try these prompts:
- "What's the price of ZEC?"
- "Show me charities for children's cancer research"
- "I want to donate 2 ZEC to charity #1"
- "Find hotels in Miami"
- "Book the Premium Suite at hotel #1"

## Architecture

```
User Input
    ↓
ChatInterface (Frontend)
    ↓
POST /api/chat (Backend)
    ↓
OpenRouter LLM (Claude)
    ↓
MCP Client ←→ MCP Server (Tools)
    ↓
    ├─ CoinGecko API
    ├─ Charities JSON
    ├─ Hotels JSON
    └─ Payment Mock
```
