import { useState } from 'react';
import { Web3Provider } from './context/Web3Context';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Submit } from './pages/Submit';
import { Leaderboard } from './pages/Leaderboard';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [parserRequestId, setParserRequestId] = useState<string>('');
  const [scoreRequestId, setScoreRequestId] = useState<string>('');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'home':
        return <Home setActiveTab={setActiveTab} />;
      case 'submit':
        return (
          <Submit 
            setActiveTab={setActiveTab} 
            parserRequestId={parserRequestId}
            setParserRequestId={setParserRequestId}
            scoreRequestId={scoreRequestId}
            setScoreRequestId={setScoreRequestId}
          />
        );
      case 'leaderboard':
        return (
          <Leaderboard 
            setActiveTab={setActiveTab}
            setParserRequestId={setParserRequestId}
            setScoreRequestId={setScoreRequestId}
          />
        );
      default:
        return <Home setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-darkBg text-gray-200 flex flex-col relative cyber-grid">
      {/* Background glowing overlays */}
      <div className="absolute inset-0 radial-glow pointer-events-none"></div>
      <div className="absolute top-0 left-0 right-0 h-[500px] radial-glow-purple pointer-events-none opacity-45"></div>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-grow pb-16 relative z-10">
        {renderActivePage()}
      </main>

      <footer className="border-t border-cyberCyan/5 py-8 text-center text-xs text-gray-500 bg-black/40 relative z-10">
        <p className="tracking-widest uppercase mb-1">
          HackJudge AI © 2026
        </p>
        <p className="font-mono text-[10px] text-gray-600">
          Decentralized Hackathon Evaluation Framework Powered by Somnia AI Agents
        </p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;
