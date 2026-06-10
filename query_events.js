import { ethers } from 'ethers';

const SOMNIA_RPC_URL = 'https://dream-rpc.somnia.network';
const PARSER_AGENT_ADDRESS = '0x740F96d0fcE396D65BfB02Fe0c877A5fbaB8CB19';
const LLM_JUDGE_ADDRESS = '0x3A25f6D5E9Cb27dDC6Fdd5b78583A589BEb716F2';

async function main() {
    const provider = new ethers.JsonRpcProvider(SOMNIA_RPC_URL);
    
    console.log("Fetching logs for Parser Agent:", PARSER_AGENT_ADDRESS);
    try {
        const logs = await provider.getLogs({
            address: PARSER_AGENT_ADDRESS,
            fromBlock: 'latest', // Or query recent blocks
            toBlock: 'latest'
        });
        console.log(`Found ${logs.length} logs in latest block.`);
    } catch (e) {
        console.error("Error fetching logs:", e.message);
    }

    // Let's check some recent transaction logs on Somnia to find standard event topics
    // We can fetch the transaction history or inspect events if we submit.
    // Wait, let's write a script to query the contract with a few dummy calls or check block numbers.
    const blockNum = await provider.getBlockNumber();
    console.log("Current block number:", blockNum);
    
    // Let's scan logs in the last 100000 blocks
    console.log("Scanning logs in last 100000 blocks for Parser...");
    try {
        const logs = await provider.getLogs({
            address: PARSER_AGENT_ADDRESS,
            fromBlock: blockNum - 100000,
            toBlock: blockNum
        });
        console.log(`Found ${logs.length} logs for Parser:`);
        for (const log of logs) {
            console.log("Log index:", log.index, "topics:", log.topics, "data:", log.data);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }

    console.log("Scanning logs in last 100000 blocks for LLM Judge...");
    try {
        const logs = await provider.getLogs({
            address: LLM_JUDGE_ADDRESS,
            fromBlock: blockNum - 100000,
            toBlock: blockNum
        });
        console.log(`Found ${logs.length} logs for LLM:`);
        for (const log of logs) {
            console.log("Log index:", log.index, "topics:", log.topics, "data:", log.data);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

main();
