# HackJudge AI 🤖⚖️

HackJudge AI is a fully automated, decentralized hackathon project evaluation platform built on the **Somnia L1 Testnet** (Chain ID: `50312`). 

The application utilizes autonomous on-chain agents to eliminate bias, scale evaluation, and provide immediate, transparent scorecards for hackathon submissions.

---

## 🚀 Key Features

* **MetaMask Integration**: Connects directly to Somnia Testnet for secure, developer-owned transactions.
* **Stage 1 (Codebase Parser)**: Analyzes submitted GitHub repositories (fetching theme and details) on-chain using the `HackJudgeAgent` contract.
* **Stage 2 (AI Consensus Scoring)**: Calls the `HackJudgeLLM` contract panel to rate the project across 4 core dimensions:
  1. *Theme Relevance*
  2. *Innovation*
  3. *Technical Complexity*
  4. *Real-World Impact*
* **On-Chain Leaderboard**: Records and ranks all completed evaluations dynamically using verified on-chain transactions.
* **Premium Cyberpunk Design**: Sleek obsidian dark-theme with cyberCyan glowing elements, stepper flow trackers, and real-time terminal emulator animations.

---

## ⛓ Deployed Smart Contracts (Somnia Testnet)

The frontend interacts with the following contracts:

| Contract | Purpose | Address |
| --- | --- | --- |
| **HackJudgeAgent** | Stage 1: Parser Agent | `0x740F96d0fcE396D65BfB02Fe0c877A5fbaB8CB19` |
| **HackJudgeLLM** | Stage 2: Scorer / Rating Agent | `0x3A25f6D5E9Cb27dDC6Fdd5b78583A589BEb716F2` |

---

## 🛠 Tech Stack

* **Frontend Framework**: React 19 + TypeScript + Vite
* **Styling**: Tailwind CSS (obsidian-dark custom theme)
* **Web3 Integration**: Ethers.js (v6) + BrowserProvider (MetaMask)
* **Icons**: Lucide React

---

## 💻 Running Locally

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure MetaMask for Somnia Testnet

Use the following parameters to add the network:
* **Network Name**: `Somnia Testnet`
* **RPC URL**: `https://dream-rpc.somnia.network`
* **Chain ID**: `50312` (Hex: `0xC488`)
* **Currency Symbol**: `STT`
* **Block Explorer**: `https://shannon-explorer.somnia.network`

### 3. Start Development Server

```bash
npm run dev
```

The application will run on `http://localhost:5173`.

### 4. Build for Production

```bash
npm run build
```
This builds the optimized production bundle under `/dist` using `tsc` type compilation and Vite.
