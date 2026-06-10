import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { useWeb3, type LeaderboardItem } from '../context/Web3Context';
import { Trophy, Search, Calendar, ArrowRight } from 'lucide-react';

interface LeaderboardProps {
  setActiveTab: (tab: string) => void;
  setParserRequestId: (id: string) => void;
  setScoreRequestId: (id: string) => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  setActiveTab,
  setParserRequestId,
  setScoreRequestId
}) => {
  const { getLeaderboard } = useWeb3();
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    setItems(getLeaderboard());
  }, []);

  const handleRowClick = (id: string) => {
    setScoreRequestId(id);
    setParserRequestId('');
    setActiveTab('submit');
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-400 text-black font-extrabold shadow-[0_0_12px_rgba(250,204,21,0.5)]';
      case 2:
        return 'bg-gray-300 text-black font-extrabold shadow-[0_0_12px_rgba(209,213,219,0.5)]';
      case 3:
        return 'bg-amber-600 text-white font-extrabold shadow-[0_0_12px_rgba(180,83,9,0.5)]';
      default:
        return 'bg-darkBg text-gray-400 border border-white/5 font-semibold';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-successGreen';
    if (score >= 80) return 'text-cyberCyan';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-500';
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const filteredItems = items.filter(item => {
    const term = filterText.toLowerCase();
    return (
      item.projectName.toLowerCase().includes(term) ||
      item.theme.toLowerCase().includes(term) ||
      item.verdict.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-yellow-400/10 border border-yellow-400/35 text-yellow-400 mb-2">
          <Trophy className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-extrabold uppercase tracking-wider text-white">
          Evaluation Leaderboard
        </h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Rankings of all hackathon project repositories analyzed and scored by the HackJudge autonomous AI agents.
        </p>
      </div>

      {/* Filter and stats row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <input
            type="text"
            placeholder="Filter by project name, theme, or verdict..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full bg-darkCard/30 border border-white/5 focus:border-cyberCyan/50 focus:ring-1 focus:ring-cyberCyan/30 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition-all font-medium"
          />
        </div>

        <div className="text-sm text-gray-400 font-semibold uppercase tracking-wider">
          Total Audited: <span className="text-cyberCyan font-bold font-mono">{filteredItems.length}</span>
        </div>
      </div>

      {/* Leaderboard Table Card */}
      <Card hover={false} className="bg-darkCard/10 border border-white/5 overflow-hidden p-0">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-darkCard/40 text-xs font-extrabold uppercase tracking-widest text-gray-400">
                <th className="py-4.5 px-6 text-center w-16">Rank</th>
                <th className="py-4.5 px-6">Project details</th>
                <th className="py-4.5 px-6">Theme</th>
                <th className="py-4.5 px-6 text-center">Score</th>
                <th className="py-4.5 px-6 text-center">Verdict</th>
                <th className="py-4.5 px-6 text-center">Source</th>
                <th className="py-4.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm font-medium">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => handleRowClick(item.id)}
                  >
                    {/* Rank */}
                    <td className="py-4 px-6 text-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mx-auto ${getRankBadge(idx + 1)}`}>
                        {idx + 1}
                      </span>
                    </td>

                    {/* Project details */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-100 uppercase tracking-wide group-hover:text-cyberCyan transition-colors">
                          {item.projectName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(item.timestamp)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Theme */}
                    <td className="py-4 px-6">
                      <span className="text-gray-300 font-semibold">{item.theme}</span>
                    </td>

                    {/* Score */}
                    <td className="py-4 px-6 text-center">
                      <span className={`font-mono font-extrabold text-lg ${getScoreColor(item.overallScore)}`}>
                        {item.overallScore}
                      </span>
                    </td>

                    {/* Verdict */}
                    <td className="py-4 px-6 text-center">
                      <span className="text-xs bg-darkCard border border-white/10 px-3 py-1 rounded-full text-gray-300">
                        {item.verdict}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="py-4 px-6 text-center">
                      <span className="text-[10px] bg-successGreen/10 text-successGreen border border-successGreen/25 px-2 py-0.5 rounded uppercase font-extrabold tracking-wider font-mono">
                        On-Chain L1
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-6 text-right">
                      <button className="text-cyberCyan group-hover:translate-x-1 transition-transform p-1.5 rounded-lg hover:bg-cyberCyan/10">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 italic">
                    No matching hackathon evaluations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
