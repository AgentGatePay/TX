# AgentGatePay Transaction Signing Service

**Secure blockchain transaction signing service with mandatory commission enforcement**

Production-ready deployment for autonomous AI agent payments. Enables agents to make payments without exposing private keys in client code.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/AgentGatePay/TX)
[![Docker Hub](https://img.shields.io/badge/Docker%20Hub-agentgatepay%2Ftx--signing--service-blue)](https://hub.docker.com/r/agentgatepay/tx-signing-service)

---

## ⚠️ IMPORTANT DISCLAIMER

**AgentGatePay is currently in BETA.** By using this transaction signing service and AgentGatePay, you acknowledge and accept:

- **Service Availability:** The service may be unavailable, suspended, or permanently shut down at any time without prior notice. No SLA or uptime guarantees.
- **Data Loss Risk:** All data may be lost at any time without recovery. Users are solely responsible for maintaining independent backups of transaction records.
- **No Liability:** AgentGatePay is NOT LIABLE for any direct, indirect, or consequential damages including lost cryptocurrency, failed transactions, service interruptions, or loss of revenue.
- **Financial Risk:** Blockchain transactions are irreversible. Users are solely responsible for securing private keys, API keys, wallet management, and compliance with applicable laws.
- **No Warranty:** This service is provided "AS IS" without warranties of any kind.

**📄 Read the full [DISCLAIMER.md](DISCLAIMER.md) before deploying this service.**

**BY USING THIS SERVICE, YOU AGREE TO THESE TERMS.**

---

## What is This?

The **TX Signing Service** is an external transaction signing server that handles blockchain payments on behalf of AI agents. Instead of embedding wallet private keys in client applications, agents make API calls to this service which signs and submits transactions securely.

**Key Features:**
- 🔐 **Owner Protection** - Only your API key can access the service
- 💰 **Automatic Commission** - Server-enforced 0.5% commission (cannot be bypassed)
- 🌐 **Multi-Chain** - Ethereum, Base, Polygon, Arbitrum
- 🪙 **Multi-Token** - USDC, USDT, DAI
- 🚀 **Easy Deploy** - One-click Render, Docker, or Railway
- ⚡ **Fast** - Signs and submits transactions in seconds

---

## Why Use This?

### Problem: Client-Side Signing is Risky

When AI agents sign transactions directly, you must:
- ❌ Store private keys in client code (security risk)
- ❌ Expose keys in environment variables (can leak)
- ❌ Trust client applications to enforce commission (can be bypassed)
- ❌ Handle wallet management in every agent (complexity)

### Solution: Server-Side Signing

With the TX Signing Service:
- ✅ Private keys stay on secure server (never in client code)
- ✅ Commission automatically enforced by server (cannot bypass)
- ✅ Simple API call replaces complex wallet management
- ✅ Single deployment serves multiple agents

---

## Quick Start

Choose your deployment method:

### Option 1: One-Click Deploy to Render (Recommended)

**Fastest way to get started** - 3 minutes from zero to production.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/AgentGatePay/TX)

**Setup:**
1. Click the button above
2. Enter your `AGENTGATEPAY_API_KEY` ([get one here](https://api.agentgatepay.com/v1/users/signup))
3. Enter your `WALLET_PRIVATE_KEY`
4. Wait 2-3 minutes for deployment
5. ✅ Done! Service running at `https://your-service.onrender.com`

**See:** [tx-signing-service/README.md](tx-signing-service/README.md) for complete Render deployment guide.

---

### Option 2: Docker Deployment

**Best for self-hosting** - Full control over infrastructure.

```bash
# Pull from Docker Hub
docker pull agentgatepay/tx-signing-service:latest

# Run with docker-compose
docker-compose up -d

# Check health
curl http://localhost:3000/health
```

**See:** [docker/README.md](docker/README.md) for Docker deployment guide with Kubernetes and ECS examples.

---

### Option 3: Railway Deployment

**Alternative one-click option** - Similar to Render.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/agentgatepay-tx)

**See:** tx-signing-service/README.md for Railway-specific instructions.

---

## How It Works

### Payment Flow

```
1. AI Agent → Requests payment signing from TX Service
            ↓
2. TX Service → Verifies API key (owner protection)
            ↓
3. TX Service → Fetches commission config from AgentGatePay
            ↓
4. TX Service → Calculates split: 0.5% commission + 99.5% merchant
            ↓
5. TX Service → Signs TWO transactions:
               • Commission → AgentGatePay wallet
               • Payment → Merchant wallet
            ↓
6. TX Service → Returns both transaction hashes to agent
            ↓
7. AI Agent → Submits tx_hash to AgentGatePay for verification
```

### Security Model

**Why This is Secure:**

1. **Owner Protection**
   - Only YOUR AgentGatePay API key can access the service
   - Unauthorized API keys get 403 Forbidden
   - Verified against AgentGatePay API on every request

2. **Server-Controlled Commission**
   - Commission address fetched from AgentGatePay (not client env vars)
   - Commission rate fetched from AgentGatePay (cannot be modified)
   - Client CANNOT bypass or reduce commission
   - Enforced at server level (atomic two-transaction split)

3. **Private Key Isolation**
   - Wallet private key stored on server only
   - Never sent to client
   - Optional: Move to encrypted Secret Files for maximum security

4. **Hardcoded API URL**
   - AgentGatePay API URL is hardcoded in service code
   - Client cannot point to fake API
   - All config comes from official AgentGatePay infrastructure

---

## API Reference

### `GET /health`

Health check endpoint (no authentication required).

**Response:**
```json
{
  "status": "healthy",
  "version": "4.0.0",
  "mode": "secure_server_fetched_config",
  "owner_protection": "enabled",
  "supported_chains": ["base", "ethereum", "polygon", "arbitrum"],
  "supported_tokens": ["USDC", "USDT", "DAI"]
}
```

---

### `POST /sign-payment`

Sign payment with automatic two-transaction commission enforcement.

**Headers:**
```
x-api-key: pk_live_your_api_key_here
Content-Type: application/json
```

**Request:**
```json
{
  "merchant_address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "total_amount": "15000000",
  "token": "USDC",
  "chain": "base"
}
```

**Response:**
```json
{
  "success": true,
  "tx_hash": "0xabc...merchant",
  "tx_hash_commission": "0xdef...commission",
  "merchant_amount": "14925000",
  "commission_amount": "75000",
  "commission_rate": 0.005,
  "commission_controlled_by": "agentgatepay",
  "explorerUrl": "https://basescan.org/tx/0xabc...",
  "explorerUrlCommission": "https://basescan.org/tx/0xdef..."
}
```

**What Happens:**
1. Service verifies your API key
2. Service fetches commission config from AgentGatePay
3. Service calculates split: commission (0.5%) + merchant (99.5%)
4. Service signs TWO transactions atomically
5. Service returns BOTH transaction hashes

---

## Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `WALLET_PRIVATE_KEY` | Your wallet private key | `0xabcd1234...` |
| `AGENTGATEPAY_API_KEY` | Your AgentGatePay API key | `pk_live_abc123...` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_RPC` | Base RPC endpoint | `https://mainnet.base.org` |
| `ETHEREUM_RPC` | Ethereum RPC endpoint | `https://cloudflare-eth.com` |
| `POLYGON_RPC` | Polygon RPC endpoint | `https://polygon-rpc.com` |
| `ARBITRUM_RPC` | Arbitrum RPC endpoint | `https://arb1.arbitrum.io/rpc` |
| `PORT` | Service port | `3000` |

**Note:** Default RPC endpoints work great for most users. Only change if you have premium RPC providers (Alchemy/Infura).

---

## Supported Chains & Tokens

| Chain | Chain ID | USDC | USDT | DAI | Settlement Speed |
|-------|----------|------|------|-----|------------------|
| Base | 8453 | ✅ | ❌ | ✅ | 2-5 seconds |
| Polygon | 137 | ✅ | ✅ | ✅ | 3-8 seconds |
| Arbitrum | 42161 | ✅ | ✅ | ✅ | 3-8 seconds |
| Ethereum | 1 | ✅ | ✅ | ✅ | 15-60 seconds |

---

## Testing

### Test 1: Health Check

```bash
curl https://your-service.onrender.com/health
```

Expected: `{"status": "healthy", ...}`

---

### Test 2: Owner Protection

```bash
# Test with WRONG API key (should fail)
curl -X POST https://your-service.onrender.com/sign-payment \
  -H "x-api-key: pk_live_WRONG_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "total_amount": "15000000",
    "token": "USDC",
    "chain": "base"
  }'
```

Expected: `403 Forbidden`

---

### Test 3: Successful Payment

```bash
# Test with CORRECT API key (should succeed with 2 TX)
curl -X POST https://your-service.onrender.com/sign-payment \
  -H "x-api-key: YOUR_CORRECT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "total_amount": "15000000",
    "token": "USDC",
    "chain": "base"
  }'
```

Expected: Two transaction hashes (commission + merchant)

---

### Test 4: Blockchain Verification

Visit block explorer to verify transactions:

**Commission Transaction:**
```bash
https://basescan.org/tx/TX_HASH_COMMISSION
```
Verify:
- Amount = 0.5% of total
- Recipient = AgentGatePay commission wallet

**Merchant Transaction:**
```bash
https://basescan.org/tx/TX_HASH
```
Verify:
- Amount = 99.5% of total
- Recipient = Merchant wallet address

---

## Troubleshooting

### Error: "Failed to load wallet private key"

**Cause:** Environment variable not set.

**Fix:**
1. Go to Render dashboard → Your service → Environment tab
2. Add environment variable:
   - Key: `WALLET_PRIVATE_KEY`
   - Value: Your wallet private key (`0x...`)
3. Save and wait for automatic redeploy

---

### Error: "Unauthorized" or "Forbidden"

**Cause:** Wrong API key or API key not configured.

**Fix:**
1. Verify `AGENTGATEPAY_API_KEY` is set correctly in environment
2. Test API key: `curl -H "x-api-key: YOUR_KEY" https://api.agentgatepay.com/v1/users/me`
3. Make sure you're using the same key in request header

---

### Error: "Failed to fetch commission config"

**Cause:** API key invalid or AgentGatePay API unreachable.

**Fix:**
1. Test API key validity: `curl -H "x-api-key: YOUR_KEY" https://api.agentgatepay.com/v1/users/me`
2. Check if AgentGatePay API is accessible
3. Verify `AGENTGATEPAY_API_KEY` env var is set

---

### Error: "Insufficient funds"

**Cause:** Wallet doesn't have enough USDC/USDT/DAI or native token for gas.

**Fix:**
1. Fund wallet with USDC (for transfers)
2. Fund wallet with native token for gas:
   - Base: ETH
   - Polygon: MATIC
   - Arbitrum: ETH
   - Ethereum: ETH
3. Check balance: `https://basescan.org/address/YOUR_WALLET`

---

## Security Best Practices

### 1. Use Secret Files (Render)

For maximum security, move environment variables to Secret Files:

**See:** [tx-signing-service/README.md#optional-use-secret-files-for-extra-security](tx-signing-service/README.md)

**Benefits:**
- ✅ Secrets not visible in environment listings
- ✅ Not exposed in logs
- ✅ Encrypted at rest

---

### 2. Restrict API Access

**Firewall Rules:**
- Only allow HTTPS traffic on port 443
- Block direct HTTP access
- Use Render/Railway's built-in DDoS protection

---

### 3. Monitor Wallet Balance

**Set up alerts:**
- Low balance warning (< $100 worth of tokens)
- Unexpected large transactions
- Gas price spikes

---

### 4. Rotate API Keys

**Recommended:** Rotate AgentGatePay API keys every 90 days

**How:**
1. Generate new API key via `/v1/api-keys/create`
2. Update `AGENTGATEPAY_API_KEY` environment variable
3. Revoke old API key via `/v1/api-keys/revoke`

---

## Architecture

### Tech Stack

- **Runtime:** Node.js 18+ (Alpine Linux in Docker)
- **Blockchain:** ethers.js v6
- **API:** Express.js
- **Deployment:** Render / Docker / Railway
- **Security:** API key verification, server-fetched config

---

### Service Size

- **Docker Image:** ~50MB (compressed)
- **Memory:** ~128MB (light usage)
- **CPU:** Minimal (only during signing)
- **Disk:** <100MB

---

## Cost Estimate

| Platform | Free Tier | Paid Tier | Best For |
|----------|-----------|-----------|----------|
| **Render** | 750 hours/month | $7/month | Quick start |
| **Railway** | $5 credit/month | $5-20/month | Developer-friendly |
| **Docker (AWS ECS)** | Free tier available | $10-30/month | Full control |
| **Docker (self-host)** | Free | Server costs only | Maximum control |

**Blockchain Gas Costs (separate):**
- Base: ~$0.001 per transaction
- Polygon: ~$0.01 per transaction
- Arbitrum: ~$0.05 per transaction
- Ethereum: ~$1-5 per transaction

---

## Documentation

### Quick Links

- **[Render Deployment Guide](tx-signing-service/README.md)** - One-click deploy with Secret Files
- **[Docker Deployment Guide](docker/README.md)** - Self-hosting with Kubernetes & ECS examples
- **[AgentGatePay Main Docs](https://github.com/AgentGatePay/agentgatepay)** - Complete platform documentation
- **[SDK Documentation](https://github.com/AgentGatePay/agentgatepay-sdks)** - Python & JavaScript SDKs
- **[Examples Repository](https://github.com/AgentGatePay/agentgatepay-examples)** - 20+ integration examples

---

## Use Cases

### 1. Production AI Agents

**Scenario:** LangChain agent needs to make autonomous payments

**Without TX Service:**
- Store wallet private key in environment variables (security risk)
- Expose keys to all client code
- Risk key leakage via logs or errors

**With TX Service:**
- Agent calls TX service API (no keys in client)
- Private keys isolated on secure server
- Simple API call replaces complex wallet management

---

### 2. Multi-Agent Systems

**Scenario:** 10 different agents need to make payments

**Without TX Service:**
- Each agent manages own wallet (complexity)
- 10 different wallets to fund and monitor
- Commission logic duplicated 10 times

**With TX Service:**
- Single TX service serves all 10 agents
- One wallet to fund and monitor
- Commission enforcement centralized

---

### 3. Third-Party Integrations

**Scenario:** External developers integrate with AgentGatePay

**Without TX Service:**
- Developers must handle wallet management
- Commission enforcement relies on client honesty
- Complex blockchain integration required

**With TX Service:**
- Simple REST API call
- Commission automatically enforced
- No blockchain expertise needed

---

## Version History

### v4.0.0 (Current) - Server-Fetched Config
- ✅ Commission config fetched from AgentGatePay
- ✅ Owner API key verification
- ✅ Automatic Secret Files detection (Render)
- ✅ Two-transaction atomic split
- ✅ Multi-chain support (4 chains, 3 tokens)

### v3.x - Environment Variable Config
- ❌ Deprecated - Commission could be modified by client

---

## Support

### Get Help

- **Documentation:** You're reading it!
- **Email Support:** support@agentgatepay.com
- **GitHub Issues:** [Report bugs or request features](mailto:support@agentgatepay.com)
- **Main Docs:** [AgentGatePay Documentation](https://github.com/AgentGatePay/agentgatepay)

---

## License

Copyright (c) 2025 AgentGatePay. All Rights Reserved.

See [LICENSE](LICENSE) for full terms.

---

**AgentGatePay TX Signing Service** - Secure blockchain transaction signing for autonomous AI agents.

**Current Version:** v4.0.0
**Security Model:** Server-controlled commission enforcement
**Bypass Protection:** Impossible ✅
