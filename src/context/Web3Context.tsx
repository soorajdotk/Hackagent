import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { parseLLMResult } from '../utils/mockData';

// Constants
export const SOMNIA_CHAIN_ID = 50312;
export const SOMNIA_CHAIN_ID_HEX = '0xC488'; // 50312 in hex
export const SOMNIA_RPC_URL = 'https://dream-rpc.somnia.network';
export const SOMNIA_EXPLORER_URL = 'https://shannon-explorer.somnia.network';
export const PARSER_AGENT_ADDRESS = '0x740F96d0fcE396D65BfB02Fe0c877A5fbaB8CB19';
export const LLM_JUDGE_ADDRESS = '0x3A25f6D5E9Cb27dDC6Fdd5b78583A589BEb716F2';

// Human readable ABIs matching the deployed contracts
const PARSER_ABI = [
  "function submitProject(string theme, string githubUrl) external payable returns (uint256)",
  "function getAnalysis(uint256 requestId) external view returns (string memory result, bool completed)",
  "function getRequiredDeposit() external view returns (uint256)",
  "function pendingRequests(uint256) external view returns (bool)",
  "function submissions(uint256) external view returns (string theme, string githubUrl, string analysis, bool completed)",
  "event AnalysisRequested(uint256 indexed requestId)",
  "event AnalysisCompleted(uint256 indexed requestId, string result)"
];

const LLM_ABI = [
  "function analyzeProject(string theme, string projectAnalysis) external payable returns (uint256)",
  "function getScore(uint256 requestId) external view returns (string memory result, bool completed)",
  "function getRequiredDeposit() external view returns (uint256)",
  "function pendingRequests(uint256) external view returns (bool)",
  "function scores(uint256) external view returns (string result, bool completed)",
  "event EvaluationRequested(uint256 indexed requestId)",
  "event EvaluationCompleted(uint256 indexed requestId, string result)"
];

interface Web3ContextType {
  // Wallet State
  account: string | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  switchNetwork: () => Promise<void>;

  // Deposits
  parserDeposit: string;
  llmDeposit: string;

  // Parser Actions
  submitProject: (theme: string, githubUrl: string) => Promise<{ requestId: string; txHash: string }>;
  getAnalysis: (requestId: any) => Promise<{ theme: string; analysis: string; completed: boolean }>;

  // LLM Actions
  analyzeProject: (theme: string, analysis: string) => Promise<{ requestId: string; txHash: string }>;
  getScore: (requestId: any) => Promise<{ score: string; completed: boolean }>;

  // Leaderboard persistence
  addToLeaderboard: (item: LeaderboardItem) => void;
  getLeaderboard: () => LeaderboardItem[];
}

export interface LeaderboardItem {
  id: string;
  projectName: string;
  theme: string;
  githubUrl: string;
  overallScore: number;
  verdict: string;
  timestamp: number;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Wallet Connection
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Deposits (STT)
  const [parserDeposit, setParserDeposit] = useState<string>("0.1");
  const [llmDeposit, setLlmDeposit] = useState<string>("0.1");

  const isCorrectNetwork = chainId === SOMNIA_CHAIN_ID;

  // Detect metamask events
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const eth = (window as any).ethereum;

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      };

      const handleChainChanged = (chainHex: string) => {
        setChainId(parseInt(chainHex, 16));
      };

      // Get initial details
      eth.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) setAccount(accounts[0]);
      });

      eth.request({ method: 'eth_chainId' }).then((chainHex: string) => {
        setChainId(parseInt(chainHex, 16));
      });

      eth.on('accountsChanged', handleAccountsChanged);
      eth.on('chainChanged', handleChainChanged);

      return () => {
        eth.removeListener('accountsChanged', handleAccountsChanged);
        eth.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // Fetch deposits dynamically if on Somnia network
  useEffect(() => {
    const fetchDeposits = async () => {
      if (isCorrectNetwork && (window as any).ethereum) {
        try {
          const provider = new ethers.BrowserProvider((window as any).ethereum);

          const parserContract = new ethers.Contract(PARSER_AGENT_ADDRESS, PARSER_ABI, provider);
          const pDep = await parserContract.getRequiredDeposit();
          setParserDeposit(ethers.formatEther(pDep));

          const llmContract = new ethers.Contract(LLM_JUDGE_ADDRESS, LLM_ABI, provider);
          const lDep = await llmContract.getRequiredDeposit();
          setLlmDeposit(ethers.formatEther(lDep));
        } catch (e) {
          console.error("Error fetching deposits from contracts: ", e);
        }
      }
    };
    fetchDeposits();
  }, [isCorrectNetwork, account]);

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert("Please install MetaMask to connect to Somnia Testnet.");
      return;
    }
    setIsConnecting(true);
    try {
      const eth = (window as any).ethereum;
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);

      const chainHex = await eth.request({ method: 'eth_chainId' });
      setChainId(parseInt(chainHex, 16));
    } catch (e) {
      console.error("Wallet connection failed", e);
    } finally {
      setIsConnecting(false);
    }
  };

  const switchNetwork = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    const eth = (window as any).ethereum;
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SOMNIA_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: SOMNIA_CHAIN_ID_HEX,
                chainName: 'Somnia Testnet',
                nativeCurrency: {
                  name: 'Somnia Test Token',
                  symbol: 'STT',
                  decimals: 18,
                },
                rpcUrls: [SOMNIA_RPC_URL],
                blockExplorerUrls: [SOMNIA_EXPLORER_URL],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add network", addError);
        }
      } else {
        console.error("Failed to switch network", switchError);
      }
    }
  };

  const submitProject = async (theme: string, githubUrl: string): Promise<{ requestId: string; txHash: string }> => {
    if (!account) throw new Error("Wallet not connected");
    if (!isCorrectNetwork) throw new Error("Incorrect network. Please switch to Somnia Testnet.");

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(PARSER_AGENT_ADDRESS, PARSER_ABI, signer);

    const depositWei = ethers.parseEther(parserDeposit);
    const tx = await contract.submitProject(theme, githubUrl, { value: depositWei });
    const receipt = await tx.wait();

    if (!receipt) throw new Error("Transaction failed (no receipt returned).");

    let requestId = "0";

    // 1. Try parsing logs with the contract's defined events
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === PARSER_AGENT_ADDRESS.toLowerCase()) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.args && parsedLog.args.requestId) {
            requestId = parsedLog.args.requestId.toString();
            break;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    // 2. Fallback: Parse the first topic of logs emitted by this contract as a BigInt
    if (requestId === "0") {
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === PARSER_AGENT_ADDRESS.toLowerCase()) {
          if (log.topics && log.topics.length > 1) {
            try {
              const idVal = ethers.toBigInt(log.topics[1]);
              if (idVal > 0n) {
                requestId = idVal.toString();
                break;
              }
            } catch (err) { }
          }
        }
      }
    }

    if (requestId === "0") {
      throw new Error("Failed to extract requestId from transaction logs.");
    }

    return { requestId, txHash: receipt.hash };
  };

  const getAnalysis = async (requestId: any): Promise<{ theme: string; analysis: string; completed: boolean }> => {
    let cleanId = requestId;
    if (requestId && typeof requestId === 'object') {
      cleanId = requestId.requestId || requestId.id || "";
    }
    const provider = new ethers.JsonRpcProvider(SOMNIA_RPC_URL);
    const contract = new ethers.Contract(PARSER_AGENT_ADDRESS, PARSER_ABI, provider);
    try {
      const result = await contract.submissions(cleanId);
      return {
        theme: result[0],
        analysis: result[2],
        completed: result[3]
      };
    } catch (e: any) {
      console.error("Failed to query submissions mapping on-chain:", e);
      throw new Error(e.message || "Failed to query submissions mapping on-chain.");
    }
  };

  const analyzeProject = async (theme: string, analysis: string): Promise<{ requestId: string; txHash: string }> => {
    if (!account) throw new Error("Wallet not connected");
    if (!isCorrectNetwork) throw new Error("Incorrect network. Please switch to Somnia Testnet.");

    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(LLM_JUDGE_ADDRESS, LLM_ABI, signer);

    const depositWei = ethers.parseEther(llmDeposit);
    const tx = await contract.analyzeProject(theme, analysis, { value: depositWei });
    const receipt = await tx.wait();

    if (!receipt) throw new Error("Transaction failed (no receipt returned).");

    let requestId = "0";

    // 1. Try parsing logs with the contract's defined events
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === LLM_JUDGE_ADDRESS.toLowerCase()) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.args && parsedLog.args.requestId) {
            requestId = parsedLog.args.requestId.toString();
            break;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    // 2. Fallback: Parse the first topic of logs emitted by this contract as a BigInt
    if (requestId === "0") {
      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === LLM_JUDGE_ADDRESS.toLowerCase()) {
          if (log.topics && log.topics.length > 1) {
            try {
              const idVal = ethers.toBigInt(log.topics[1]);
              if (idVal > 0n) {
                requestId = idVal.toString();
                break;
              }
            } catch (err) { }
          }
        }
      }
    }

    if (requestId === "0") {
      throw new Error("Failed to extract requestId from transaction logs.");
    }

    return { requestId, txHash: receipt.hash };
  };

  const getScore = async (requestId: any): Promise<{ score: string; completed: boolean }> => {
    let cleanId = requestId;
    if (requestId && typeof requestId === 'object') {
      cleanId = requestId.requestId || requestId.id || "";
    }
    const provider = new ethers.JsonRpcProvider(SOMNIA_RPC_URL);
    const contract = new ethers.Contract(LLM_JUDGE_ADDRESS, LLM_ABI, provider);
    try {
      const result = await contract.getScore(cleanId);

      // If completed on-chain, sync to leaderboard locally
      if (result[1]) {
        const scoreText = result[0];
        try {
          const parsedScore = parseLLMResult(scoreText);

          // Check if already in leaderboard
          const currentLeaderboard = getLeaderboard();
          const cleanIdStr = String(cleanId);
          if (!currentLeaderboard.some(item => item.id === cleanIdStr)) {
            addToLeaderboard({
              id: cleanIdStr,
              projectName: parsedScore.projectName || `Project #${cleanId}`,
              theme: "On-Chain Evaluated",
              githubUrl: "Somnia Deployed Repo",
              overallScore: parsedScore.overallScore || 0,
              verdict: parsedScore.verdict || "Completed",
              timestamp: Date.now()
            });
          }
        } catch (e) { }
      }

      return {
        score: result[0],
        completed: result[1]
      };
    } catch (e: any) {
      console.error("Failed to query getScore on-chain:", e);
      throw new Error(e.message || "Failed to query getScore on-chain.");
    }
  };

  // Leaderboard Actions
  const addToLeaderboard = (item: LeaderboardItem) => {
    const list = getLeaderboard();
    if (list.some(x => x.id === item.id)) return;
    list.push(item);
    list.sort((a, b) => b.overallScore - a.overallScore);
    localStorage.setItem('hj_leaderboard', JSON.stringify(list));
  };

  const getLeaderboard = (): LeaderboardItem[] => {
    const data = localStorage.getItem('hj_leaderboard');
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  };

  return (
    <Web3Context.Provider value={{
      account,
      chainId,
      isCorrectNetwork,
      isConnecting,
      connectWallet,
      switchNetwork,
      parserDeposit,
      llmDeposit,
      submitProject,
      getAnalysis,
      analyzeProject,
      getScore,
      addToLeaderboard,
      getLeaderboard
    }}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
