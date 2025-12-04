# ZChat MCP Server

Model Context Protocol (MCP) server for ZChat application providing tools for cryptocurrency prices, charity donations, and hotel bookings.

## Tools Available

### 1. `get_token_price`
Fetches current cryptocurrency prices from CoinGecko API.

**Parameters:**
- `tokenId` (required): CoinGecko token ID (e.g., "zcash", "bitcoin", "ethereum", "near")
- `currency` (optional): Currency for price (default: "usd")

**Example:**
```json
{
  "tokenId": "zcash",
  "currency": "usd"
}
```

**Returns:**
```json
{
  "token": "zcash",
  "currency": "USD",
  "price": 45.23,
  "marketCap": 678900000,
  "volume24h": 12340000,
  "priceChange24h": 2.5
}
```

### 2. `get_charity_details`
Retrieves information about child cancer research charities.

**Parameters:**
- `charityId` (optional): Specific charity ID (1-5), or omit to get all charities

**Example:**
```json
{
  "charityId": 1
}
```

**Returns:** Charity details including name, description, wallet address, impact stats, etc.

### 3. `get_hotel_details`
Fetches hotel booking information.

**Parameters:**
- `hotelId` (optional): Specific hotel ID (1-5)
- `location` (optional): Filter by location (e.g., "Miami", "Dubai")

**Example:**
```json
{
  "location": "Miami"
}
```

**Returns:** Hotel details including rooms, prices, amenities, and wallet addresses.

### 4. `process_payment`
Processes a mock payment transaction to a ZEC testnet wallet.

**Parameters:**
- `amount` (required): Amount in ZEC to transfer
- `recipientAddress` (required): ZEC testnet wallet address
- `purpose` (optional): Purpose of payment

**Example:**
```json
{
  "amount": 2,
  "recipientAddress": "utest14ay3pwkzrp24hssupus9wamx6r8tqcfr8z0vn58t7ytar4xaw7lks98",
  "purpose": "Donation to Children's Cancer Research Foundation"
}
```

**Returns (after 3 second delay):**
```json
{
  "status": "success",
  "message": "Payment processed successfully",
  "transactionHash": "0xabc123...",
  "amount": 2,
  "currency": "ZEC",
  "recipient": "utest14ay3pwkzrp24hssupus9wamx6r8tqcfr8z0vn58t7ytar4xaw7lks98",
  "purpose": "Donation to Children's Cancer Research Foundation",
  "timestamp": "2024-12-04T07:30:00.000Z",
  "network": "ZEC Testnet"
}
```

## Running the Server

```bash
# Start the MCP server
pnpm run mcp-server
```

The server uses stdio transport for communication with MCP clients.

## Integration with Claude Desktop

To use this MCP server with Claude Desktop, add the following to your Claude config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "zchat": {
      "command": "pnpm",
      "args": ["run", "mcp-server"],
      "cwd": "/path/to/your/zchat/project"
    }
  }
}
```

## Features

- ✅ Real-time cryptocurrency price data from CoinGecko
- ✅ 5 child cancer research charities with ZEC testnet wallets
- ✅ 5 hotels with multiple room types and ZEC testnet wallets
- ✅ Simulated payment processing with 3-second delay
- ✅ Type-safe with Zod schema validation
- ✅ Full MCP protocol compliance

## Tech Stack

- **MCP SDK:** `@modelcontextprotocol/sdk`
- **Schema Validation:** Zod
- **Runtime:** Node.js with TypeScript (tsx)
- **Transport:** stdio
