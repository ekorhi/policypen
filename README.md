# 🖊️ PolicyPen
### AI-Powered Correspondence Assistant for Local Government

**Microsoft Agents League Hackathon 2026 | Creative Apps Track**

[![Track](https://img.shields.io/badge/Track-Creative%20Apps-blue)]()
[![Built with](https://img.shields.io/badge/Built%20with-GitHub%20Copilot-green)]()
[![MCP Server](https://img.shields.io/badge/MCP-Server-orange)]()

---

## 🎬 Demo Video

**[▶ Watch PolicyPen in Action](YOUR_YOUTUBE_LINK_HERE)**

---

## What It Does

PolicyPen is an MCP (Model Context Protocol) server that gives AI assistants 5 tools for drafting compliant, plain-English correspondence for local government officers.

Council officers spend hours writing letters to residents — searching for the right policy, checking legal requirements, adjusting tone for different situations. PolicyPen brings that knowledge directly into the developer's workflow via GitHub Copilot, making compliant correspondence fast and consistent.

---

## The Problem

Local government officers write hundreds of letters every week — housing disrepair responses, benefit decisions, noise complaint acknowledgements. Each letter must:

- Reference the correct policy and procedure
- Include required legal statements
- Use appropriate tone for the resident's situation
- Meet statutory timeframes

Getting this wrong creates legal risk. Getting it right takes time officers do not have.

---

## How It Works

PolicyPen runs as a local MCP server connected to GitHub Copilot Chat or any MCP-compatible client. An officer or developer types a natural language request and PolicyPen's tools respond with policy-grounded, structured output.

```
"Draft a formal letter to James about a housing disrepair complaint"
→ PolicyPen retrieves HOU-POL-001 v4.0
→ Returns a compliant letter with correct structure and tone
```

---

## The 5 Tools

| Tool | What It Does |
|---|---|
| `draft_letter` | Drafts a compliant plain-English letter from case type and tone |
| `lookup_policy` | Retrieves the relevant council policy for a given topic |
| `check_compliance` | Flags missing legal statements in a draft letter |
| `adjust_tone` | Rewrites text in formal, empathetic, or plain-English tone |
| `summarise_case` | Condenses a complex case into a 3-sentence officer briefing |

---

## Tech Stack

- **MCP Server** — Node.js + TypeScript
- **MCP SDK** — `@modelcontextprotocol/sdk` v1.29.0
- **Schema validation** — Zod v4
- **Knowledge base** — 5 local government policy text files
- **Transport** — stdio (local)
- **Built with** — GitHub Copilot Chat in VS Code

---

## Knowledge Base

5 synthetic policy documents covering key local government service areas:

| File | Policy |
|---|---|
| `housing-disrepair.txt` | Housing Disrepair Complaint Procedure (HOU-POL-001 v4.0) |
| `noise-complaint.txt` | Noise Complaint Procedure (ENV-POL-001 v4.0) |
| `housing-benefit.txt` | Housing Benefit Assessment Guide (BEN-POL-001 v6.0) |
| `grievance.txt` | Grievance Policy and Procedure (HR-POL-001 v5.0) |
| `bulky-waste.txt` | Bulky Waste Collection Policy (ENV-POL-002 v2.0) |

> All documents are synthetic and created for demonstration purposes. Westbridge Council is a fictional organisation.

---

## How GitHub Copilot Built This

This project was built using GitHub Copilot Chat in VS Code. Copilot assisted with:

- Generating the MCP server boilerplate and tool registrations
- Writing Zod schema definitions for each tool's input parameters
- Suggesting the knowledge file loading pattern using `fileURLToPath` and `import.meta.url`
- Debugging TypeScript configuration issues with ESM module resolution
- Writing the compliance check logic with pattern matching

Every function in `src/index.ts` was written with Copilot suggestions — reviewed, adjusted, and accepted by the developer.

---

## Setup Instructions

### Prerequisites

- Node.js v18 or higher
- npm

### Install

```bash
git clone https://github.com/YOUR_USERNAME/policypen
cd policypen
npm install
```

### Build

```bash
npm run build
```

This compiles TypeScript to `dist/`. Then copy the knowledge files:

```bash
# Windows
Copy-Item -Recurse src\knowledge dist\knowledge

# macOS / Linux
cp -r src/knowledge dist/knowledge
```

### Run with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

Open `http://localhost:6274` in your browser to see all 5 tools and test them interactively.

### Connect to VS Code Copilot

Create `.vscode/mcp.json` in the project root:

```json
{
  "servers": {
    "policypen": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/policypen/dist/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/policypen` with your actual path. Open the file in VS Code — click the **Start** button that appears above the JSON.

---

## Example Usage

### Draft a Letter

```
Tool: draft_letter
caseType: housing disrepair
residentName: James
tone: formal
```

Returns a compliant letter referencing HOU-POL-001 v4.0 with correct structure and tone guidance.

### Check Compliance

```
Tool: check_compliance
draftText: Dear James, thank you for your query.
```

Returns:
```
❌ Missing: case reference number
❌ Missing: response or action timeline
❌ Missing: contact information or next steps
❌ Missing: officer sign-off
⚠️ 4 issue(s) found — update letter before sending.
```

### Lookup Policy

```
Tool: lookup_policy
topic: noise complaint
serviceArea: Environmental Services
```

Returns the full Noise Complaint Procedure including statutory nuisance threshold and out-of-hours service details.

---

## Social Impact

Better letters mean better outcomes for residents. When officers can draft compliant, clear correspondence quickly:

- Vulnerable residents receive accurate guidance sooner
- Legal risk from non-compliant letters is reduced
- Officers spend time helping people rather than searching for policy wording

PolicyPen — better letters for public service.

---

## Developer

**Christopher Ekorhi** — Power Platform Developer
Microsoft Agents League Hackathon 2026 | Creative Apps Track

---

## Disclaimer

All policy documents are synthetic and created for demonstration purposes only. Westbridge Council is a fictional organisation. No real council data or personally identifiable information has been used. See [DISCLAIMER.md](DISCLAIMER.md) for full details.
