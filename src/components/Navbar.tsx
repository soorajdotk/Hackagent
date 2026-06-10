import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Shield, Wallet, Cpu, ToggleLeft, ToggleRight, Info } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { 
    isMockMode, 
    setMockMode, 
    account, 
    isCorrectNetwork, 
    isConnecting, 
    connectWallet, 
    switchNetwork 
  } = useWeb3();

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const navItems = [
    { id: 'home', label: 'Overview' },
    { id: 'submit', label: 'Submit Project' },
    { id: 'analysis', label: 'README analysis' },
    { id: 'evaluation', label: 'LLM Evaluation' },
    { id: 'scores', label: 'Score Dashboard' },
    { id: 'leaderboard', label: 'Leaderboard' }
  ];

  return (
    <nav className="border-b border-cyberCyan/10 bg-darkBg/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
        <Shield className="h-8 w-8 text-cyberCyan drop-shadow-[0_0_8px_rgba(102,252,241,0.5)]" />
        <span className="font-extrabold text-xl tracking-wider uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyberCyan to-cyberBlue">
          HackJudge <span className="text-white">AI</span>
        </span>
      </div>

      {/* Tabs */}
      <div className="hidden lg:flex items-center gap-1 bg-darkCard/50 p-1 rounded-xl border border-cyberCyan/5">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-cyberCyan/10 text-cyberCyan shadow-sm border border-cyberCyan/20' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {/* Toggle Mode */}
        <div className="flex items-center gap-2 bg-darkCard p-1.5 px-3 rounded-full border border-cyberCyan/10 text-xs">
          <span className={`font-semibold ${isMockMode ? 'text-cyberCyan' : 'text-gray-500'}`}>Demo Mode</span>
          <button 
            onClick={() => setMockMode(!isMockMode)} 
            className="text-gray-400 hover:text-white transition-colors"
            title="Toggle between Demo Mock Mode and Live Blockchain Mode"
          >
            {isMockMode ? (
              <ToggleRight className="h-6 w-6 text-cyberCyan" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-gray-500" />
            )}
          </button>
          <span className={`font-semibold ${!isMockMode ? 'text-cyberBlue' : 'text-gray-500'}`}>Live RPC</span>
        </div>

        {/* Web3 Connections */}
        {isMockMode ? (
          <div className="flex items-center gap-2 bg-cyberCyan/10 text-cyberCyan px-4 py-2 rounded-xl border border-cyberCyan/30 text-sm font-semibold">
            <Cpu className="h-4 w-4 animate-pulse" />
            Demo Wallet (STT: ∞)
          </div>
        ) : (
          <div>
            {!account ? (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="flex items-center gap-2 bg-gradient-to-r from-cyberCyan to-cyberBlue hover:brightness-110 active:scale-95 text-black px-4 py-2 rounded-xl font-bold text-sm shadow-glow transition-all duration-200"
              >
                <Wallet className="h-4 w-4" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : !isCorrectNetwork ? (
              <button
                onClick={switchNetwork}
                className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl font-bold text-sm transition-all animate-pulse"
              >
                <Info className="h-4 w-4" />
                Switch to Somnia Testnet
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-darkCard px-4 py-2 rounded-xl border border-cyberCyan/20 text-sm font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-successGreen shadow-[0_0_8px_rgba(0,230,118,0.7)]"></span>
                <span className="text-gray-300 font-mono">{truncateAddress(account)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
