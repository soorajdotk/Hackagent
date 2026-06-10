import fs from 'fs';

const logPath = "C:\\Users\\sudhe\\.gemini\\antigravity-ide\\brain\\f016c7e0-739e-4162-8c01-b68986017512\\.system_generated\\logs\\transcript.jsonl";

const lines = fs.readFileSync(logPath, 'utf8').split('\n');

let count = 0;
for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    if (data.type === "USER_INPUT" && data.content && data.content.toLowerCase().includes("abi")) {
      console.log(`Index: ${data.step_index}, Content preview: ${data.content.substring(0, 200)}...`);
      fs.writeFileSync(`c:\\Users\\sudhe\\OneDrive\\Pictures\\Desktop\\Hackagent\\abi_content_${data.step_index}.txt`, data.content);
      count++;
    }
  } catch(e) {
    // ignore
  }
}
console.log(`Found ${count} inputs containing 'abi'.`);
