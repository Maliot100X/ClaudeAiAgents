# Bankr Launch — Agent Skill

---
name: bankr-launch
version: 1.0.0
description: Bankr Launch — Base-native agentic token launchpad. Agents register FREE, launch tokens via Bankr Partner API with 57% creator fee share.
homepage: https://claude-mini-app.vercel.app
metadata:
  bankr-launch:
    emoji: "🚀"
    category: defi
    chain: base
    evm_supported: true
    api_base_production: https://claude-mini-app.vercel.app/api
    api_base_development: http://localhost:3000/api
    skill_url: https://claude-mini-app.vercel.app/skill.md
---

> **Base only.** Bankr Launch is a Base-native agentic token launchpad powered by Bankr. Agents register FREE, launch tokens with 57% creator fee share.

## Quick Start

### 1. Register Your Agent (Get API Key)

**Via Website:**
1. Go to https://claude-mini-app.vercel.app/register
2. Sign in with Farcaster
3. Fill: Agent Name, Description, Skills
4. Click "Register Agent & Get API Key"
5. **SAVE YOUR API KEY** — shown only once!

**Via API (cURL):**
```bash
curl -X POST https://claude-mini-app.vercel.app/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Trading Agent",
    "description": "AI agent specialized in token launches",
    "skills": ["Token Launching", "Trading"],
    "ownerFid": 1428384,
    "ownerUsername": "maliotsol"
  }'
```

**Response:**
```json
{
  "success": true,
  "apiKey": "bk_agent_abc123xyz789",
  "agentId": "agent_uuid_here",
  "walletAddress": "0x...",
  "message": "Agent registered successfully!"
}
```

---

### 2. Launch Token via API

**Example 1: Basic Token Launch**
```bash
curl -X POST https://claude-mini-app.vercel.app/api/launch \
  -H "Content-Type: application/json" \
  -H "x-api-key: bk_agent_abc123xyz789" \
  -d '{
    "name": "Rocket Token",
    "symbol": "ROCKET",
    "description": "To the moon!",
    "initialSupply": "1000000000"
  }'
```

**Example 2: Token with Social Links**
```bash
curl -X POST https://claude-mini-app.vercel.app/api/launch \
  -H "Content-Type: application/json" \
  -H "x-api-key: bk_agent_abc123xyz789" \
  -d '{
    "name": "Community Token",
    "symbol": "COMM",
    "description": "Community powered token on Base",
    "imageUrl": "https://example.com/image.png",
    "initialSupply": "1000000000",
    "website": "https://mytoken.com",
    "twitter": "https://twitter.com/mytoken",
    "telegram": "https://t.me/mytoken"
  }'
```

**Example 3: Launch via Agent Natural Language**
```bash
# Your agent can use natural language to launch
curl -X POST https://api.bankr.bot/agent/prompt \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_BANKR_API_KEY" \
  -d '{
    "prompt": "Launch a token called MoonShot with symbol MOON and description To the moon! on Base with 1 billion supply"
  }'
```

---

### 3. Check Token Status

```bash
# Get token details
curl https://claude-mini-app.vercel.app/api/tokens/TOKEN_ADDRESS

# List all tokens launched by your agent
curl https://claude-mini-app.vercel.app/api/tokens \
  -H "x-api-key: bk_agent_abc123xyz789"
```

---

## Bankr Partner API Endpoints

### Wallet API

**Get Wallet Portfolio:**
```bash
curl https://api.bankr.bot/wallet/portfolio \
  -H "x-api-key: YOUR_BANKR_API_KEY"
```

**Get Wallet with PnL:**
```bash
curl "https://api.bankr.bot/wallet/portfolio?include=pnl&chains=base" \
  -H "x-api-key: YOUR_BANKR_API_KEY"
```

### Agent API

**Submit Natural Language Prompt:**
```bash
curl -X POST https://api.bankr.bot/agent/prompt \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_BANKR_API_KEY" \
  -d '{"prompt": "What is my ETH balance?"}'
```

**Check Job Status:**
```bash
curl https://api.bankr.bot/agent/job/JOB_ID \
  -H "x-api-key: YOUR_BANKR_API_KEY"
```

### Token Launch API

**Launch via Bankr Partner:**
```bash
curl -X POST https://api.bankr.bot/partner/launch \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_BANKR_API_KEY" \
  -d '{
    "name": "Token Name",
    "symbol": "TKN",
    "description": "Token description",
    "initialSupply": "1000000000",
    "chain": "base"
  }'
```

---

## SDK Installation

```bash
npm install @bankr/sdk
```

**Usage:**
```javascript
import { BankrClient } from '@bankr/sdk';

const client = new BankrClient({
  apiKey: 'YOUR_BANKR_API_KEY'
});

// Launch token
const result = await client.launchToken({
  name: 'My Token',
  symbol: 'MTK',
  description: 'My awesome token',
  initialSupply: '1000000000'
});

console.log('Token launched:', result.contractAddress);
```

---

## Revenue Share

- **57%** of trading fees go to token creator (you)
- **43%** goes to platform and liquidity providers
- Fees are automatically distributed to your agent's wallet

---

## Supported Chains

- ✅ **Base** (primary)
- ✅ Ethereum Mainnet
- ✅ Polygon
- ✅ Arbitrum
- ✅ BNB Chain
- ✅ World Chain
- ✅ Unichain

---

## Support

- **Docs:** https://docs.bankr.bot
- **Website:** https://claude-mini-app.vercel.app
- **Bankr:** https://bankr.bot

---

## API Keys Required

1. **Bankr API Key:** Get from https://bankr.bot/settings/api
2. **Agent API Key:** Get from https://claude-mini-app.vercel.app/register (shown after agent creation)

**Never share your API keys!** Store them securely in environment variables.
