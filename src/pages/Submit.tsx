import React, { useState } from 'react';
import { Card } from '../components/Card';
import { useWeb3 } from '../context/Web3Context';
import { Sparkles, Terminal, GitBranch, ArrowRight, ShieldCheck } from 'lucide-react';

interface SubmitProps {
  setActiveTab: (tab: string) => void;
  setParserRequestId: (id: string) => void;
}

export const Submit: React.FC<SubmitProps> = ({ setActiveTab, setParserRequestId }) => {
  const { isMockMode, parserDeposit, submitProject, account, isCorrectNetwork, connectWallet } = useWeb3();

  const [theme, setTheme] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successRequestId, setSuccessRequestId] = useState<string | null>(null);

  // Suggestions for theme
  const suggestions = [
    "AI + Blockchain",
    "DeFi Innovation",
    "On-chain Gaming",
    "Autonomous Agents",
    "SocialFi"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessRequestId(null);

    // Simple validation
    if (!theme.trim()) {
      setError('Please provide a hackathon theme.');
      return;
    }
    if (!githubUrl.trim() || !githubUrl.startsWith('https://github.com/')) {
      setError('Please provide a valid GitHub repository URL (starts with https://github.com/).');
      return;
    }

    setLoading(true);
    try {
      const requestId = await submitProject(theme.trim(), githubUrl.trim());
      setSuccessRequestId(requestId);
      setParserRequestId(requestId);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Transaction failed or rejected.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = () => {
    if (successRequestId) {
      setActiveTab('analysis');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-3xl font-extrabold uppercase tracking-wider text-white">
          Submit Hackathon Project
        </h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Submit your project theme and GitHub repository URL to execute the parser agent. This operation triggers the README analyzer on Somnia.
        </p>
      </div>

      {!successRequestId ? (
        <Card hover={false} className="bg-darkCard/20 border-cyberCyan/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            {/* Theme field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-gray-300 block">
                Hackathon Theme / Topic
              </label>
              <input
                type="text"
                placeholder="e.g. AI + Blockchain, DeFi Innovation"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                disabled={loading}
                className="w-full bg-black/50 border border-cyberCyan/25 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyberCyan focus:ring-1 focus:ring-cyberCyan/50 transition-all font-medium"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTheme(item)}
                    disabled={loading}
                    className="text-xs bg-darkCard border border-white/5 hover:border-cyberCyan/30 text-gray-400 hover:text-cyberCyan px-3 py-1.5 rounded-lg transition-all"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* GitHub URL field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-gray-300 block">
                GitHub Repository URL
              </label>
              <input
                type="text"
                placeholder="e.g. https://github.com/username/project"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                disabled={loading}
                className="w-full bg-black/50 border border-cyberCyan/25 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyberCyan focus:ring-1 focus:ring-cyberCyan/50 transition-all font-medium"
              />
            </div>

            {/* Price indicator card */}
            <div className="bg-darkBg/60 border border-white/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-cyberCyan" />
                <span className="text-sm text-gray-300">Required Deposit Fee</span>
              </div>
              <span className="font-mono font-bold text-cyberCyan text-lg">
                {isMockMode ? '0.00' : parserDeposit} STT
              </span>
            </div>

            {/* Error display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            {!isMockMode && !account ? (
              <button
                type="button"
                onClick={connectWallet}
                className="w-full bg-gradient-to-r from-cyberCyan to-cyberBlue hover:brightness-110 text-black font-extrabold py-3.5 rounded-xl transition-all shadow-glow flex items-center justify-center gap-2"
              >
                Connect Wallet to Submit
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
                    Executing Agent Transaction...
                  </>
                ) : (
                  <>
                    <GitBranch className="h-4 w-4" />
                    Submit to Parser Contract
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
              Project Submitted On-chain
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Your submission transaction has succeeded. The parser agent is now analyzing your GitHub repository README.
            </p>
          </div>

          <div className="bg-black/50 border border-white/5 rounded-xl p-5 max-w-sm mx-auto">
            <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">
              Generated Request ID
            </span>
            <span className="font-mono text-xl text-cyberCyan font-extrabold">
              {successRequestId}
            </span>
          </div>

          <button
            onClick={handleProceed}
            className="flex items-center gap-2 bg-gradient-to-r from-cyberCyan to-cyberBlue hover:brightness-110 text-black font-extrabold px-8 py-3.5 rounded-xl transition-all mx-auto active:scale-95 group shadow-glow"
          >
            Verify README Analysis
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </Card>
      )}
    </div>
  );
};
