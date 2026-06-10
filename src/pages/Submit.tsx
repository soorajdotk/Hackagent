import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { TerminalLogs } from '../components/TerminalLogs';
import { CircularScoreMeter, BarScoreMeter } from '../components/ScoreMeter';
import { useWeb3, PARSER_AGENT_ADDRESS, LLM_JUDGE_ADDRESS, SOMNIA_EXPLORER_URL } from '../context/Web3Context';
import { PARSER_LOGS, LLM_LOGS, parseLLMResult, type ProjectAnalysis, type ScoreReport } from '../utils/mockData';
import { 
  Sparkles, 
  Cpu, 
  CheckCircle, 
  Award, 
  FileCode, 
  Globe, 
  Lightbulb, 
  RotateCcw,
  Wallet,
  AlertTriangle
} from 'lucide-react';

interface SubmitProps {
  setActiveTab: (tab: string) => void;
  parserRequestId: string;
  setParserRequestId: (id: string) => void;
  scoreRequestId: string;
  setScoreRequestId: (id: string) => void;
}

type PipelineState = 'FORM' | 'PARSING_TX' | 'PARSING_POLL' | 'PARSED' | 'SCORING_TX' | 'SCORING_POLL' | 'COMPLETED';

export const Submit: React.FC<SubmitProps> = ({ 
  setActiveTab, 
  parserRequestId, 
  setParserRequestId,
  scoreRequestId,
  setScoreRequestId
}) => {
  const { 
    parserDeposit, 
    llmDeposit,
    submitProject, 
    getAnalysis,
    analyzeProject,
    getScore,
    account, 
    isCorrectNetwork, 
    connectWallet 
  } = useWeb3();

  // --- React State Structure ---
  const [theme, setTheme] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  
  const [githubAnalysis, setGithubAnalysis] = useState<string>('');
  const [scoreResult, setScoreResult] = useState<string>('');

  const [loadingGithub, setLoadingGithub] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);

  const [parserTxHash, setParserTxHash] = useState<string>('');
  const [scoreTxHash, setScoreTxHash] = useState<string>('');

  const walletConnected = !!account;

  // Local helper states for styling & logging
  const [error, setError] = useState('');
  const [parserLogsFinished, setParserLogsFinished] = useState(false);
  const [scoreLogsFinished, setScoreLogsFinished] = useState(false);

  const [parsedAnalysis, setParsedAnalysis] = useState<ProjectAnalysis | null>(null);
  const [parsedScore, setParsedScore] = useState<ScoreReport | null>(null);

  // Suggestions for theme
  const suggestions = [
    "AI + Blockchain",
    "DeFi Innovation",
    "On-chain Gaming",
    "Autonomous Agents",
    "SocialFi"
  ];

  // Derived PipelineState based on React State Structure
  const pipelineState: PipelineState = (() => {
    if (scoreResult && scoreLogsFinished) return 'COMPLETED';
    if (scoreRequestId) return 'SCORING_POLL';
    if (loadingScore && !scoreRequestId) return 'SCORING_TX';
    if (githubAnalysis && parserLogsFinished) return 'PARSED';
    if (parserRequestId) return 'PARSING_POLL';
    if (loadingGithub && !parserRequestId) return 'PARSING_TX';
    return 'FORM';
  })();

  // Sync props IDs with local states
  useEffect(() => {
    if (scoreRequestId) {
      setLoadingScore(false);
      // If scoreRequestId is provided but result isn't fetched, load it
      if (!scoreResult) {
        fetchScoreLive(scoreRequestId);
      }
    }
  }, [scoreRequestId, scoreResult]);

  useEffect(() => {
    if (parserRequestId) {
      setLoadingGithub(false);
      // If parserRequestId is provided but result isn't fetched, load it
      if (!githubAnalysis) {
        fetchAnalysisLive(parserRequestId);
      }
    }
  }, [parserRequestId, githubAnalysis]);

  const fetchAnalysisLive = async (id: string) => {
    try {
      const res = await getAnalysis(id);
      if (res.completed && res.analysis) {
        setGithubAnalysis(res.analysis);
        setParserLogsFinished(true);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to query submissions mapping on-chain.");
    }
  };

  const fetchScoreLive = async (id: string) => {
    try {
      const res = await getScore(id);
      if (res.completed && res.score) {
        setScoreResult(res.score);
        setScoreLogsFinished(true);
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to query score details on-chain.");
    }
  };

  const handleTriggerLLM = async () => {
    if (!githubAnalysis) return;
    setLoadingScore(true);
    setError('');
    try {
      // Calls HackJudgeLLM.getRequiredDeposit() internally & prompts MetaMask
      const { requestId, txHash } = await analyzeProject(theme.trim() || "AI + Blockchain", githubAnalysis);
      setScoreRequestId(requestId);
      setScoreTxHash(txHash);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'LLM transaction failed or was rejected.');
      setLoadingScore(false);
    }
  };

  // Reset pipeline
  const handleReset = () => {
    setTheme('');
    setGithubUrl('');
    setParserRequestId('');
    setGithubAnalysis('');
    setScoreRequestId('');
    setScoreResult('');
    setLoadingGithub(false);
    setLoadingScore(false);
    setParserTxHash('');
    setScoreTxHash('');
    setError('');
    setParserLogsFinished(false);
    setScoreLogsFinished(false);
    setParsedAnalysis(null);
    setParsedScore(null);
  };

  // STEP 3 & 4: START README ANALYSIS (TRIGGER PARSER TX)
  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!theme.trim()) {
      setError('Please provide a hackathon theme.');
      return;
    }
    if (!githubUrl.trim() || !githubUrl.startsWith('https://github.com/')) {
      setError('Please provide a valid GitHub repository URL (starts with https://github.com/).');
      return;
    }

    setLoadingGithub(true);
    try {
      // Calls HackJudgeAgent.getRequiredDeposit() internally & prompts MetaMask
      const { requestId, txHash } = await submitProject(theme.trim(), githubUrl.trim());
      setParserRequestId(requestId);
      setParserTxHash(txHash);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Transaction failed or rejected.');
      setLoadingGithub(false);
    }
  };

  // STEP 5: POLL CONTRACT FOR README ANALYSIS
  useEffect(() => {
    let intervalId: any;
    if (parserRequestId && !githubAnalysis) {
      intervalId = setInterval(async () => {
        try {
          const res = await getAnalysis(parserRequestId);
          if (res.completed && res.analysis) {
            clearInterval(intervalId);
            setGithubAnalysis(res.analysis);
          }
        } catch (e: any) {
          console.error("Polling submissions mapping error:", e);
          setError(e.message || "Polling submissions mapping error.");
        }
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [parserRequestId, githubAnalysis]);

  // Parse analysis JSON once returned
  useEffect(() => {
    if (githubAnalysis) {
      try {
        const parsed = JSON.parse(githubAnalysis) as ProjectAnalysis;
        setParsedAnalysis(parsed);
      } catch (e) {
        // Fallback key-value parser if analysis payload is formatted as text
        const lines = githubAnalysis.split('\n');
        const fallback: ProjectAnalysis = {
          projectName: "Parsed Project",
          description: "Readme parsing details completed.",
          features: [],
          useCases: []
        };
        let currentSection: 'features' | 'usecases' | 'none' = 'none';

        lines.forEach(line => {
          const lineLower = line.toLowerCase();
          if (lineLower.includes('project name:') || lineLower.includes('title:')) {
            fallback.projectName = line.substring(line.indexOf(':') + 1).trim();
          } else if (lineLower.includes('description:') || lineLower.includes('summary:')) {
            fallback.description = line.substring(line.indexOf(':') + 1).trim();
          } else if (lineLower.includes('feature')) {
            currentSection = 'features';
          } else if (lineLower.includes('use case') || lineLower.includes('utility')) {
            currentSection = 'usecases';
          } else if (line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d+\./.test(line.trim())) {
            const item = line.replace(/^[-*\d.]+\s*/, '').trim();
            if (item) {
              if (currentSection === 'features') fallback.features.push(item);
              if (currentSection === 'usecases') fallback.useCases.push(item);
            }
          }
        });
        setParsedAnalysis(fallback);
      }
    }
  }, [githubAnalysis]);

  const handleParserLogsFinished = () => {
    setParserLogsFinished(true);
  };

  // STEP 8: POLL CONTRACT FOR LLM SCORING RESULT
  useEffect(() => {
    let intervalId: any;
    if (scoreRequestId && !scoreResult) {
      intervalId = setInterval(async () => {
        try {
          const res = await getScore(scoreRequestId);
          if (res.completed && res.score) {
            clearInterval(intervalId);
            setScoreResult(res.score);
          }
        } catch (e: any) {
          console.error("Polling scores mapping error:", e);
          setError(e.message || "Polling scores mapping error.");
        }
      }, 5000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [scoreRequestId, scoreResult]);

  // Parse scoring results once loaded
  useEffect(() => {
    if (scoreResult) {
      const parsed = parseLLMResult(scoreResult);
      setParsedScore(parsed);
    }
  }, [scoreResult]);

  const handleScoreLogsFinished = () => {
    setScoreLogsFinished(true);
    setLoadingScore(false);
  };

  const getVerdictStyles = (v: string) => {
    const lower = v.toLowerCase();
    if (lower.includes('outstanding')) {
      return 'bg-successGreen/15 border-successGreen/55 text-successGreen shadow-[0_0_15px_rgba(0,230,118,0.2)]';
    }
    if (lower.includes('strong')) {
      return 'bg-cyberCyan/15 border-cyberCyan/55 text-cyberCyan shadow-[0_0_15px_rgba(102,252,241,0.2)]';
    }
    if (lower.includes('average') || lower.includes('good') || lower.includes('runner')) {
      return 'bg-yellow-500/15 border-yellow-500/55 text-yellow-400';
    }
    return 'bg-red-500/15 border-red-500/55 text-red-400';
  };

  // Helper to determine the current visual step index (1-5)
  const getCurrentStepIndex = () => {
    if (scoreResult && scoreLogsFinished) return 5;
    if (scoreRequestId || (loadingScore && !scoreRequestId)) return 4;
    if (githubAnalysis && parserLogsFinished) return 3;
    if (parserRequestId || (loadingGithub && !parserRequestId)) return 2;
    if (walletConnected) return 1;
    return 0;
  };

  const stepsList = [
    "Wallet Connected",
    "README Analysis Started",
    "README Analysis Complete",
    "AI Evaluation Started",
    "AI Evaluation Complete"
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      
      {/* Visual Pipeline Steps Stepper */}
      <div className="bg-darkCard/25 border border-white/5 rounded-2xl p-6 mb-4">
        <h4 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 text-center mb-6">
          Judging Pipeline Progress
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {stepsList.map((label, idx) => {
            const stepNum = idx + 1;
            const currentStep = getCurrentStepIndex();
            const isCompleted = currentStep >= stepNum;
            const isActive = currentStep === stepNum;

            return (
              <div key={idx} className="flex flex-col items-center text-center space-y-2 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold border transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-successGreen/15 border-successGreen text-successGreen shadow-[0_0_12px_rgba(0,230,118,0.35)]'
                    : isActive
                      ? 'bg-cyberCyan/15 border-cyberCyan text-cyberCyan shadow-[0_0_12px_rgba(102,252,241,0.35)] animate-pulse'
                      : 'bg-black/40 border-white/10 text-gray-500'
                }`}>
                  {stepNum}
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider leading-relaxed ${
                  isCompleted || isActive ? 'text-white font-semibold' : 'text-gray-500'
                }`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contract Addresses Info Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-darkCard/20 border border-white/5 rounded-xl p-4 text-xs font-semibold font-mono">
        <div className="space-y-1">
          <span className="text-gray-500 uppercase tracking-widest text-[9px] block">Parser Contract (HackJudgeAgent)</span>
          <span className="text-cyberCyan block break-all">{PARSER_AGENT_ADDRESS}</span>
        </div>
        <div className="space-y-1 border-t md:border-t-0 md:border-l border-white/5 pt-2 md:pt-0 md:pl-4">
          <span className="text-gray-500 uppercase tracking-widest text-[9px] block">LLM Contract (HackJudgeLLM)</span>
          <span className="text-cyberBlue block break-all">{LLM_JUDGE_ADDRESS}</span>
        </div>
      </div>
      
      {/* --- STEP 1: LANDING INFO AND STATE VIEW --- */}
      {pipelineState === 'FORM' && (
        <div className="text-center space-y-6 max-w-2xl mx-auto py-4">
          <h1 className="text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-white leading-tight">
            HackJudge <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyberCyan to-cyberBlue">AI</span>
          </h1>
          <p className="text-gray-300 text-base md:text-lg leading-relaxed">
            Autonomous, AI-powered on-chain judging platform built on Somnia L1. Automate repository analysis and get transparent scorecards in seconds.
          </p>
          
          {!walletConnected ? (
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-cyberCyan to-cyberBlue hover:shadow-glow text-black font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mx-auto active:scale-95 text-sm uppercase tracking-wider animate-pulse"
            >
              <Wallet className="h-4.5 w-4.5" />
              Connect MetaMask
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-darkCard border border-cyberCyan/25 font-mono text-sm text-gray-300">
              <span className="w-2.5 h-2.5 rounded-full bg-successGreen shadow-[0_0_8px_rgba(0,230,118,0.6)] animate-pulse"></span>
              Connected Wallet: {`${account?.slice(0, 8)}...${account?.slice(-6)}`}
            </div>
          )}
        </div>
      )}

      {/* --- STEP 2: PROJECT SUBMISSION CARD --- */}
      {pipelineState === 'FORM' && (
        <Card hover={false} className="bg-darkCard/25 border-cyberCyan/10 p-8 max-w-3xl mx-auto">
          <form onSubmit={handleStartAnalysis} className="space-y-6 text-left">
            <h3 className="text-lg font-bold text-gray-200 uppercase tracking-wider border-b border-white/5 pb-3">
              Project Parameters
            </h3>

            {/* Theme field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                Hackathon Theme / Topic
              </label>
              <input
                type="text"
                placeholder="e.g. AI + Blockchain"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                disabled={loadingGithub}
                className="w-full bg-black/60 border border-cyberCyan/20 focus:border-cyberCyan/50 focus:ring-1 focus:ring-cyberCyan/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all font-medium text-sm"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTheme(item)}
                    disabled={loadingGithub}
                    className="text-[11px] bg-darkCard/80 border border-white/5 hover:border-cyberCyan/35 text-gray-400 hover:text-cyberCyan px-3 py-1.5 rounded-lg transition-all font-semibold"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* GitHub URL */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                GitHub Repository URL
              </label>
              <input
                type="text"
                placeholder="e.g. https://github.com/username/project"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                disabled={loadingGithub}
                className="w-full bg-black/60 border border-cyberCyan/20 focus:border-cyberCyan/50 focus:ring-1 focus:ring-cyberCyan/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all font-medium text-sm"
              />
            </div>

            {/* Deposits Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/40 border border-white/5 rounded-xl p-4 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 uppercase tracking-wider">1. Parser Deposit:</span>
                <span className="font-mono font-bold text-cyberCyan text-sm">{parserDeposit} STT</span>
              </div>
              <div className="flex items-center justify-between border-t md:border-t-0 md:border-l border-white/5 pt-2 md:pt-0 md:pl-4">
                <span className="text-gray-400 uppercase tracking-wider">2. LLM Judge Deposit:</span>
                <span className="font-mono font-bold text-cyberCyan text-sm">{llmDeposit} STT</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <span className="leading-snug break-all">{error}</span>
              </div>
            )}

            {/* Analyze Project Trigger */}
            {!walletConnected ? (
              <button
                type="button"
                onClick={connectWallet}
                className="w-full bg-gradient-to-r from-cyberCyan to-cyberBlue hover:shadow-glow text-black font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                <Wallet className="h-4.5 w-4.5" />
                Connect Wallet to Analyze
              </button>
            ) : !isCorrectNetwork ? (
              <div className="text-center text-red-400 text-sm py-2.5 bg-red-500/5 rounded-xl border border-red-500/15 font-bold uppercase tracking-wider">
                Please switch MetaMask to Somnia Testnet first.
              </div>
            ) : (
              <button
                type="submit"
                disabled={loadingGithub}
                className="w-full bg-gradient-to-r from-cyberCyan to-cyberBlue hover:brightness-110 hover:shadow-glow text-black font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider active:scale-98"
              >
                <Cpu className="h-4.5 w-4.5" />
                Analyze Project
              </button>
            )}
          </form>
        </Card>
      )}

      {/* --- STEP 3, 4 & 5: README ANALYSIS SECTION --- */}
      {(pipelineState === 'PARSING_TX' || pipelineState === 'PARSING_POLL' || pipelineState === 'PARSED') && (
        <div className="space-y-6 text-left max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-cyberCyan/10 pb-3">
            <h2 className="text-lg font-bold uppercase tracking-wider text-gray-200">
              Stage 1: README Analysis
            </h2>
            <span className="text-xs text-gray-500 font-mono">
              {parserRequestId ? `ID: ${parserRequestId}` : "Waiting for confirmation..."}
            </span>
          </div>

          {/* Polling loading spinner or terminal logs */}
          {!githubAnalysis && (
            <Card hover={false} className="border-cyberCyan/25 py-6">
              <div className="flex flex-col gap-4 text-center pb-4 border-b border-white/5 mb-4">
                <div className="w-8 h-8 border-4 border-cyberCyan/20 border-t-cyberCyan rounded-full animate-spin mx-auto"></div>
                <span className="text-sm text-gray-300 font-semibold animate-pulse">
                  {pipelineState === 'PARSING_TX' 
                    ? "Submitting README analysis request to MetaMask..."
                    : "README Analysis Started. Polling submissions mapping..."
                  }
                </span>

                {parserTxHash && (
                  <div className="text-xs text-gray-500 font-mono flex items-center justify-center gap-1.5 break-all select-all">
                    Tx Hash: 
                    <a 
                      href={`${SOMNIA_EXPLORER_URL}/tx/${parserTxHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-cyberCyan hover:underline hover:text-cyberCyan/80 font-bold"
                    >
                      {parserTxHash}
                    </a>
                  </div>
                )}
              </div>
              <TerminalLogs 
                logs={PARSER_LOGS} 
                onComplete={handleParserLogsFinished}
                speedMs={1200}
              />
            </Card>
          )}

          {/* Parser completed status logs but terminal animation still running */}
          {githubAnalysis && !parserLogsFinished && (
            <Card hover={false} className="border-cyberCyan/25 py-6">
              {parserTxHash && (
                <div className="text-xs text-gray-500 font-mono text-center mb-4 break-all select-all">
                  Tx Hash: 
                  <a 
                    href={`${SOMNIA_EXPLORER_URL}/tx/${parserTxHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-cyberCyan hover:underline hover:text-cyberCyan/80 font-bold"
                  >
                    {parserTxHash}
                  </a>
                </div>
              )}
              <TerminalLogs 
                logs={PARSER_LOGS} 
                onComplete={handleParserLogsFinished}
                speedMs={1200}
              />
            </Card>
          )}

          {/* STEP 6: SHOW PARSED README DETAILS once logs complete */}
          {githubAnalysis && parserLogsFinished && parsedAnalysis && (
            <div className="space-y-6 animate-fadeIn">
              <Card hover={false} className="border-successGreen/25 bg-successGreen/5 py-4 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-5 w-5 text-successGreen" />
                  <span className="text-sm text-successGreen font-bold uppercase tracking-wider">
                    README Analysis Completed
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-mono flex items-center gap-2">
                  <span>ID: <span className="text-successGreen font-bold">{parserRequestId}</span></span>
                  {parserTxHash && (
                    <a 
                      href={`${SOMNIA_EXPLORER_URL}/tx/${parserTxHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyberCyan hover:underline font-bold"
                    >
                      (View Tx)
                    </a>
                  )}
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card hover={false} className="md:col-span-3 space-y-2.5 bg-darkCard/25 border-white/5 p-5">
                  <div className="flex items-center gap-2 text-cyberCyan">
                    <FileCode className="h-4.5 w-4.5" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Project Name</span>
                  </div>
                  <p className="text-2xl font-extrabold text-white uppercase tracking-wide">
                    {parsedAnalysis.projectName}
                  </p>
                </Card>

                <Card hover={false} className="md:col-span-3 space-y-2.5 bg-darkCard/25 border-white/5 p-5">
                  <div className="flex items-center gap-2 text-cyberCyan">
                    <Globe className="h-4.5 w-4.5" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Description</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {parsedAnalysis.description}
                  </p>
                </Card>

                <Card hover={false} className="md:col-span-1.5 bg-darkCard/25 border-white/5 p-5 flex flex-col h-full">
                  <div className="flex items-center gap-2 text-neonPurple mb-4">
                    <CheckCircle className="h-4.5 w-4.5" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Features</span>
                  </div>
                  <ul className="space-y-3 flex-grow text-xs font-semibold text-gray-300">
                    {parsedAnalysis.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5 leading-snug">
                        <span className="w-1.5 h-1.5 rounded-full bg-neonPurple mt-2 shrink-0"></span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card hover={false} className="md:col-span-1.5 bg-darkCard/25 border-white/5 p-5 flex flex-col h-full">
                  <div className="flex items-center gap-2 text-cyberBlue mb-4">
                    <Lightbulb className="h-4.5 w-4.5" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400">Use Cases</span>
                  </div>
                  <ul className="space-y-3 flex-grow text-xs font-semibold text-gray-300">
                    {parsedAnalysis.useCases.map((uc, i) => (
                      <li key={i} className="flex items-start gap-2.5 leading-snug">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyberBlue mt-2 shrink-0"></span>
                        <span>{uc}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* MANUAL TRIGGER BUTTON FOR AI JUDGING */}
              {!loadingScore && !scoreRequestId && !scoreResult && (
                <Card hover={true} className="border-cyberCyan/20 bg-darkCard/30 p-6 space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyberCyan/10 border border-cyberCyan/30 text-cyberCyan shrink-0">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider text-white">Stage 2: AI Consensus Rating</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Run our decentralized panel of AI Judges to evaluate your project relevance, innovation, technical complexity, and impact.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-4 text-xs font-semibold">
                    <span className="text-gray-400 uppercase tracking-wider">Evaluation Fee Deposit:</span>
                    <span className="font-mono font-bold text-cyberCyan text-sm">{llmDeposit} STT</span>
                  </div>

                  <button
                    onClick={handleTriggerLLM}
                    className="w-full bg-gradient-to-r from-cyberCyan to-cyberBlue hover:shadow-glow text-black font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider active:scale-98 animate-pulse"
                  >
                    <Cpu className="h-4.5 w-4.5" />
                    Analyze Project with AI
                  </button>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- STEP 7 & 8: AI EVALUATION SECTION --- */}
      {githubAnalysis && parserLogsFinished && (loadingScore || scoreRequestId || scoreResult) && (
        <div className="space-y-6 text-left max-w-3xl mx-auto border-t border-white/5 pt-8 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-cyberCyan/10 pb-3">
            <h2 className="text-lg font-bold uppercase tracking-wider text-gray-200">
              Stage 2: AI Consensus Evaluation
            </h2>
            <span className="text-xs text-gray-500 font-mono">
              {scoreRequestId ? `ID: ${scoreRequestId}` : "Awaiting signature trigger..."}
            </span>
          </div>

          {/* Trigger Failure display (MetaMask rejected) */}
          {error && !scoreRequestId && (
            <Card hover={false} className="border-red-500/35 bg-red-500/5 p-5 space-y-4">
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <h4 className="text-sm font-bold uppercase tracking-wider">AI Evaluation Trigger Blocked</h4>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {error}
              </p>
              <button 
                onClick={handleTriggerLLM}
                className="bg-red-500 text-white font-extrabold px-6 py-2 rounded-xl text-xs uppercase tracking-wider hover:bg-red-600 transition-all active:scale-95"
              >
                Retry MetaMask Transaction
              </button>
            </Card>
          )}

          {/* Awaiting signature prompt */}
          {!scoreRequestId && !error && (
            <Card hover={false} className="border-cyberCyan/20 py-8 text-center space-y-4 bg-darkCard/15">
              <div className="w-8 h-8 border-4 border-cyberCyan/20 border-t-cyberCyan rounded-full animate-spin mx-auto"></div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">Prompting MetaMask Evaluation Deposit</h4>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Please confirm the gas deposit fee transaction in MetaMask to initialize the LLM Judges.
                </p>
              </div>
            </Card>
          )}

          {/* Polling Score results and terminal logs */}
          {scoreRequestId && !scoreResult && (
            <Card hover={false} className="border-neonPurple/25 py-6">
              <div className="flex flex-col gap-4 text-center pb-4 border-b border-white/5 mb-4">
                <div className="w-8 h-8 border-4 border-neonPurple/20 border-t-neonPurple rounded-full animate-spin mx-auto"></div>
                <span className="text-sm text-gray-300 font-semibold animate-pulse">
                  AI Evaluation Started. Polling LLM Contract events...
                </span>
                {scoreTxHash && (
                  <div className="text-xs text-gray-500 font-mono flex items-center justify-center gap-1.5 break-all select-all">
                    Tx Hash: 
                    <a 
                      href={`${SOMNIA_EXPLORER_URL}/tx/${scoreTxHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-cyberCyan hover:underline hover:text-cyberCyan/80 font-bold"
                    >
                      {scoreTxHash}
                    </a>
                  </div>
                )}
              </div>
              <TerminalLogs 
                logs={LLM_LOGS} 
                onComplete={handleScoreLogsFinished}
                speedMs={1200}
              />
            </Card>
          )}

          {/* Logs finishing */}
          {scoreRequestId && scoreResult && !scoreLogsFinished && (
            <Card hover={false} className="border-neonPurple/25 py-6">
              {scoreTxHash && (
                <div className="text-xs text-gray-500 font-mono text-center mb-4 break-all select-all">
                  Tx Hash: 
                  <a 
                    href={`${SOMNIA_EXPLORER_URL}/tx/${scoreTxHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-cyberCyan hover:underline hover:text-cyberCyan/80 font-bold"
                  >
                    {scoreTxHash}
                  </a>
                </div>
              )}
              <TerminalLogs 
                logs={LLM_LOGS} 
                onComplete={handleScoreLogsFinished}
                speedMs={1200}
              />
            </Card>
          )}

          {/* STEP 9: SHOW EVALUATION DASHBOARD */}
          {scoreResult && scoreLogsFinished && parsedScore && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header card with verdict badge */}
              <Card hover={false} className="border-successGreen/25 bg-successGreen/5 py-4.5 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-successGreen" />
                  <span className="text-sm text-successGreen font-bold uppercase tracking-wider">
                    Consensus Audit Complete
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setActiveTab('leaderboard')}
                    className="flex items-center gap-1.5 text-xs text-cyberCyan hover:underline hover:text-cyberCyan/80 font-bold bg-cyberCyan/10 px-3 py-1.5 rounded-lg border border-cyberCyan/20 uppercase tracking-wide font-mono"
                  >
                    View Leaderboard
                  </button>
                  <button 
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs text-gray-300 hover:underline hover:text-white font-bold bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-wide font-mono"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                </div>
              </Card>

              {/* Main Rating Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Overall composite Ring */}
                <Card hover={false} className="md:col-span-1 bg-darkCard/25 border-white/5 flex flex-col items-center justify-center p-8 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Overall Score</h3>
                  <CircularScoreMeter score={parsedScore.overallScore} label="Composite" size={170} />
                  <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest text-center ${getVerdictStyles(parsedScore.verdict)}`}>
                    Verdict: {parsedScore.verdict}
                  </div>
                </Card>

                {/* Sub Score Items */}
                <Card hover={false} className="md:col-span-2 bg-darkCard/25 border-white/5 p-8 flex flex-col justify-between space-y-5">
                  <div className="flex items-center gap-2 text-cyberCyan border-b border-white/5 pb-3">
                    <Award className="h-5 w-5" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Scorecard: {parsedScore.projectName}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <BarScoreMeter score={parsedScore.themeRelevance} label="Theme Relevance" />
                    <BarScoreMeter score={parsedScore.innovation} label="Innovation" />
                    <BarScoreMeter score={parsedScore.technicalComplexity} label="Technical Complexity" />
                    <BarScoreMeter score={parsedScore.realWorldImpact} label="Real World Impact" />
                  </div>
                </Card>
              </div>

              {/* Textual Feedback Report */}
              <Card hover={false} className="bg-darkCard/25 border-white/5 p-6 space-y-4">
                <div className="flex items-center gap-2 text-cyberCyan">
                  <Sparkles className="h-4.5 w-4.5" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-200">
                    AI Judge Consensus Reasoning
                  </h3>
                </div>
                <div className="bg-black/50 border border-white/5 rounded-xl p-5 text-gray-300 text-sm leading-relaxed font-semibold">
                  <p>{parsedScore.reason}</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
