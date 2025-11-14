# 🚀 Quick Deploy - 2 Steps Only!

## Step 1: Get Your API Key

```bash
curl -X POST https://api.agentgatepay.com/v1/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "SecurePass123",
    "user_type": "agent"
  }'
```

**Save:** `pk_live_abc123...`

---

## Step 2: Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/AgentGatePay/AgentGatePay)

**When prompted, paste:**
1. **agentgatepay-api-key:** `pk_live_abc123...`
2. **wallet-private-key:** `0xabcd1234...`

**Done!** ✅

---

## Test Your Deployment

```bash
curl https://YOUR-SERVICE.onrender.com/health
```

**Expected:**
```json
{
  "status": "healthy",
  "owner_protection": "enabled",
  "commission_config": "fetched_from_agentgatepay"
}
```

✅ **Working!**

---

## Security Features

✅ **Both secrets stored as Secret Files** (encrypted, not in logs)
✅ **Owner-only access** (your API key required)
✅ **Commission enforced** (0.5%, fetched from AgentGatePay)
✅ **Cannot bypass** (server-controlled, hardcoded API URL)

---

**Questions?** See [README.md](README.md) for full documentation.
