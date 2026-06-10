import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { TerminalLogs } from '../components/TerminalLogs';
import { useWeb3 } from '../context/Web3Context';
import { PARSER_LOGS, type ProjectAnalysis } from '../utils/mockData';
import { Search, Play, FileCode, CheckCircle, Globe, Lightbulb } from 'lucide-react';

interface AnalysisProps {
  setActiveTab: (tab: string) => void;
  parserRequestId: string;
  setParserRequestId: (id: string) => void;
  setThemeForLLM: (theme: string) => void;
  setAnalysisForLLM: (analysis: string) => void;
}

export const Analysis: React.FC<AnalysisProps> = ({
  setActiveTab,
  parserRequestId,
  setParserRequestId,
  setThemeForLLM,
  setAnalysisForLLM
}) => {
  const { isMockMode, getAnalysis } = useWeb3();

  const [searchId, setSearchId] = useState(parserRequestId);
  const [loading, setLoading] = useState(false);
  const [pollingActive, setPollingActive] = useState(false);
  const [logsComplete, setLogsComplete] = useState(false);
  const [error, setError] = useState('');
  
  const [analysisResult, setAnalysisResult] = useState<ProjectAnalysis | null>(null);
  const [rawAnalysisText, setRawAnalysisText] = useState('');
  const [isCompletedState, setIsCompletedState] = useState(false);

  // Sync search input with parent state
  useEffect(() => {
    setSearchId(parserRequestId);
    if (parserRequestId) {
      checkStatus(parserRequestId);
    }
  }, [parserRequestId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAnalysisResult(null);
    setIsCompletedState(false);
    setLogsComplete(false);
    setPollingActive(false);

    if (!searchId.trim()) {
      setError('Please provide a valid Request ID.');
      return;
    }

    setParserRequestId(searchId.trim());
    checkStatus(searchId.trim());
  };

  const checkStatus = async (id: string) => {
    setLoading(true);
    try {
      const res = await getAnalysis(id);
      
      if (res.completed && res.analysis) {
        setIsCompletedState(true);
        setLogsComplete(true);
        parseAndSetAnalysis(res.analysis);
      } else {
        // If in Mock Mode, starting checking
        if (isMockMode) {
          // Check if mock submission exists
          const submissions = JSON.parse(localStorage.getItem('hj_mock_submissions') || '{}');
          if (!submissions[id]) {
            setError(`Request ID ${id} not found in local demo database.`);
            setLoading(false);
            return;
          }
          // Submission exists but is not completed yet, start log animation
          setIsCompletedState(false);
          setPollingActive(true);
        } else {
          // In Live Mode: submission not complete, check if pending exists or start polling
          setIsCompletedState(false);
          setPollingActive(true);
        }
      }
    } catch (e: any) {
      console.error(e);
      setError('Failed to fetch analysis state from contract.');
    } finally {
      setLoading(false);
    }
  };

  const parseAndSetAnalysis = (text: string) => {
    setRawAnalysisText(text);
    try {
      const parsed = JSON.parse(text) as ProjectAnalysis;
      setAnalysisResult(parsed);
    } catch (e) {
      // Fallback parser if string is not strict JSON (e.g. key-value plain text)
      const lines = text.split('\n');
      const fallback: ProjectAnalysis = {
        projectName: "Extracted Project",
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
      setAnalysisResult(fallback);
    }
  };

  // Poll for live contract analysis updates
  useEffect(() => {
    let intervalId: any;
    if (pollingActive && !isMockMode && parserRequestId) {
      intervalId = setInterval(async () => {
        try {
          const res = await getAnalysis(parserRequestId);
          if (res.completed && res.analysis) {
            clearInterval(intervalId);
            setPollingActive(false);
            setLogsComplete(true);
            setIsCompletedState(true);
            parseAndSetAnalysis(res.analysis);
          }
        } catch (e) {
          console.error("Polling error: ", e);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollingActive, isMockMode, parserRequestId]);

  const handleLogsFinished = async () => {
    // For Mock Mode simulation completion
    if (isMockMode && parserRequestId) {
      setPollingActive(false);
      setLogsComplete(true);
      
      // Fetch the generated mock data
      const res = await getAnalysis(parserRequestId);
      if (res.analysis) {
        setIsCompletedState(true);
        parseAndSetAnalysis(res.analysis);
      }
    } else {
      // In live mode, we only set logsComplete to true once we receive the event
      if (isCompletedState) {
        setLogsComplete(true);
      }
    }
  };

  const handleProceedToEval = () => {
    if (analysisResult && rawAnalysisText) {
      // Try to read theme from local submissions database if possible
      let theme = "AI + Blockchain"; // default fallback
      if (isMockMode) {
        const submissions = JSON.parse(localStorage.getItem('hj_mock_submissions') || '{}');
        if (submissions[parserRequestId]) {
          theme = submissions[parserRequestId].theme;
        }
      }
      setThemeForLLM(theme);
      setAnalysisForLLM(rawAnalysisText);
      setActiveTab('evaluation');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold uppercase tracking-wider text-white">
          README Parser Agent Analysis
        </h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Query the repository analysis state using the generated Request ID. Displays the extracted code metrics and details from the repository README.
        </p>
      </div>

      {/* Query Bar */}
      <Card hover={false} className="bg-darkCard/30 border border-cyberCyan/10 py-4 px-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative w-full">
            <Search className="absolute left-4.5 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
            <input
              type="text"
              placeholder="Enter Parser Request ID"
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
            Query Analysis
          </button>
        </form>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl text-left">
          {error}
        </div>
      )}

      {/* Loading bar */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-10 h-10 border-4 border-cyberCyan/20 border-t-cyberCyan rounded-full animate-spin"></div>
          <span className="text-sm text-gray-400 font-medium">Fetching contract response...</span>
        </div>
      )}

      {/* Logging Terminal */}
      {!loading && pollingActive && !logsComplete && (
        <div className="space-y-4">
          <div className="text-center text-sm text-gray-400 animate-pulse font-semibold">
            {isMockMode 
              ? "Running Simulation Parser Agent (Approx. 5 seconds)..." 
              : "Polling Somnia Testnet Contract. Running AI Parser..."
            }
          </div>
          <TerminalLogs 
            logs={PARSER_LOGS} 
            onComplete={handleLogsFinished}
            speedMs={isMockMode ? 400 : 1200} // Fast in mock mode
          />
        </div>
      )}

      {/* Extracted Details View */}
      {!loading && logsComplete && isCompletedState && analysisResult && (
        <div className="space-y-6 text-left">
          <Card hover={false} className="border-successGreen/20 bg-successGreen/5 py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-successGreen" />
              <span className="text-sm text-successGreen font-bold uppercase tracking-wider">
                README Agent Completed
              </span>
            </div>
            <span className="text-xs text-gray-400 font-mono">ID: {parserRequestId}</span>
          </Card>

          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card hover={false} className="md:col-span-3 space-y-3 bg-darkCard/25 border-white/5">
              <div className="flex items-center gap-2 text-cyberCyan">
                <FileCode className="h-5 w-5" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Project Name</h3>
              </div>
              <p className="text-2xl font-extrabold text-white uppercase tracking-wide">
                {analysisResult.projectName}
              </p>
            </Card>

            <Card hover={false} className="md:col-span-3 space-y-3 bg-darkCard/25 border-white/5">
              <div className="flex items-center gap-2 text-cyberCyan">
                <Globe className="h-5 w-5" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Extracted Description</h3>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                {analysisResult.description}
              </p>
            </Card>

            {/* Key Features */}
            <Card hover={false} className="md:col-span-1.5 space-y-4 bg-darkCard/25 border-white/5 flex flex-col h-full">
              <div className="flex items-center gap-2 text-neonPurple">
                <CheckCircle className="h-5 w-5" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Extracted Features</h3>
              </div>
              <ul className="space-y-3 flex-grow text-sm text-gray-300">
                {analysisResult.features.length > 0 ? (
                  analysisResult.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2.5 leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-neonPurple mt-2 shrink-0"></span>
                      <span>{feat}</span>
                    </li>
                  ))
                ) : (
                  <span className="text-gray-500 text-xs italic">No explicit features block found in README.</span>
                )}
              </ul>
            </Card>

            {/* Target Use Cases */}
            <Card hover={false} className="md:col-span-1.5 space-y-4 bg-darkCard/25 border-white/5 flex flex-col h-full">
              <div className="flex items-center gap-2 text-cyberBlue">
                <Lightbulb className="h-5 w-5" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Target Use Cases</h3>
              </div>
              <ul className="space-y-3 flex-grow text-sm text-gray-300">
                {analysisResult.useCases.length > 0 ? (
                  analysisResult.useCases.map((uc, i) => (
                    <li key={i} className="flex items-start gap-2.5 leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyberBlue mt-2 shrink-0"></span>
                      <span>{uc}</span>
                    </li>
                  ))
                ) : (
                  <span className="text-gray-500 text-xs italic">No explicit use cases block found in README.</span>
                )}
              </ul>
            </Card>
          </div>

          {/* Action Trigger */}
          <div className="pt-4 flex justify-end">
            <button
              onClick={handleProceedToEval}
              className="flex items-center gap-2 bg-gradient-to-r from-cyberCyan to-cyberBlue hover:brightness-110 text-black font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-glow active:scale-95 group"
            >
              Proceed to AI LLM Evaluation
              <Play className="h-4 w-4 fill-black group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
