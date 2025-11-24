# Docker Deployment - AgentGatePay TX Signing Service

**Production-ready Docker image for autonomous AI agent payments**

## Quick Start

### Option 1: Pull from Docker Hub (Recommended)

```bash
# Pull the image
docker pull agentgatepay/tx-signing-service:latest

# Run with docker-compose
docker-compose up -d
```

### Option 2: Build Locally

```bash
# Clone the repository
git clone https://github.com/AgentGatePay/TX.git
cd TX

# Build the image (from repo root)
docker build -f docker/Dockerfile -t agentgatepay/tx-signing-service:latest .

# Run the container
docker run -d \
  --name agentpay-tx-signer \
  -p 3000:3000 \
  -e WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY \
  -e AGENTGATEPAY_API_KEY=pk_live_YOUR_API_KEY \
  agentgatepay/tx-signing-service:latest
```

## Using Docker Compose

1. **Copy the environment template:**
```bash
cp .env.example .env
```

2. **Edit .env with your credentials:**
```bash
WALLET_PRIVATE_KEY=0xYOUR_64_CHAR_PRIVATE_KEY
AGENTPAY_API_KEY=pk_live_YOUR_API_KEY_HERE
```

3. **Start the service:**
```bash
docker-compose up -d
```

4. **Check health:**
```bash
curl http://localhost:3000/health
```

5. **View logs:**
```bash
docker-compose logs -f
```

6. **Stop the service:**
```bash
docker-compose down
```

## Environment Variables

### Required

- `WALLET_PRIVATE_KEY` - Your wallet private key (format: `0x` + 64 hex chars)
- `AGENTGATEPAY_API_KEY` - Your AgentGatePay API key (format: `pk_live_...`)

### Optional (Custom RPC endpoints)

- `BASE_RPC` - Base network RPC (default: `https://mainnet.base.org`)
- `ETHEREUM_RPC` - Ethereum RPC (default: `https://cloudflare-eth.com`)
- `POLYGON_RPC` - Polygon RPC (default: `https://polygon-rpc.com`)
- `ARBITRUM_RPC` - Arbitrum RPC (default: `https://arb1.arbitrum.io/rpc`)
- `PORT` - Service port (default: `3000`)

## Security Features

✅ **Non-root user** - Container runs as user `agentpay` (UID 1001)
✅ **Multi-stage build** - Minimal production image
✅ **Health checks** - Automatic container restart on failure
✅ **Alpine Linux** - Small attack surface (~50MB image)
✅ **Owner protection** - Only your API key can access
✅ **Server-fetched config** - Commission controlled by AgentGatePay

## Health Check

The container includes automatic health monitoring:

```bash
# Check health status
docker inspect --format='{{json .State.Health}}' agentpay-tx-signer

# Expected response
{
  "Status": "healthy",
  "FailingStreak": 0,
  "Log": [...]
}
```

## Endpoints

### `GET /health`

Health check endpoint - no authentication required

```bash
curl http://localhost:3000/health
```

### `POST /sign-payment`

Sign payment with automatic commission enforcement

```bash
curl -X POST http://localhost:3000/sign-payment \
  -H "Content-Type: application/json" \
  -H "x-api-key: pk_live_YOUR_API_KEY" \
  -d '{
    "merchant_address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "total_amount": "15000000",
    "token": "USDC",
    "chain": "base"
  }'
```

**Response:**
```json
{
  "success": true,
  "tx_hash": "0xabc...",
  "tx_hash_commission": "0xdef...",
  "merchant_amount": "14925000",
  "commission_amount": "75000",
  "commission_rate": 0.005
}
```

## Troubleshooting

### Container won't start

**Check logs:**
```bash
docker logs agentpay-tx-signer
```

**Common issues:**
- Missing `WALLET_PRIVATE_KEY` or `AGENTPATEPAY_API_KEY`
- Invalid private key format (must be `0x` + 64 hex chars)
- Port 3000 already in use

### Health check failing

```bash
# Check if service is responding
curl http://localhost:3000/health

# Restart container
docker-compose restart
```

### Permission denied errors

The container runs as non-root user. Ensure mounted volumes have correct permissions:

```bash
chown -R 1001:1001 /path/to/mounted/volume
```

## Production Deployment

### Docker Swarm

```bash
docker stack deploy -c docker-compose.yml agentpay
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentpay-tx-signer
spec:
  replicas: 2
  selector:
    matchLabels:
      app: agentpay-tx-signer
  template:
    metadata:
      labels:
        app: agentpay-tx-signer
    spec:
      containers:
      - name: tx-signer
        image: agentgatepay/tx-signing-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: WALLET_PRIVATE_KEY
          valueFrom:
            secretKeyRef:
              name: agentpay-secrets
              key: wallet-private-key
        - name: AGENTGATEPAY_API_KEY
          valueFrom:
            secretKeyRef:
              name: agentpay-secrets
              key: api-key
```

### AWS ECS/Fargate

```bash
# Push to ECR
docker tag agentgatepay/tx-signing-service:latest YOUR_ECR_REPO/tx-signing-service:latest
docker push YOUR_ECR_REPO/tx-signing-service:latest

# Deploy via ECS console or CLI
```

## Building Custom Image

If you need to modify the service:

```bash
# Build with custom tag
docker build -f docker/Dockerfile -t my-custom-signer:v1 .

# Test locally
docker run -p 3000:3000 \
  -e WALLET_PRIVATE_KEY=0x... \
  -e AGENTGATEPAY_API_KEY=pk_live_... \
  my-custom-signer:v1
```

## Image Details

- **Base:** `node:18-alpine`
- **Size:** ~50MB (compressed)
- **Architecture:** linux/amd64, linux/arm64
- **Security:** Non-root user, minimal dependencies
- **Registry:** Docker Hub @ `agentgatepay/tx-signing-service`

## Support

- **GitHub Issues:** https://github.com/AgentGatePay/TX/issues
- **Documentation:** https://docs.agentgatepay.com
- **Email:** support@agentgatepay.com

## License

MIT License - See LICENSE file for details

---

**Built with ❤️ by AgentGatePay**
*Powering autonomous AI agent payments on blockchain*
