/**
 * AgentGatePay Transaction Signing Service
 * WITH GATEWAY PAYMENT ROUTER FOR MANDATORY COMMISSION
 *
 * NEW: Includes automatic commission collection (0.5%)
 */

const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Configuration from environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// 💰 NEW: Gateway configuration for commission collection
const GATEWAY_WALLET = process.env.GATEWAY_WALLET;
const GATEWAY_PRIVATE_KEY = process.env.GATEWAY_PRIVATE_KEY;
const COMMISSION_WALLET = process.env.COMMISSION_WALLET;
const COMMISSION_RATE = 0.005; // 0.5%

// Token configurations
const TOKENS = {
    'USDC': {
        decimals: 6,
        contracts: {
            base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
            ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            polygon: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
            arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
        }
    },
    'USDT': {
        decimals: 6,
        contracts: {
            ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
        }
    },
    'DAI': {
        decimals: 18,
        contracts: {
            base: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
            ethereum: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
            polygon: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
            arbitrum: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
        }
    }
};

// RPC endpoints
const RPCS = {
    base: process.env.BASE_RPC || 'https://mainnet.base.org',
    ethereum: process.env.ETHEREUM_RPC || 'https://cloudflare-eth.com',
    polygon: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
    arbitrum: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc'
};

// Block explorers
const EXPLORERS = {
    base: 'https://basescan.org',
    ethereum: 'https://etherscan.io',
    polygon: 'https://polygonscan.com',
    arbitrum: 'https://arbiscan.io'
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'AgentGatePay Transaction Signing Service',
        version: '1.1.0',
        configured: !!PRIVATE_KEY,
        gateway_configured: !!GATEWAY_PRIVATE_KEY,
        supported_chains: Object.keys(RPCS),
        supported_tokens: Object.keys(TOKENS)
    });
});

// 💰 NEW: Gateway health check
app.get('/gateway/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Gateway Payment Router',
        version: '1.0.0',
        config: {
            commission_rate: `${COMMISSION_RATE * 100}%`,
            commission_wallet: COMMISSION_WALLET || 'NOT_SET',
            gateway_wallet: GATEWAY_WALLET || 'NOT_SET',
            gateway_configured: !!GATEWAY_PRIVATE_KEY,
            supported_chains: Object.keys(RPCS),
            supported_tokens: Object.keys(TOKENS)
        }
    });
});

// Wallet info endpoint
app.get('/wallet', (req, res) => {
    if (!PRIVATE_KEY) {
        return res.status(500).json({
            error: 'PRIVATE_KEY not configured'
        });
    }

    try {
        const wallet = new ethers.Wallet(PRIVATE_KEY);
        res.json({
            address: wallet.address,
            message: 'Wallet configured successfully'
        });
    } catch (error) {
        res.status(500).json({
            error: 'Invalid PRIVATE_KEY',
            message: error.message
        });
    }
});

// Main signing endpoint (UNCHANGED - for buyer payments)
app.post('/sign-and-send', async (req, res) => {
    try {
        if (!PRIVATE_KEY) {
            return res.status(500).json({
                error: 'Service not configured',
                message: 'PRIVATE_KEY environment variable not set'
            });
        }

        if (AUTH_TOKEN) {
            const providedToken = req.headers.authorization?.replace('Bearer ', '');
            if (providedToken !== AUTH_TOKEN) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
        }

        const { to, amount, token, chain } = req.body;

        if (!to || !amount || !token || !chain) {
            return res.status(400).json({
                error: 'Missing required parameters',
                required: ['to', 'amount', 'token', 'chain']
            });
        }

        if (!RPCS[chain]) {
            return res.status(400).json({
                error: `Unsupported chain: ${chain}`,
                supported: Object.keys(RPCS)
            });
        }

        if (!TOKENS[token]) {
            return res.status(400).json({
                error: `Unsupported token: ${token}`,
                supported: Object.keys(TOKENS)
            });
        }

        const tokenAddress = TOKENS[token].contracts[chain];
        if (!tokenAddress) {
            return res.status(400).json({
                error: `${token} not supported on ${chain}`
            });
        }

        const amountInt = parseInt(amount);
        if (isNaN(amountInt) || amountInt <= 0) {
            return res.status(400).json({
                error: 'Invalid amount'
            });
        }

        const provider = new ethers.JsonRpcProvider(RPCS[chain]);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        console.log(`[${new Date().toISOString()}] Signing transaction:`);
        console.log(`  From: ${wallet.address}`);
        console.log(`  To: ${to}`);
        console.log(`  Amount: ${amount} (${token})`);
        console.log(`  Chain: ${chain}`);

        const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)'];
        const contract = new ethers.Contract(tokenAddress, erc20Abi, wallet);

        const tx = await contract.transfer(to, amountInt);
        console.log(`  TX Hash: ${tx.hash}`);

        const receipt = await tx.wait(1, 60000);

        console.log(`  Block: ${receipt.blockNumber}`);
        console.log(`  Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);

        return res.json({
            success: true,
            txHash: tx.hash,
            from: wallet.address,
            to: to,
            amount: amount,
            token: token,
            chain: chain,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            explorerUrl: `${EXPLORERS[chain]}/tx/${tx.hash}`
        });

    } catch (error) {
        console.error(`Error:`, error.message);

        if (error.code === 'INSUFFICIENT_FUNDS') {
            return res.status(400).json({
                error: 'Insufficient funds',
                message: 'Wallet does not have enough tokens or ETH for gas'
            });
        }

        return res.status(500).json({
            error: 'Transaction failed',
            message: error.message
        });
    }
});

// 💰 NEW: Gateway Payment Router
app.post('/gateway-route-payment', async (req, res) => {
    try {
        console.log('💰 Gateway Payment Router - Processing...');

        const { tx_hash, seller_wallet, chain } = req.body;

        if (!tx_hash || !seller_wallet || !chain) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['tx_hash', 'seller_wallet', 'chain']
            });
        }

        if (!GATEWAY_PRIVATE_KEY) {
            return res.status(500).json({
                error: 'Gateway not configured',
                message: 'GATEWAY_PRIVATE_KEY not set'
            });
        }

        if (!COMMISSION_WALLET) {
            return res.status(500).json({
                error: 'Commission wallet not configured',
                message: 'COMMISSION_WALLET not set'
            });
        }

        console.log(`TX: ${tx_hash}`);
        console.log(`Seller: ${seller_wallet}`);
        console.log(`Chain: ${chain}`);

        // 1. Verify payment to gateway
        const provider = new ethers.JsonRpcProvider(RPCS[chain]);
        const receipt = await provider.getTransactionReceipt(tx_hash);

        if (!receipt) {
            return res.status(400).json({
                error: 'Transaction not found',
                message: 'Transaction not confirmed yet or invalid tx_hash'
            });
        }

        // Find Transfer event
        const transferLog = receipt.logs.find(log =>
            log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
        );

        if (!transferLog) {
            return res.status(400).json({
                error: 'No token transfer found'
            });
        }

        // Parse transfer details
        const to = '0x' + transferLog.topics[2].slice(26);
        const amount = ethers.getBigInt(transferLog.data).toString();

        // Verify sent to gateway
        if (to.toLowerCase() !== GATEWAY_WALLET.toLowerCase()) {
            return res.status(400).json({
                error: 'Payment not sent to gateway',
                expected: GATEWAY_WALLET,
                received: to
            });
        }

        // Get token
        const tokenAddress = transferLog.address;
        let tokenSymbol = 'UNKNOWN';
        for (const [symbol, config] of Object.entries(TOKENS)) {
            if (config.contracts[chain]?.toLowerCase() === tokenAddress.toLowerCase()) {
                tokenSymbol = symbol;
                break;
            }
        }

        console.log(`✅ Payment verified: ${amount} ${tokenSymbol} to gateway`);

        // 2. Calculate split
        const totalAmount = BigInt(amount);
        const commissionAmount = (totalAmount * BigInt(Math.floor(COMMISSION_RATE * 10000))) / BigInt(10000);
        const sellerAmount = totalAmount - commissionAmount;

        console.log(`Split: Commission=${commissionAmount}, Seller=${sellerAmount}`);

        // 3. Send commission
        const gatewayWallet = new ethers.Wallet(GATEWAY_PRIVATE_KEY, provider);
        const erc20Abi = ['function transfer(address to, uint256 amount) returns (bool)'];
        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, gatewayWallet);

        console.log('Sending commission...');
        const commissionTx = await tokenContract.transfer(COMMISSION_WALLET, commissionAmount);
        const commissionReceipt = await commissionTx.wait();
        console.log(`✅ Commission: ${commissionTx.hash}`);

        // 4. Send seller payment
        console.log('Sending seller payment...');
        const sellerTx = await tokenContract.transfer(seller_wallet, sellerAmount);
        const sellerReceipt = await sellerTx.wait();
        console.log(`✅ Seller: ${sellerTx.hash}`);

        // Return success
        res.json({
            success: true,
            message: 'Payment routed successfully',
            original_payment: {
                tx_hash: tx_hash,
                amount: amount,
                explorer_url: `${EXPLORERS[chain]}/tx/${tx_hash}`
            },
            commission: {
                amount: commissionAmount.toString(),
                percentage: '0.5%',
                tx_hash: commissionTx.hash,
                wallet: COMMISSION_WALLET,
                explorer_url: `${EXPLORERS[chain]}/tx/${commissionTx.hash}`,
                status: 'collected'
            },
            seller_payment: {
                amount: sellerAmount.toString(),
                percentage: '99.5%',
                tx_hash: sellerTx.hash,
                wallet: seller_wallet,
                explorer_url: `${EXPLORERS[chain]}/tx/${sellerTx.hash}`,
                status: 'paid'
            },
            summary: {
                total_received: amount,
                commission_collected: commissionAmount.toString(),
                seller_paid: sellerAmount.toString(),
                token: tokenSymbol,
                chain: chain
            }
        });

    } catch (error) {
        console.error('❌ Gateway routing error:', error);
        res.status(500).json({
            error: 'Gateway routing failed',
            message: error.message
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        endpoints: {
            'POST /sign-and-send': 'Sign transaction',
            'POST /gateway-route-payment': 'Route payment with commission',
            'GET /health': 'Health check',
            'GET /gateway/health': 'Gateway health'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║  AgentGatePay Transaction Signing Service v1.1.0          ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  Status: RUNNING                                           ║`);
    console.log(`║  Port: ${PORT.toString().padEnd(52)}║`);
    console.log(`║  Private Key: ${(PRIVATE_KEY ? 'Configured ✅' : 'NOT CONFIGURED ⚠️').padEnd(47)}║`);
    console.log(`║  Gateway Key: ${(GATEWAY_PRIVATE_KEY ? 'Configured ✅' : 'NOT CONFIGURED ⚠️').padEnd(47)}║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  Endpoints:                                                ║`);
    console.log(`║    GET  /health                  - Health check            ║`);
    console.log(`║    GET  /gateway/health          - Gateway health          ║`);
    console.log(`║    POST /sign-and-send           - Sign transaction        ║`);
    console.log(`║    POST /gateway-route-payment   - Route with commission   ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  💰 Gateway Configuration:                                 ║`);
    console.log(`║    Commission Rate: 0.5%                                   ║`);
    console.log(`║    Commission Wallet: ${(COMMISSION_WALLET || 'NOT SET').substring(0, 35).padEnd(35)}║`);
    console.log(`║    Gateway Wallet: ${(GATEWAY_WALLET || 'NOT SET').substring(0, 38).padEnd(38)}║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    console.log(`║  Chains: Ethereum, Base, Polygon, Arbitrum                 ║`);
    console.log(`║  Tokens: USDC, USDT, DAI                                   ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝\n`);

    if (!PRIVATE_KEY) {
        console.log(`⚠️  WARNING: PRIVATE_KEY not set!`);
    }
    if (!GATEWAY_PRIVATE_KEY) {
        console.log(`⚠️  WARNING: GATEWAY_PRIVATE_KEY not set! Gateway routing will not work.`);
    }
    if (!COMMISSION_WALLET) {
        console.log(`⚠️  WARNING: COMMISSION_WALLET not set!`);
    }
});
