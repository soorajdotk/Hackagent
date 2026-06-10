import React from 'react';
import { Card } from '../components/Card';
import { useWeb3 } from '../context/Web3Context';
import { 
  Play, 
  GitBranch, 
  Cpu, 
  Award, 
  ShieldCheck, 
  ChevronRight
} from 'lucide-react';

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

export const Home: React.FC<HomeProps> = ({ setActiveTab }) => {
  const { isMockMode, connectWallet, account } = useWeb3();

  const stats = [
    { label: "Active Evaluation Agents", val: "2 Autonomous" },
    { label: "Somnia Shannon Chain ID", val: "50312 Testnet" },
    { label: "Average Evaluation Speed", val: "< 10 seconds" },
    { label: "Completed Audits", val: "148 Repositories" }
  ];

  const steps = [
    {
      num: "1",
      title: "Submit Details",
      desc: "Connect MetaMask and submit the Project Theme and GitHub Repository URL.",
      icon: GitBranch,
      color: "text-cyberCyan border-cyberCyan/30"
    },
    {
      num: "2",
      title: "README Extraction",
      desc: "The README parsing agent extracts name, description, features, and use cases.",
      icon: Cpu,
      color: "text-neonPurple border-neonPurple/30"
    },
    {
      num: "3",
      title: "Consensus LLM Judge",
      desc: "The LLM Judge contract receives the theme and extracted code parameters.",
      icon: Award,
      color: "text-cyberBlue border-cyberBlue/30"
    },
    {
      num: "4",
      title: "Score Dashboard",
      desc: "Get objective ratings across 4 core criteria, overall score, and a final verdict.",
      icon: ShieldCheck,
      color: "text-successGreen border-successGreen/30"
    }
  ];

  return (
    <div className="space-y-12 py-6 max-w-7xl mx-auto px-4">
      {/* Hero Header */}
      <div className="text-center relative py-12 overflow-hidden rounded-3xl border border-cyberCyan/15 bg-gradient-to-b from-darkCard/30 to-black/20 px-6">
        <div className="absolute inset-0 radial-glow-purple opacity-70 pointer-events-none"></div>
        <div className="absolute inset-0 radial-glow opacity-30 pointer-events-none"></div>
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyberCyan/10 border border-cyberCyan/35 text-cyberCyan text-xs uppercase font-extrabold tracking-widest mb-6 animate-pulse">
          <Cpu className="h-4.5 w-4.5" />
          Autonomous On-chain Evaluation
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 uppercase leading-tight max-w-4xl mx-auto">
          AI-Powered Decentralized <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyberCyan via-cyberBlue to-neonPurple">
            Hackathon Judging
          </span>
        </h1>

        <p className="text-gray-300 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-8">
          Eliminate subjective bottlenecks. HackJudge AI automatically analyzes project repositories and evaluates them against selected themes using autonomous AI agents on the Somnia Network.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => setActiveTab('submit')}
            className="flex items-center gap-2 bg-gradient-to-r from-cyberCyan to-cyberBlue hover:brightness-110 hover:shadow-glow text-black font-extrabold px-8 py-3.5 rounded-xl transition-all duration-300 active:scale-95 group text-base"
          >
            Submit Project
            <Play className="h-4 w-4 fill-black group-hover:translate-x-1 transition-transform" />
          </button>
          
          {isMockMode && (
            <button
              onClick={() => setActiveTab('leaderboard')}
              className="flex items-center gap-2 bg-darkCard border border-cyberCyan/30 hover:bg-darkCard/80 text-gray-200 font-bold px-8 py-3.5 rounded-xl transition-all"
            >
              View Leaderboard
            </button>
          )}

          {!isMockMode && !account && (
            <button
              onClick={connectWallet}
              className="flex items-center gap-2 bg-neonPurple/20 border border-neonPurple/55 text-white hover:bg-neonPurple/30 font-bold px-8 py-3.5 rounded-xl transition-all"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} hover={false} className="text-center py-5 bg-darkCard/25 border border-white/5">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1">
              {stat.label}
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 text-xl font-bold font-mono">
              {stat.val}
            </span>
          </Card>
        ))}
      </div>

      {/* How it Works Workflow */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold uppercase text-left border-l-4 border-cyberCyan pl-3 tracking-wider text-white">
          Evaluation Pipeline
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const IconComponent = step.icon;
            return (
              <div key={idx} className="relative group">
                <Card hover={true} className="h-full bg-darkCard/40 border border-white/5 flex flex-col justify-between min-h-[200px]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl border ${step.color} bg-black/40`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="text-3xl font-extrabold font-mono text-gray-700 select-none">
                        {step.num}
                      </span>
                    </div>
                    
                    <div className="text-left space-y-1.5">
                      <h3 className="text-lg font-bold text-gray-100 uppercase tracking-wide">
                        {step.title}
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                </Card>
                {idx < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 text-cyberCyan/35 pointer-events-none">
                    <ChevronRight className="h-6 w-6" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Technology Stack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card hover={false} className="text-left space-y-4 border border-cyberCyan/10">
          <div className="flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-cyberCyan" />
            <h3 className="text-xl font-extrabold uppercase tracking-wider text-gray-100">
              Agent Orchestration (Solidity)
            </h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            HackJudge AI utilizes Somnia's decentralized AI agent framework. When a developer submits their code, the platform contract executes transactions that request off-chain compute. Autonomous agents check the repository README, compile metrics, and run consensus models, keeping developer identities secure and operations objective.
          </p>
        </Card>

        <Card hover={false} className="text-left space-y-4 border border-neonPurple/10">
          <div className="flex items-center gap-2">
            <Cpu className="h-6 w-6 text-neonPurple" />
            <h3 className="text-xl font-extrabold uppercase tracking-wider text-gray-100">
              Scalable LLM Consensus
            </h3>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Instead of standard single-prompt LLM evaluation, this platform operates on a consensus model querying specific metrics (relevance, innovation, complexity, and impact). Dynamic scoring logic calculates final results and signs a validation receipt back to the chain, ensuring transparent, immutable, and scalable evaluation parameters.
          </p>
        </Card>
      </div>
    </div>
  );
};
