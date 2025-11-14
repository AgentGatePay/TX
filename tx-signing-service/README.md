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
1. **AGENTGATEPAY_API_KEY:** Paste your API key from Step 1 (`pk_live_...`)
2. **WALLET_PRIVATE_KEY:** Paste your wallet private key (`0x...`)

**That's it!** ✅ Both secrets are stored as environment variables (encrypted at rest).

**Want extra security?** See [Optional: Use Secret Files](#optional-use-secret-files-for-extra-security) below.

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

## 🔐 Optional: Use Secret Files for Extra Security

**Default:** Your secrets are stored as environment variables (encrypted at rest, secure for 99% of users).

**Want maximum security?** You can optionally move your secrets to Secret Files after deployment.

### Why Secret Files?

**Environment Variables (Default):**
- ✅ Encrypted at rest
- ✅ Redacted in logs
- ✅ Secure for most use cases
- ⚠️ Visible in environment listings (admin only)

**Secret Files (Optional upgrade):**
- ✅ Encrypted at rest
- ✅ Not in logs
- ✅ Not visible in environment listings
- ✅ Maximum security

### How to Move to Secret Files

**Step 1: Add Secret Files in Render Dashboard**

1. Go to your service in Render dashboard
2. Click **"Secret Files"** in the left sidebar
3. Click **"Add Secret File"**

4. **First Secret File:**
   - **Filename:** `agentgatepay-api-key`
   - **Contents:** Your API key (e.g., `pk_live_abc123...`)
   - Click **"Save"**

5. **Second Secret File:**
   - Click **"Add Secret File"** again
   - **Filename:** `wallet-private-key`
   - **Contents:** Your wallet private key (e.g., `0xabcd1234...`)
   - Click **"Save"**

**Step 2: Delete Environment Variables**

1. Go to **"Environment"** tab
2. Delete `AGENTGATEPAY_API_KEY`
3. Delete `WALLET_PRIVATE_KEY`
4. Click **"Save Changes"**

**Step 3: Redeploy**

Service will automatically redeploy and read from Secret Files instead.

**Verify in logs:**
```
✅ AgentGatePay API key loaded from Secret File
✅ Wallet private key loaded from Secret File
```

**Done!** ✅ Your secrets are now stored as Secret Files (maximum security).

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

## 📋 Configuration

### Required (Set during one-click deploy):

**Environment Variables:**
- **`AGENTGATEPAY_API_KEY`** - Your AgentGatePay API key
  - Format: `pk_live_abc123...`
  - Get from: `https://api.agentgatepay.com/v1/users/signup`
  - Set during deployment or in Render "Environment" tab

- **`WALLET_PRIVATE_KEY`** - Your wallet private key
  - Format: `0x` followed by 64 hex characters (66 total)
  - Set during deployment or in Render "Environment" tab

**OR (Optional - for extra security):**

**Secret Files:**
- **`agentgatepay-api-key`** - Your AgentGatePay API key
  - Location: `/etc/secrets/agentgatepay-api-key`
  - Set via Render "Secret Files" UI

- **`wallet-private-key`** - Your wallet private key
  - Location: `/etc/secrets/wallet-private-key`
  - Set via Render "Secret Files" UI

**Note:** Service automatically detects which method you're using (environment variables or Secret Files).

### Optional (Advanced - RPC endpoints):
- `BASE_RPC` - Base RPC URL (default: `https://mainnet.base.org`)
- `ETHEREUM_RPC` - Ethereum RPC URL (default: `https://cloudflare-eth.com`)
- `POLYGON_RPC` - Polygon RPC URL (default: `https://polygon-rpc.com`)
- `ARBITRUM_RPC` - Arbitrum RPC URL (default: `https://arb1.arbitrum.io/rpc`)

**Default RPCs work great for most users. Only change if you have custom requirements.**

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

**Cause:** Environment variable not set.

**Fix:**
1. Go to Render dashboard → Your service
2. Click **"Environment"** tab
3. Add environment variable:
   - **Key:** `WALLET_PRIVATE_KEY`
   - **Value:** Your wallet private key (`0x...`)
4. Click **"Save Changes"** and wait for redeploy

**OR use Secret File (extra security):**
1. Go to Render dashboard → Your service
2. Click **"Secret Files"** tab
3. Add Secret File:
   - **Filename:** `wallet-private-key`
   - **Contents:** Your wallet private key (`0x...`)
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

**What You Set (during one-click deploy):**
- ✅ `AGENTGATEPAY_API_KEY` (environment variable)
- ✅ `WALLET_PRIVATE_KEY` (environment variable)
- 🔐 Optional: Move to Secret Files for extra security (see above)

**What AgentGatePay Controls:**
- ✅ Commission address (AgentGatePay wallet)
- ✅ Commission rate (0.5%)
- ✅ API URL (hardcoded)

**Security:**
- ✅ Only YOUR API key can access
- ✅ Commission is MANDATORY (cannot bypass)
- ✅ Server-side enforcement (client cannot modify)
- ✅ Secrets encrypted at rest (environment variables or Secret Files)
- ✅ Automatic detection of storage method

**Deployment Time:** 3 minutes
**Security Level:** 🔒 HIGH (🔒 MAXIMUM with Secret Files)

---

**Built with AgentGatePay v4.0** 🚀
**Commission Enforcement: SERVER-CONTROLLED**
**Bypass Protection: IMPOSSIBLE**
