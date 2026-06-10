export interface ProjectAnalysis {
  projectName: string;
  description: string;
  features: string[];
  useCases: string[];
}

export interface ScoreReport {
  projectName: string;
  themeRelevance: number;
  innovation: number;
  technicalComplexity: number;
  realWorldImpact: number;
  overallScore: number;
  verdict: 'Outstanding' | 'Strong' | 'Average' | 'Needs Work';
  reason: string;
}

export const MOCK_ANALYSES: Record<string, ProjectAnalysis> = {
  default: {
    projectName: "HackJudge-AI",
    description: "An AI-powered decentralized hackathon evaluation platform built on Somnia L1. Automates repository parsing and provides objective on-chain scoring through LLM agents.",
    features: [
      "Autonomous  Parser Agent",
      "Consensus-based LLM Judge Contract integration",
      "Gas-optimized Somnia L1 smart contracts",
      "Interactive analytics dashboard for organizers and developers"
    ],
    useCases: [
      "Automated evaluation of hackathon project repos at scale",
      "Transparency in community developer voting and reward payouts",
      "Decentralized reputation and credential verification for builders"
    ]
  },
  defi: {
    projectName: "AeroYield",
    description: "A decentralized dynamic yield optimizer on Somnia. It routes liquidity dynamically across lending protocols using on-chain machine learning to maximize APY.",
    features: [
      "On-chain neural network for fee/rate prediction",
      "Smart contract-based auto-compounding",
      "Slippage-protected multi-protocol routing",
      "STT-collateralized flash lending integration"
    ],
    useCases: [
      "Automated passive income optimization for retail yield farming",
      "Risk-mitigated treasury management for DAOs",
      "Liquidity aggregation for emerging L1 token pairs"
    ]
  },
  gaming: {
    projectName: "SomniaVerse Quest",
    description: "A fully on-chain multiplayer RPG taking advantage of Somnia L1's sub-second finality. Game mechanics and battle resolving occur fully within smart contracts.",
    features: [
      "Real-time state synchronization via Somnia MultiStream consensus",
      "ERC-1155 customizable equipment and items",
      "On-chain VRF-based combat resolution",
      "Dynamic token staking rewards for land ownership"
    ],
    useCases: [
      "Web3 core game engine demonstration",
      "Decentralized ownership of in-game gaming assets",
      "Trustless player-vs-player wagering tournaments"
    ]
  }
};

export const MOCK_SCORES: Record<string, ScoreReport> = {
  default: {
    projectName: "HackJudge-AI",
    themeRelevance: 97,
    innovation: 94,
    technicalComplexity: 92,
    realWorldImpact: 95,
    overallScore: 94,
    verdict: "Outstanding",
    reason: "Excellent conceptual execution. The repository has a comprehensive README, well-documented architecture, and addresses a critical pain point in decentralized event management. It makes full, practical use of Somnia's high throughput capabilities."
  },
  defi: {
    projectName: "AeroYield",
    themeRelevance: 89,
    innovation: 91,
    technicalComplexity: 95,
    realWorldImpact: 88,
    overallScore: 91,
    verdict: "Strong",
    reason: "Highly impressive technical design. Using on-chain neural networks for yield optimization showcases deep knowledge of AI and Solidity. The repo has robust unit tests, though real-world deployment requires formal audits to secure user funds."
  },
  gaming: {
    projectName: "SomniaVerse Quest",
    themeRelevance: 92,
    innovation: 88,
    technicalComplexity: 90,
    realWorldImpact: 85,
    overallScore: 89,
    verdict: "Strong",
    reason: "Great exploitation of Somnia's speed and cost efficiency. Building a fully on-chain RPG is a tough task, and this project succeeds in creating low-latency smart contracts that handle player state smoothly. More documentation on the player matchmaking system is needed."
  }
};

export const PARSER_LOGS = [
  "Initializing parsing agent context...",
  "Cloning repository from submitted GitHub URL...",
  "Target file found:",
  "Reading file structure and metadata...",
  "Executing NLP keyword extraction on markdown header trees...",
  "Extracting project title and objective summary...",
  "Parsing codebase feature list and highlight blocks...",
  "Synthesizing extraction categories: [Title, Description, Features, Use Cases]",
  "Formatting output schema into structured string payload...",
  "Writing extraction payload to Somnia agent state...",
  "Updating HackJudgeAgent contract request state...",
  "Parser Agent execution completed successfully!"
];

export const LLM_LOGS = [
  "Initializing LLM Judge agent...",
  "Retrieving project description and features from HackJudgeAgent...",
  "Loading evaluation parameters for specified Hackathon Theme...",
  "Evaluating Theme Relevance (Checking tokenomics, chain utilization, design fit)...",
  "Evaluating Innovation (Assessing novelty of idea, implementation vectors)...",
  "Evaluating Technical Complexity (Analyzing contract structure, API dependencies)...",
  "Evaluating Real World Impact (Assessing user utility, addressable market size)...",
  "Generating final score matrix and verdict classification...",
  "Drafting detailed reasoning and architectural feedback...",
  "Packaging results into on-chain payload format...",
  "Writing evaluation results to HackJudgeLLM scores mapping...",
  "LLM Evaluation complete. Scoring Dashboard updated!"
];

export function getMockAnalysisByUrl(url: string, theme: string): { text: string; parsed: ProjectAnalysis } {
  let type = "default";
  const urlLower = url.toLowerCase();
  const themeLower = theme.toLowerCase();

  if (urlLower.includes("yield") || urlLower.includes("defi") || themeLower.includes("defi") || themeLower.includes("yield")) {
    type = "defi";
  } else if (urlLower.includes("game") || urlLower.includes("rpg") || themeLower.includes("game") || themeLower.includes("gaming")) {
    type = "gaming";
  }

  const parsed = MOCK_ANALYSES[type];
  const text = JSON.stringify(parsed);
  return { text, parsed };
}

export function getMockScoreByAnalysis(analysisStr: string, theme: string): { text: string; parsed: ScoreReport } {
  let type = "default";
  const analysisLower = analysisStr.toLowerCase();
  const themeLower = theme.toLowerCase();

  if (analysisLower.includes("yield") || analysisLower.includes("defi") || themeLower.includes("defi") || themeLower.includes("yield")) {
    type = "defi";
  } else if (analysisLower.includes("game") || analysisLower.includes("rpg") || themeLower.includes("game") || themeLower.includes("gaming")) {
    type = "gaming";
  }

  const parsed = MOCK_SCORES[type];
  const text = JSON.stringify(parsed);
  return { text, parsed };
}

export function parseLLMResult(text: string): ScoreReport {
  // 1. Try JSON parsing
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      return {
        projectName: parsed.projectName || "Evaluated Project",
        themeRelevance: Number(parsed.themeRelevance) || 85,
        innovation: Number(parsed.innovation) || 85,
        technicalComplexity: Number(parsed.technicalComplexity) || 85,
        realWorldImpact: Number(parsed.realWorldImpact) || 85,
        overallScore: Number(parsed.overallScore) || 85,
        verdict: parsed.verdict || "Strong",
        reason: parsed.reason || text
      };
    }
  } catch (e) {
    // ignore
  }

  // 2. Permissive Regex parsing
  const extractField = (pattern: RegExp, defaultVal: string = ''): string => {
    const match = text.match(pattern);
    return match && match[1] ? match[1].trim() : defaultVal;
  };

  // Extract fields
  const projectName = extractField(/\*\*Project\s*Name:\*\*\s*(.*?)(?=\s*\*\*|$)/i, "Evaluated Project");
  
  const themeRelevanceStr = extractField(/\*\*Theme\s*Relevance\s*(?:Score)?\s*(?:\(0-100\))?:\*\*\s*(\d+)/i, 
                            extractField(/Theme\s*Relevance\s*(?:Score)?\s*:\s*(\d+)/i, "85"));
  const innovationStr = extractField(/\*\*Innovation\s*(?:Score)?\s*(?:\(0-100\))?:\*\*\s*(\d+)/i, 
                        extractField(/Innovation\s*(?:Score)?\s*:\s*(\d+)/i, "85"));
  const technicalComplexityStr = extractField(/\*\*Technical\s*Complexity\s*(?:Score)?\s*(?:\(0-100\))?:\*\*\s*(\d+)/i,
                                 extractField(/Technical\s*Complexity\s*(?:Score)?\s*:\s*(\d+)/i, "85"));
  const realWorldImpactStr = extractField(/\*\*Real\s*World\s*Impact\s*(?:Score)?\s*(?:\(0-100\))?:\*\*\s*(\d+)/i,
                             extractField(/Real\s*World\s*Impact\s*(?:Score)?\s*:\s*(\d+)/i, "85"));
  const overallScoreStr = extractField(/\*\*Overall\s*Score\s*(?:\(0-100\))?:\*\*\s*(\d+)/i,
                           extractField(/Overall\s*Score\s*:\s*(\d+)/i, "85"));
  
  const verdict = extractField(/\*\*Verdict:\*\*\s*(.*?)(?=\s*\*\*|$)/i, "Strong");
  
  let reason = extractField(/\*\*Reason:\*\*\s*([\s\S]*)/i, "");
  if (!reason) {
    reason = extractField(/Reason:\s*([\s\S]*)/i, text);
  }

  // Map verdict to the allowed categories: 'Outstanding' | 'Strong' | 'Average' | 'Needs Work'
  const lowerVerdict = verdict.toLowerCase();
  let mappedVerdict: 'Outstanding' | 'Strong' | 'Average' | 'Needs Work' = 'Strong';
  if (lowerVerdict.includes('outstanding')) {
    mappedVerdict = 'Outstanding';
  } else if (lowerVerdict.includes('strong')) {
    mappedVerdict = 'Strong';
  } else if (lowerVerdict.includes('average') || lowerVerdict.includes('good') || lowerVerdict.includes('runner')) {
    mappedVerdict = 'Average';
  } else if (lowerVerdict.includes('needs work') || lowerVerdict.includes('poor')) {
    mappedVerdict = 'Needs Work';
  }

  return {
    projectName,
    themeRelevance: parseInt(themeRelevanceStr) || 85,
    innovation: parseInt(innovationStr) || 85,
    technicalComplexity: parseInt(technicalComplexityStr) || 85,
    realWorldImpact: parseInt(realWorldImpactStr) || 85,
    overallScore: parseInt(overallScoreStr) || 85,
    verdict: mappedVerdict,
    reason: reason || "Evaluation completed successfully."
  };
}
