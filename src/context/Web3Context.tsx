import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getMockAnalysisByUrl, getMockScoreByAnalysis, type ProjectAnalysis, type ScoreReport } from '../utils/mockData';

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
  "function submissions(uint256) external view returns (string theme, string githubUrl, string analysis, bool completed)"
];

const LLM_ABI = [
  "function analyzeProject(string theme, string projectAnalysis) external payable returns (uint256)",
  "function getScore(uint256 requestId) external view returns (string memory result, bool completed)",
  "function getRequiredDeposit() external view returns (uint256)",
  "function pendingRequests(uint256) external view returns (bool)",
  "function scores(uint256) external view returns (string result, bool completed)"
];

interface Web3ContextType {
  // Config
  isMockMode: boolean;
  setMockMode: (val: boolean) => void;
  
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
  submitProject: (theme: string, githubUrl: string) => Promise<string>;
  getAnalysis: (requestId: string) => Promise<{ analysis: string; completed: boolean }>;
  
  // LLM Actions
  analyzeProject: (theme: string, analysis: string) => Promise<string>;
  getScore: (requestId: string) => Promise<{ score: string; completed: boolean }>;

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
  isMock: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Mode Selection
  const [isMockMode, setIsMockModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('hj_mock_mode');
    return saved !== null ? saved === 'true' : false; // Default to Live DApp mode
  });

  const setMockMode = (val: boolean) => {
    setIsMockModeState(val);
    localStorage.setItem('hj_mock_mode', String(val));
  };

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
      if (!isMockMode && isCorrectNetwork && (window as any).ethereum) {
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
  }, [isMockMode, isCorrectNetwork, account]);

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
      // This error code indicates that the chain has not been added to MetaMask.
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

  // Parsing Submissions Local Database (for Mock Mode)
  const submitProject = async (theme: string, githubUrl: string): Promise<string> => {
    if (isMockMode) {
      const mockReqId = String(1000 + Math.floor(Math.random() * 9000));
      const mockDataStore = JSON.parse(localStorage.getItem('hj_mock_submissions') || '{}');
      mockDataStore[mockReqId] = {
        theme,
        githubUrl,
        analysis: "",
        completed: false,
        timestamp: Date.now()
      };
      localStorage.setItem('hj_mock_submissions', JSON.stringify(mockDataStore));
      
      // Start simulated parser in background (takes 5 seconds)
      setTimeout(() => {
        const store = JSON.parse(localStorage.getItem('hj_mock_submissions') || '{}');
        if (store[mockReqId]) {
          const { text } = getMockAnalysisByUrl(githubUrl, theme);
          store[mockReqId].analysis = text;
          store[mockReqId].completed = true;
          localStorage.setItem('hj_mock_submissions', JSON.stringify(store));
        }
      }, 5000);

      return mockReqId;
    } else {
      if (!account) throw new Error("Wallet not connected");
      if (!isCorrectNetwork) throw new Error("Incorrect network. Please switch to Somnia Testnet.");
      
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(PARSER_AGENT_ADDRESS, PARSER_ABI, signer);
      
      const depositWei = ethers.parseEther(parserDeposit);
      const tx = await contract.submitProject(theme, githubUrl, { value: depositWei });
      const receipt = await tx.wait();
      
      // Look for AnalysisRequested event or parse return value
      // In Solidity, a tx receipt includes events. We can fetch parsed logs.
      let requestId = "0";
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'AnalysisRequested') {
            requestId = parsedLog.args.requestId.toString();
            break;
          }
        } catch (e) {
          // ignore log parse errors of other logs
        }
      }

      if (requestId === "0") {
        // Fallback: query submissions count or generate based on hash
        requestId = String(parseInt(receipt.hash.slice(0, 10), 16));
      }
      
      return requestId;
    }
  };

  const getAnalysis = async (requestId: string): Promise<{ analysis: string; completed: boolean }> => {
    if (isMockMode) {
      const store = JSON.parse(localStorage.getItem('hj_mock_submissions') || '{}');
      const submission = store[requestId];
      if (!submission) {
        return { analysis: "", completed: false };
      }
      return {
        analysis: submission.analysis,
        completed: submission.completed
      };
    } else {
      const provider = new ethers.JsonRpcProvider(SOMNIA_RPC_URL);
      const contract = new ethers.Contract(PARSER_AGENT_ADDRESS, PARSER_ABI, provider);
      try {
        const result = await contract.getAnalysis(requestId);
        return {
          analysis: result[0],
          completed: result[1]
        };
      } catch (e) {
        console.error("Failed to query getAnalysis on-chain:", e);
        return { analysis: "", completed: false };
      }
    }
  };

  // LLM Evaluation Local Database (for Mock Mode)
  const analyzeProject = async (theme: string, analysis: string): Promise<string> => {
    if (isMockMode) {
      const mockReqId = String(20000 + Math.floor(Math.random() * 9000));
      const mockScoreStore = JSON.parse(localStorage.getItem('hj_mock_scores') || '{}');
      mockScoreStore[mockReqId] = {
        theme,
        analysis,
        result: "",
        completed: false,
        timestamp: Date.now()
      };
      localStorage.setItem('hj_mock_scores', JSON.stringify(mockScoreStore));
      
      // Start simulated LLM in background (takes 5 seconds)
      setTimeout(() => {
        const store = JSON.parse(localStorage.getItem('hj_mock_scores') || '{}');
        if (store[mockReqId]) {
          const { text, parsed } = getMockScoreByAnalysis(analysis, theme);
          store[mockReqId].result = text;
          store[mockReqId].completed = true;
          localStorage.setItem('hj_mock_scores', JSON.stringify(store));

          // Extract project name for leaderboard
          let projectName = "Unknown Project";
          let githubUrl = "";
          try {
            const parsedAnalysis = JSON.parse(analysis) as ProjectAnalysis;
            projectName = parsedAnalysis.projectName;
          } catch(e){}

          // Find githubUrl if possible by searching mock submissions
          const submissionsStore = JSON.parse(localStorage.getItem('hj_mock_submissions') || '{}');
          for (const key in submissionsStore) {
            try {
              const subAnalysis = JSON.parse(submissionsStore[key].analysis) as ProjectAnalysis;
              if (subAnalysis.projectName === projectName) {
                githubUrl = submissionsStore[key].githubUrl;
                break;
              }
            } catch(e){}
          }

          // Automatically push to leaderboard
          addToLeaderboard({
            id: mockReqId,
            projectName,
            theme,
            githubUrl: githubUrl || "https://github.com/project/repo",
            overallScore: parsed.overallScore,
            verdict: parsed.verdict,
            timestamp: Date.now(),
            isMock: true
          });
        }
      }, 5000);

      return mockReqId;
    } else {
      if (!account) throw new Error("Wallet not connected");
      if (!isCorrectNetwork) throw new Error("Incorrect network. Please switch to Somnia Testnet.");
      
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(LLM_JUDGE_ADDRESS, LLM_ABI, signer);
      
      const depositWei = ethers.parseEther(llmDeposit);
      const tx = await contract.analyzeProject(theme, analysis, { value: depositWei });
      const receipt = await tx.wait();
      
      let requestId = "0";
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'EvaluationRequested') {
            requestId = parsedLog.args.requestId.toString();
            break;
          }
        } catch (e) {}
      }

      if (requestId === "0") {
        requestId = String(parseInt(receipt.hash.slice(0, 10), 16));
      }
      
      return requestId;
    }
  };

  const getScore = async (requestId: string): Promise<{ score: string; completed: boolean }> => {
    if (isMockMode) {
      const store = JSON.parse(localStorage.getItem('hj_mock_scores') || '{}');
      const score = store[requestId];
      if (!score) {
        return { score: "", completed: false };
      }
      return {
        score: score.result,
        completed: score.completed
      };
    } else {
      const provider = new ethers.JsonRpcProvider(SOMNIA_RPC_URL);
      const contract = new ethers.Contract(LLM_JUDGE_ADDRESS, LLM_ABI, provider);
      try {
        const result = await contract.getScore(requestId);
        
        // If completed on-chain, let's sync to leaderboard locally
        if (result[1]) {
          let scoreText = result[0];
          try {
            const parsedScore = JSON.parse(scoreText) as ScoreReport;
            
            // Check if already in leaderboard
            const currentLeaderboard = getLeaderboard();
            if (!currentLeaderboard.some(item => item.id === requestId)) {
              addToLeaderboard({
                id: requestId,
                projectName: parsedScore.projectName || `Project #${requestId}`,
                theme: "On-Chain Evaluated",
                githubUrl: "Somnia Deployed Repo",
                overallScore: parsedScore.overallScore || 0,
                verdict: parsedScore.verdict || "Completed",
                timestamp: Date.now(),
                isMock: false
              });
            }
          } catch(e) {}
        }
        
        return {
          score: result[0],
          completed: result[1]
        };
      } catch (e) {
        console.error("Failed to query getScore on-chain:", e);
        return { score: "", completed: false };
      }
    }
  };

  // Leaderboard Actions
  const addToLeaderboard = (item: LeaderboardItem) => {
    const list = getLeaderboard();
    // Don't add duplicate IDs
    if (list.some(x => x.id === item.id)) return;
    list.push(item);
    // Sort descending by overallScore
    list.sort((a, b) => b.overallScore - a.overallScore);
    localStorage.setItem('hj_leaderboard', JSON.stringify(list));
  };

  const getLeaderboard = (): LeaderboardItem[] => {
    const data = localStorage.getItem('hj_leaderboard');
    if (!data) {
      // Bootstrap with some standard items if empty
      const initialItems: LeaderboardItem[] = [
        {
          id: "9991",
          projectName: "TruthGate Protocol",
          theme: "AI + Security",
          githubUrl: "https://github.com/truthgate/protocol",
          overallScore: 95,
          verdict: "Outstanding",
          timestamp: Date.now() - 3600000 * 24,
          isMock: true
        },
        {
          id: "9992",
          projectName: "AeroYield Optimizer",
          theme: "DeFi Innovation",
          githubUrl: "https://github.com/aeroyield/optimizer",
          overallScore: 91,
          verdict: "Strong",
          timestamp: Date.now() - 3600000 * 12,
          isMock: true
        },
        {
          id: "9993",
          projectName: "SomniaVerse RPG",
          theme: "On-chain Gaming",
          githubUrl: "https://github.com/somniaverse/rpg",
          overallScore: 89,
          verdict: "Strong",
          timestamp: Date.now() - 3600000 * 4,
          isMock: true
        }
      ];
      localStorage.setItem('hj_leaderboard', JSON.stringify(initialItems));
      return initialItems;
    }
    return JSON.parse(data);
  };

  return (
    <Web3Context.Provider value={{
      isMockMode,
      setMockMode,
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
