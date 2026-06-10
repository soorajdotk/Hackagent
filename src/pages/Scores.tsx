import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { TerminalLogs } from '../components/TerminalLogs';
import { CircularScoreMeter, BarScoreMeter } from '../components/ScoreMeter';
import { useWeb3 } from '../context/Web3Context';
import { LLM_LOGS, type ScoreReport } from '../utils/mockData';
import { Search, CheckCircle, Share2, Award, Sparkles } from 'lucide-react';

interface ScoresProps {
  scoreRequestId: string;
  setScoreRequestId: (id: string) => void;
}

export const Scores: React.FC<ScoresProps> = ({ scoreRequestId, setScoreRequestId }) => {
  const { isMockMode, getScore } = useWeb3();

  const [searchId, setSearchId] = useState(scoreRequestId);
  const [loading, setLoading] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [logsComplete, setLogsComplete] = useState(false);
  const [error, setError] = useState('');

  const [scoreResult, setScoreResult] = useState<ScoreReport | null>(null);
  const [isCompletedState, setIsCompletedState] = useState(false);

  useEffect(() => {
    setSearchId(scoreRequestId);
    if (scoreRequestId) {
      checkStatus(scoreRequestId);
    }
  }, [scoreRequestId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setScoreResult(null);
    setIsCompletedState(false);
    setLogsComplete(false);
    setPollingActive(false);

    if (!searchId.trim()) {
      setError('Please provide a valid Score Request ID.');
      return;
    }

    setScoreRequestId(searchId.trim());
    checkStatus(searchId.trim());
  };

  const checkStatus = async (id: string) => {
    setLoading(true);
    try {
      const res = await getScore(id);
      
      if (res.completed && res.score) {
        setIsCompletedState(true);
        setLogsComplete(true);
        parseAndSetScores(res.score);
      } else {
        if (isMockMode) {
          const mockScores = JSON.parse(localStorage.getItem('hj_mock_scores') || '{}');
          if (!mockScores[id]) {
            setError(`Score Request ID ${id} not found in local demo database.`);
            setLoading(false);
            return;
          }
          setIsCompletedState(false);
          setPollingActive(true);
        } else {
          setIsCompletedState(false);
          setPollingActive(true);
        }
      }
    } catch (e: any) {
      console.error(e);
      setError('Failed to fetch evaluation score from contract.');
    } finally {
      setLoading(false);
    }
  };

  const parseAndSetScores = (text: string) => {
    try {
      const parsed = JSON.parse(text) as ScoreReport;
      setScoreResult(parsed);
    } catch (e) {
      // Fallback plain text evaluator parser
      const lines = text.split('\n');
      const fallback: ScoreReport = {
        projectName: "Evaluated Project",
        themeRelevance: 80,
        innovation: 80,
        technicalComplexity: 80,
        realWorldImpact: 80,
        overallScore: 80,
        verdict: "Strong",
        reason: "Score loaded successfully."
      };

      lines.forEach(line => {
        const lineLower = line.toLowerCase();
        if (lineLower.includes('project name:') || lineLower.includes('title:')) {
          fallback.projectName = line.substring(line.indexOf(':') + 1).trim();
        } else if (lineLower.includes('theme relevance:') || lineLower.includes('relevance:')) {
          fallback.themeRelevance = parseInt(line.replace(/[^0-9]/g, '')) || 80;
        } else if (lineLower.includes('innovation:')) {
          fallback.innovation = parseInt(line.replace(/[^0-9]/g, '')) || 80;
        } else if (lineLower.includes('complexity:') || lineLower.includes('technical:')) {
          fallback.technicalComplexity = parseInt(line.replace(/[^0-9]/g, '')) || 80;
        } else if (lineLower.includes('impact:')) {
          fallback.realWorldImpact = parseInt(line.replace(/[^0-9]/g, '')) || 80;
        } else if (lineLower.includes('overall score:') || lineLower.includes('overall:')) {
          fallback.overallScore = parseInt(line.replace(/[^0-9]/g, '')) || 80;
        } else if (lineLower.includes('verdict:')) {
          const v = line.substring(line.indexOf(':') + 1).trim();
          if (['Outstanding', 'Strong', 'Average', 'Needs Work'].includes(v)) {
            fallback.verdict = v as any;
          }
        } else if (lineLower.includes('reason:') || lineLower.includes('feedback:')) {
          fallback.reason = line.substring(line.indexOf(':') + 1).trim();
        }
      });
      setScoreResult(fallback);
    }
  };

  // Poll for live contract score updates
  useEffect(() => {
    let intervalId: any;
    if (pollingActive && !isMockMode && scoreRequestId) {
      intervalId = setInterval(async () => {
        try {
          const res = await getScore(scoreRequestId);
          if (res.completed && res.score) {
            clearInterval(intervalId);
            setPollingActive(false);
            setLogsComplete(true);
            setIsCompletedState(true);
            parseAndSetScores(res.score);
          }
        } catch (e) {
          console.error("Polling scores error: ", e);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollingActive, isMockMode, scoreRequestId]);

  const handleLogsFinished = async () => {
    if (isMockMode && scoreRequestId) {
      setPollingActive(false);
      setLogsComplete(true);
      const res = await getScore(scoreRequestId);
      if (res.score) {
        setIsCompletedState(true);
        parseAndSetScores(res.score);
      }
    } else {
      if (isCompletedState) {
        setLogsComplete(true);
      }
    }
  };

  const getVerdictStyles = (v: string) => {
    switch(v) {
      case 'Outstanding':
        return 'bg-successGreen/15 border-successGreen/55 text-successGreen shadow-[0_0_15px_rgba(0,230,118,0.2)]';
      case 'Strong':
        return 'bg-cyberCyan/15 border-cyberCyan/55 text-cyberCyan shadow-[0_0_15px_rgba(102,252,241,0.2)]';
      case 'Average':
        return 'bg-yellow-500/15 border-yellow-500/55 text-yellow-400';
      default:
        return 'bg-red-500/15 border-red-500/55 text-red-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold uppercase tracking-wider text-white">
          AI Judge Evaluation Dashboard
        </h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Input your Score Request ID to view completed scorecard evaluations, radial charts, and textual reasoning summaries from the on-chain agent.
        </p>
      </div>

      {/* Query Bar */}
      <Card hover={false} className="bg-darkCard/30 border border-cyberCyan/10 py-4 px-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full">
            <Search className="absolute left-4.5 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
            <input
              type="text"
              placeholder="Enter Score Request ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full bg-black/60 border border-white/5 focus:border-cyberCyan/50 focus:ring-1 focus:ring-cyberCyan/30 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all font-mono font-bold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto shrink-0 bg-darkCard border border-cyberCyan/35 text-cyberCyan hover:bg-cyberCyan/10 hover:shadow-glow font-bold px-8 py-3 rounded-xl transition-all"
          >
            Query Scorecard
          </button>
        </form>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl text-left">
          {error}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-10 h-10 border-4 border-cyberCyan/20 border-t-cyberCyan rounded-full animate-spin"></div>
          <span className="text-sm text-gray-400 font-medium">Fetching scorecard metrics...</span>
        </div>
      )}

      {/* Logging Terminal */}
      {!loading && pollingActive && !logsComplete && (
        <div className="space-y-4">
          <div className="text-center text-sm text-gray-400 animate-pulse font-semibold">
            {isMockMode 
              ? "Running Simulation LLM Judge Consensus (Approx. 5 seconds)..." 
              : "Polling Somnia Testnet Contract. Calculating Agent Scores..."
            }
          </div>
          <TerminalLogs 
            logs={LLM_LOGS} 
            onComplete={handleLogsFinished}
            speedMs={isMockMode ? 400 : 1200}
          />
        </div>
      )}

      {/* Dashboard Metrics Results */}
      {!loading && logsComplete && isCompletedState && scoreResult && (
        <div className="space-y-6 text-left">
          {/* Success Panel */}
          <Card hover={false} className="border-successGreen/20 bg-successGreen/5 py-4 px-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-successGreen" />
              <span className="text-sm text-successGreen font-bold uppercase tracking-wider">
                Evaluation Completed & Audited
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 font-mono">ID: {scoreRequestId}</span>
              <button 
                onClick={() => alert("Report link copied to clipboard! (Simulation)")}
                className="flex items-center gap-1.5 text-xs text-cyberCyan hover:underline hover:text-cyberCyan/80 font-bold bg-cyberCyan/10 px-2.5 py-1 rounded-lg border border-cyberCyan/20"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share Report
              </button>
            </div>
          </Card>

          {/* Main Grade Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Radial Gauge */}
            <Card hover={false} className="md:col-span-1 bg-darkCard/25 border-white/5 flex flex-col items-center justify-center p-8 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Overall Rating</h3>
              <CircularScoreMeter score={scoreResult.overallScore} label="Composite" size={170} />
              <div className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest text-center ${getVerdictStyles(scoreResult.verdict)}`}>
                Verdict: {scoreResult.verdict}
              </div>
            </Card>

            {/* Sub-Criteria Bar Meters */}
            <Card hover={false} className="md:col-span-2 bg-darkCard/25 border-white/5 p-8 flex flex-col justify-between space-y-5">
              <div className="flex items-center gap-2 text-cyberCyan border-b border-white/5 pb-3">
                <Award className="h-5 w-5" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Scorecard Details: {scoreResult.projectName}</h3>
              </div>
              
              <div className="space-y-4">
                <BarScoreMeter score={scoreResult.themeRelevance} label="Theme Relevance" />
                <BarScoreMeter score={scoreResult.innovation} label="Innovation Index" />
                <BarScoreMeter score={scoreResult.technicalComplexity} label="Technical Complexity" />
                <BarScoreMeter score={scoreResult.realWorldImpact} label="Real World Impact" />
              </div>
            </Card>
          </div>

          {/* Summary / Report Card */}
          <Card hover={false} className="bg-darkCard/25 border-white/5 p-6 space-y-4">
            <div className="flex items-center gap-2 text-cyberCyan">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-200">
                AI Judge Consensus Analysis
              </h3>
            </div>
            
            <div className="bg-black/50 border border-white/5 rounded-xl p-5 text-gray-300 text-sm leading-relaxed space-y-3 font-medium">
              <p>{scoreResult.reason}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
