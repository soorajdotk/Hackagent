import React, { useState } from 'react';
import { Card } from '../components/Card';
import { useWeb3 } from '../context/Web3Context';
import { Cpu, Terminal, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

interface EvaluationProps {
  setActiveTab: (tab: string) => void;
  themeForLLM: string;
  setThemeForLLM: (theme: string) => void;
  analysisForLLM: string;
  setAnalysisForLLM: (analysis: string) => void;
  setScoreRequestId: (id: string) => void;
}

export const Evaluation: React.FC<EvaluationProps> = ({
  setActiveTab,
  themeForLLM,
  setThemeForLLM,
  analysisForLLM,
  setAnalysisForLLM,
  setScoreRequestId
}) => {
  const { isMockMode, llmDeposit, analyzeProject, account, isCorrectNetwork, connectWallet } = useWeb3();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successScoreId, setSuccessScoreId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessScoreId(null);

    if (!themeForLLM.trim()) {
      setError('Hackathon theme cannot be empty.');
      return;
    }
    if (!analysisForLLM.trim()) {
      setError('Project analysis payload cannot be empty. Please complete the README parsing step.');
      return;
    }

    setLoading(true);
    try {
      const scoreId = await analyzeProject(themeForLLM.trim(), analysisForLLM.trim());
      setSuccessScoreId(scoreId);
      setScoreRequestId(scoreId);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Transaction failed or rejected.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (successScoreId) {
      setActiveTab('scores');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-3xl font-extrabold uppercase tracking-wider text-white">
          AI LLM Judge Evaluation
        </h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Send the parsed project analysis metrics and the target hackathon theme to the LLM evaluator contract to calculate the final project score report.
        </p>
      </div>

      {!successScoreId ? (
        <Card hover={false} className="bg-darkCard/20 border border-cyberCyan/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            
            {/* Theme Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-gray-300 block">
                Hackathon Theme Context
              </label>
              <input
                type="text"
                placeholder="e.g. AI + Blockchain"
                value={themeForLLM}
                onChange={(e) => setThemeForLLM(e.target.value)}
                disabled={loading}
                className="w-full bg-black/50 border border-cyberCyan/25 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyberCyan focus:ring-1 focus:ring-cyberCyan/50 transition-all font-medium"
              />
            </div>

            {/* Analysis Text Area */}
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-gray-300 block">
                Parsed Project Metrics (JSON String)
              </label>
              <textarea
                rows={8}
                placeholder="Submit your project to the Parser Agent first to extract metrics, or paste custom analysis..."
                value={analysisForLLM}
                onChange={(e) => setAnalysisForLLM(e.target.value)}
                disabled={loading}
                className="w-full bg-black/50 border border-cyberCyan/25 rounded-xl p-4 text-gray-300 focus:outline-none focus:border-cyberCyan focus:ring-1 focus:ring-cyberCyan/50 transition-all font-mono text-xs leading-relaxed"
              />
            </div>

            {/* Price Indicator */}
            <div className="bg-darkBg/60 border border-white/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-cyberCyan" />
                <span className="text-sm text-gray-300">Required Gas Evaluation Fee</span>
              </div>
              <span className="font-mono font-bold text-cyberCyan text-lg">
                {isMockMode ? '0.00' : llmDeposit} STT
              </span>
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Trigger Button */}
            {!isMockMode && !account ? (
              <button
                type="button"
                onClick={connectWallet}
                className="w-full bg-gradient-to-r from-cyberCyan to-cyberBlue hover:brightness-110 text-black font-extrabold py-3.5 rounded-xl transition-all shadow-glow flex items-center justify-center gap-2"
              >
                Connect Wallet to Evaluate
              </button>
            ) : !isMockMode && !isCorrectNetwork ? (
              <div className="text-center text-red-400 text-sm py-2 bg-red-500/5 rounded-lg border border-red-500/10">
                Please switch your wallet to Somnia Testnet first.
              </div>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-cyberCyan to-cyberBlue hover:brightness-110 text-black font-extrabold py-3.5 rounded-xl transition-all shadow-glow flex items-center justify-center gap-2 ${
                  loading ? 'opacity-60 cursor-not-allowed' : 'active:scale-98'
                }`}
              >
                {loading ? (
                  <>
                    <Terminal className="h-4 w-4 animate-spin" />
                    Executing LLM Judge Transaction...
                  </>
                ) : (
                  <>
                    <Cpu className="h-4 w-4" />
                    Trigger LLM Judge Agent
                  </>
                )}
              </button>
            )}
          </form>
        </Card>
      ) : (
        <Card hover={false} className="border-successGreen/30 bg-darkCard/25 p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-successGreen/10 border border-successGreen/40 flex items-center justify-center mx-auto text-successGreen">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold uppercase tracking-wide text-white">
              Evaluation Transaction Sent
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Your project analysis metrics are being graded by the AI Judge consensus committee.
            </p>
          </div>

          <div className="bg-black/50 border border-white/5 rounded-xl p-5 max-w-sm mx-auto">
            <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">
              Score Evaluation ID
            </span>
            <span className="font-mono text-xl text-cyberCyan font-extrabold">
              {successScoreId}
            </span>
          </div>

          <button
            onClick={handleProceed}
            className="flex items-center gap-2 bg-gradient-to-r from-cyberCyan to-cyberBlue hover:brightness-110 text-black font-extrabold px-8 py-3.5 rounded-xl transition-all mx-auto active:scale-95 group shadow-glow"
          >
            Go to Score Dashboard
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </Card>
      )}
    </div>
  );
};
