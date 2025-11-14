# AgentGatePay Transaction Signing Service

**Secure transaction signing service with mandatory commission enforcement**

## 🚀 One-Click Deploy

### Step 1: Sign Up for AgentGatePay

Get your API key:

```bash
curl -X POST https://api.agentgatepay.com/v1/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "SecurePass123",
    "user_type": "agent"
  }'
```

**Save your API key:** `pk_live_abc123...`

### Step 2: One-Click Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/AgentGatePay/AgentGatePay)

**When prompted, enter:**
1. **agentgatepay-api-key:** Paste your API key from Step 1 (`pk_live_...`)
2. **wallet-private-key:** Paste your wallet private key (`0x...`)

**That's it!** ✅ Both secrets are stored securely as Secret Files.

### Step 3: Test Deployment

```bash
# Test health check
curl https://YOUR-SERVICE.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "version": "4.0.0",
  "mode": "secure_server_fetched_config",
  "owner_protection": "enabled",
  "commission_config": "fetched_from_agentgatepay"
}
```

✅ **Done!** Your signing service is ready.

---

## 🔒 Security Features

### 1. Owner Authorization
Only YOUR AgentGatePay API key can access the signing service.

**Test:**
```bash
# Try with wrong API key (should fail)
curl -X POST https://YOUR-SERVICE.onrender.com/sign-payment \
  -H "x-api-key: pk_live_WRONG_KEY" \
  -d '{"merchant_address":"0x...","total_amount":"15000000","token":"USDC","chain":"base"}'

# Expected: 403 Forbidden
```

### 2. Server-Fetched Commission Config
Commission address and rate are fetched from AgentGatePay (not set by you).

**What this means:**
- ✅ You CANNOT set your own commission address
- ✅ You CANNOT set low commission rate
- ✅ AgentGatePay controls commission (0.5%)
- ✅ Commission is guaranteed on every payment

### 3. Secret Files for Private Key
Wallet private key stored as encrypted Secret File (not env var).

**Why this matters:**
- ✅ More secure than environment variables
- ✅ Not exposed in logs
- ✅ Follows Render security best practices

### 4. Hardcoded API URL
AgentGatePay API URL is hardcoded in the service code.

**What this prevents:**
- ❌ You CANNOT point to fake API
- ❌ You CANNOT bypass commission verification
- ❌ All config comes from official AgentGatePay API

---

## 📋 Environment Setup

### Required (1 variable):
- **`AGENTGATEPAY_API_KEY`** - Your AgentGatePay API key
  - Format: `pk_live_abc123...`
  - Get from: `POST /v1/users/signup`

### Required (1 secret file):
- **`wallet-private-key`** - Your wallet private key
  - Format: `0x` followed by 64 hex characters (66 total)
  - Location: `/etc/secrets/wallet-private-key`
  - Set via Render "Secret Files" UI

### Optional (RPC endpoints):
- `BASE_RPC` - Base RPC URL (default: `https://mainnet.base.org`)
- `ETHEREUM_RPC` - Ethereum RPC URL (default: `https://cloudflare-eth.com`)
- `POLYGON_RPC` - Polygon RPC URL (default: `https://polygon-rpc.com`)
- `ARBITRUM_RPC` - Arbitrum RPC URL (default: `https://arb1.arbitrum.io/rpc`)

---

## 🎯 API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "version": "4.0.0",
  "mode": "secure_server_fetched_config",
  "owner_protection": "enabled",
  "commission_config": "fetched_from_agentgatepay"
}
```

### `POST /sign-payment`
Sign payment with automatic two-transaction commission enforcement.

**Headers:**
- `x-api-key` - Your AgentGatePay API key (REQUIRED)
- `Content-Type: application/json`

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
  "tx_hash": "0xabc...",
  "tx_hash_commission": "0xdef...",
  "commission_address": "0xAGENTGATEPAY_WALLET",
  "commission_amount": "75000",
  "merchant_amount": "14925000",
  "commission_rate": 0.005,
  "commission_controlled_by": "agentgatepay"
}
```

**What happens:**
1. Service verifies your API key
2. Service fetches commission config from AgentGatePay
3. Service calculates split: commission (0.5%) + merchant (99.5%)
4. Service signs TWO transactions:
   - TX1: Commission → AgentGatePay wallet
   - TX2: Merchant → merchant address
5. Service returns BOTH transaction hashes

---

## 🧪 Testing

### Test 1: Owner Protection
```bash
# Test with WRONG API key (should fail)
curl -X POST https://YOUR-SERVICE.onrender.com/sign-payment \
  -H "x-api-key: pk_live_WRONG_KEY" \
  -d '{"merchant_address":"0x...","total_amount":"15000000","token":"USDC","chain":"base"}'

# Expected: 403 Forbidden
```

### Test 2: Commission Enforcement
```bash
# Test with CORRECT API key (should succeed with 2 TX)
curl -X POST https://YOUR-SERVICE.onrender.com/sign-payment \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "total_amount": "15000000",
    "token": "USDC",
    "chain": "base"
  }'

# Expected: Two TX hashes (commission + merchant)
```

### Test 3: Blockchain Verification
```bash
# Check commission transaction on blockchain
open https://basescan.org/tx/TX_HASH_COMMISSION

# Verify:
# - Amount = 0.5% of total
# - Recipient = AgentGatePay wallet

# Check merchant transaction on blockchain
open https://basescan.org/tx/TX_HASH

# Verify:
# - Amount = 99.5% of total
# - Recipient = merchant address
```

---

## 🐛 Troubleshooting

### Error: "Failed to load wallet private key"

**Cause:** Secret File not configured.

**Fix:**
1. Go to Render dashboard → Your service
2. Click "Secret Files"
3. Add file with:
   - Filename: `wallet-private-key`
   - Contents: Your wallet private key (`0x...`)
4. Save and wait for redeploy

### Error: "Unauthorized" or "Forbidden"

**Cause:** Wrong API key or API key not configured.

**Fix:**
1. Verify `AGENTGATEPAY_API_KEY` is set correctly
2. Test API key: `curl -H "x-api-key: YOUR_KEY" https://api.agentgatepay.com/v1/users/me`
3. Make sure you're using the same key in request header

### Error: "Failed to fetch commission config"

**Cause:** API key invalid or AgentGatePay API unreachable.

**Fix:**
1. Test API key validity: `curl -H "x-api-key: YOUR_KEY" https://api.agentgatepay.com/v1/users/me`
2. Check AgentGatePay API status
3. Verify `AGENTGATEPAY_API_KEY` env var is set

### Error: "Insufficient funds"

**Cause:** Wallet doesn't have enough USDC or ETH for gas.

**Fix:**
1. Fund wallet with USDC (for transfers)
2. Fund wallet with ETH (for gas fees on Ethereum) or native token on other chains
3. Check balance: `https://basescan.org/address/YOUR_WALLET`

---

## 📚 Documentation

- **Full Guide:** [SECURE_RENDER_DEPLOYMENT_GUIDE.md](../SECURE_RENDER_DEPLOYMENT_GUIDE.md)
- **Implementation Summary:** [TWO_TRANSACTION_IMPLEMENTATION_SUMMARY.md](../TWO_TRANSACTION_IMPLEMENTATION_SUMMARY.md)
- **Comparison:** [COMMISSION_ENFORCEMENT_COMPARISON.md](../COMMISSION_ENFORCEMENT_COMPARISON.md)
- **Index:** [TWO_TRANSACTION_INDEX.md](../TWO_TRANSACTION_INDEX.md)
- **Secret Files Update:** [RENDER_V4_SECRET_FILES_UPDATE.md](../RENDER_V4_SECRET_FILES_UPDATE.md)

---

## 🎉 Summary

**What You Set:**
- ✅ 1 environment variable (`AGENTGATEPAY_API_KEY`)
- ✅ 1 secret file (`wallet-private-key`)

**What AgentGatePay Controls:**
- ✅ Commission address (AgentGatePay wallet)
- ✅ Commission rate (0.5%)
- ✅ API URL (hardcoded)

**Security:**
- ✅ Only YOUR API key can access
- ✅ Commission is MANDATORY (cannot bypass)
- ✅ Server-side enforcement (client cannot modify)
- ✅ Private key stored securely (Secret Files)

**Deployment Time:** 5 minutes
**Security Level:** 🔒 MAXIMUM

---

**Built with AgentGatePay v4.0** 🚀
**Commission Enforcement: SERVER-CONTROLLED**
**Bypass Protection: IMPOSSIBLE**
