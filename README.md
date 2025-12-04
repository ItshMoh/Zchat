# ZChat

A privacy-preserving AI-powered chat application with cryptocurrency integration, built using NEAR AI Cloud that runs inside a Trusted Execution Environment (TEE). ZChat enables users to interact with an intelligent assistant that can fetch crypto prices, provide charity information, and facilitate hotel bookings - all while maintaining privacy through TEE.

## 🌟 Features

- **Privacy-Preserving AI**: Powered by NEAR AI Cloud running inside TEE (Trusted Execution Environment) for secure, private AI computations
- **Wallet Integration**: Connect your Solana wallet for seamless Web3 interactions
- **Cryptocurrency Price Tracking**: Real-time crypto prices with interactive charts powered by Plotly
- **Charity Donations**: Browse and donate to children's cancer research charities
- **Hotel Bookings**: Search and book hotels with cryptocurrency
- **Chat Persistence**: MongoDB-backed chat history storage
- **Model Context Protocol (MCP)**: Tool-calling capabilities for extended functionality
- **Modern UI**: Chat interface with markdown support and real-time updates

## 🏗️ Architecture

```
User Input
    ↓
ChatInterface (React/Next.js Frontend)
    ↓
POST /api/chat (Next.js API Route)
    ↓
NEAR AI Cloud (DeepSeek V3.1)
    ↓
MCP Client ←→ MCP Server (Tools)
    ↓
    ├─ CoinGecko API (Price Data)
    ├─ Charities JSON (Mock Data)
    ├─ Hotels JSON (Mock Data)
    └─ MongoDB (Chat Persistence)
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Plotly.js** - Interactive cryptocurrency charts
- **React Markdown** - Rich message formatting

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NEAR AI Cloud** - Privacy-preserving LLM with TEE
- **MongoDB** - Chat history and wallet storage
- **Model Context Protocol (MCP)** - Tool integration framework

### MCP Server Tools
- **get_token_price** - Fetch crypto prices from CoinGecko
- **get_charity_details** - Retrieve charity information
- **get_hotel_details** - Search and retrieve hotel data
- **process_payment** - Handle cryptocurrency transactions
- **get_price_history** - Fetch historical price data for charts

## 📋 Prerequisites

Before setting up the project, ensure you have:

- **Node.js** (v18 or higher)
- **pnpm** (recommended package manager)
- **MongoDB** instance (local or cloud)
- **NEAR AI Cloud API key** ([Get one here](https://cloud.near.ai/))

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd zchat
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# NEAR AI Cloud Configuration
NEAR_API_KEY=your_near_ai_cloud_api_key_here

# Site Configuration
SITE_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/Zchat
# or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/Zchat

# Database and Collection Names
DB_NAME=Zchat
COLLECTION_NAME=chat
```

**Getting Your NEAR AI Cloud API Key:**
1. Visit [https://cloud.near.ai/](https://cloud.near.ai/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Generate a new API key
5. Copy and paste it into your `.env` file

### 4. Set Up MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB (Ubuntu/Debian)
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongodb
```

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Add it to your `.env` file as `MONGODB_URI`

### 5. Run the Development Server

```bash
# Start the Next.js development server
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 6. MCP Server

The MCP server runs automatically when the API is called. However, you can test it independently:

```bash
# Run MCP server standalone
pnpm run mcp-server
```

## 📖 Usage

### Example Prompts to Try

Once the application is running, try these prompts in the chat:

1. **Cryptocurrency Prices:**
   - "What's the current price of Bitcoin?"
   - "Show me the price of ZEC in USD"
   - "Get me the price history of Ethereum"

2. **Charity Donations:**
   - "Show me charities for children's cancer research"
   - "Tell me about charity #1"
   - "I want to donate to a cancer research charity"

3. **Hotel Bookings:**
   - "Find hotels in Miami"
   - "Show me hotels in Dubai"
   - "Tell me about the rooms at hotel #2"

4. **Interactive Charts:**
   - "Show me Bitcoin price history for the last 7 days"
   - "Display Ethereum price chart"

## 🔧 Project Structure

```
zchat/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Main chat API endpoint
│   ├── components/
│   │   ├── ChatInterface.tsx     # Main chat UI component
│   │   ├── MarkdownRenderer.tsx  # Message rendering with markdown
│   │   ├── PriceChart.tsx        # Plotly chart component
│   │   └── ...
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── data/
│   ├── charities.json            # Charity data (mocked)
│   └── hotels.json               # Hotel data (mocked)
├── lib/
│   └── mongodb.ts                # MongoDB connection and utilities
├── mcp-server/
│   ├── index.ts                  # MCP server implementation
│   └── README.md                 # MCP server documentation
├── public/                       # Static assets
├── .env                          # Environment variables (create this)
├── package.json                  # Project dependencies
└── README.md                     # This file
```

## 🔐 Privacy & Security

ZChat uses **NEAR AI Cloud** which runs inside a **Trusted Execution Environment (TEE)**. This means:

- All AI computations happen in an isolated, secure environment
- Your conversations are processed privately and securely
- Data is encrypted during processing
- No unauthorized access to your chat data or wallet information

## 📝 Important Notes

### Mocked Data for Testing

This project includes **mocked data** for hotels and charities in the `data/` directory:

- **`data/hotels.json`** - Contains mock hotel listings with various room types and pricing
- **`data/charities.json`** - Contains mock children's cancer research charities

**Why Mocked Data?**

These charities and hotels don't allow testing with test wallets on testnet environments. To provide a seamless development and testing experience without requiring real transactions, we've created realistic mock data that simulates the actual behavior of these services. This allows you to:

- Test the full user flow without real payments
- Develop and debug features safely
- Demonstrate the application's capabilities without financial risk

For production deployment, these would need to be replaced with real API integrations and proper payment processing systems that support mainnet transactions.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Restart MongoDB
sudo systemctl restart mongodb
```

### Dependencies Installation Issues
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### NEAR API Connection Issues
- Verify your API key is correct in `.env`
- Check if you have an active internet connection
- Ensure your API key has not expired

### MCP Server Issues
- Make sure all dependencies are installed
- Check that TypeScript compilation is working: `pnpm run mcp-server`
- Review MCP server logs for specific errors

## 📚 Additional Resources

- [NEAR AI Cloud Documentation](https://cloud.near.ai/docs)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [CoinGecko API](https://www.coingecko.com/en/api)

---

Built with ❤️ using NEAR AI Cloud and privacy-preserving technology
