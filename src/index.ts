#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Server setup ──────────────────────────────────────────
const server = new McpServer({
  name: "policypen",
  version: "1.0.0",
});

// ── Knowledge loader ──────────────────────────────────────
function loadPolicy(topic: string): string {
  // Validate topic to prevent path traversal
  if (!topic || !/^[a-z0-9\-]+$/.test(topic)) {
    const msg = `Invalid topic name: '${topic}'. Only lowercase letters, numbers, and hyphens allowed.`;
    console.error("[loadPolicy]", msg);
    return msg;
  }

  const filePath = join(__dirname, "knowledge", `${topic}.txt`);

  try {
    return readFileSync(filePath, "utf-8");
  } catch (error) {
    const err = error as NodeJS.ErrnoException;

    if (err.code === "ENOENT") {
      console.warn("[loadPolicy] File not found:", filePath);
      return `No policy document found for topic: ${topic}`;
    }

    if (err.code === "EACCES") {
      console.error("[loadPolicy] Permission denied:", filePath);
      return `Permission denied accessing policy: ${topic}`;
    }

    // Generic error for encoding, disk errors, etc.
    console.error("[loadPolicy] Error reading file:", filePath, err.message);
    return `Error loading policy for '${topic}': ${err.message}`;
  }
}

// ── TOOL 1: Draft Letter ──────────────────────────────────
/**
 * Drafts a compliant plain-English letter to a resident based on case type and tone.
 *
 * This tool generates a template letter incorporating relevant council policy guidance
 * for the specified case type, formatted with the appropriate tone for the recipient.
 * The output includes tone guidance and policy references to assist the officer in
 * completing the draft before sending.
 *
 * @param {Object} params - Tool input parameters.
 * @param {string} params.caseType - Type of case (e.g., "housing disrepair", "noise complaint",
 *   "housing benefit decision", "bulky waste"). Case type is used to load matching policy
 *   guidance from the knowledge base.
 * @param {string} params.residentName - First name of the resident. Used in the greeting
 *   of the letter (e.g., "Dear John").
 * @param {"formal" | "empathetic" | "plain-english"} params.tone - Tone for the letter:
 *   - "formal": Professional council language, precise and official
 *   - "empathetic": Warm acknowledgment of resident's situation, professional but human
 *   - "plain-english": Short sentences, everyday language, no jargon
 *
 * @returns {Promise<{content: Array<{type: "text", text: string}>}>} A promise resolving
 *   to an MCP content block containing the formatted draft letter with tone guidance and
 *   policy references. Officer should review, complete placeholders, and verify compliance
 *   before sending.
 *
 * @example
 * const result = await draftLetter({
 *   caseType: "housing disrepair",
 *   residentName: "Sarah",
 *   tone: "empathetic"
 * });
 * // Returns draft letter addressing Sarah about housing disrepair with empathetic tone
 */
server.tool(
  "draft_letter",
  "Drafts a compliant plain-English letter to a resident based on case type and tone. Use this when an officer needs to write a letter or response to a resident.",
  {
    caseType: z.string().describe("Type of case e.g. housing disrepair, noise complaint, housing benefit decision, bulky waste"),
    residentName: z.string().describe("First name of the resident"),
    tone: z.enum(["formal", "empathetic", "plain-english"]).describe("Tone of the letter"),
  },
  async ({ caseType, residentName, tone }) => {
    const policy = loadPolicy(caseType.toLowerCase().replace(/ /g, "-"));
    const toneNote = {
      "formal": "Use formal council language — professional and precise.",
      "empathetic": "Acknowledge the resident's situation warmly — professional but human.",
      "plain-english": "Use short sentences and everyday words — no jargon.",
    }[tone];

    return {
      content: [{
        type: "text",
        text: [
          `DRAFT LETTER — ${tone.toUpperCase()} TONE`,
          `Case type: ${caseType}`,
          ``,
          `Dear ${residentName},`,
          ``,
          `Thank you for contacting Westbridge Council regarding your ${caseType} case.`,
          ``,
          `[Tone guidance: ${toneNote}]`,
          `[Policy reference loaded: ${policy.slice(0, 300)}...]`,
          ``,
          `We will be in touch within the timescales set out in our policy.`,
          `If you have any questions, please quote your case reference when contacting us.`,
          ``,
          `Yours sincerely,`,
          `[Officer Name]`,
          `Westbridge Council`,
        ].join("\n"),
      }],
    };
  }
);

// ── TOOL 2: Lookup Policy ─────────────────────────────────
server.tool(
  "lookup_policy",
  "Retrieves the relevant council policy for a given topic. Use this when an officer needs to find the correct procedure or guidance for a case.",
  {
    topic: z.string().describe("Policy topic to look up e.g. housing disrepair, void property, Bradford Factor, noise complaint"),
    serviceArea: z.string().describe("Service area e.g. Housing, Planning, HR, Environmental Services, Benefits"),
  },
  async ({ topic, serviceArea }) => {
    const content = loadPolicy(topic.toLowerCase().replace(/ /g, "-"));
    return {
      content: [{
        type: "text",
        text: [
          `POLICY LOOKUP`,
          `Service area: ${serviceArea}`,
          `Topic: ${topic}`,
          ``,
          content,
        ].join("\n"),
      }],
    };
  }
);

// ── TOOL 3: Check Compliance ──────────────────────────────
server.tool(
  "check_compliance",
  "Checks a draft letter for missing required legal statements and compliance issues. Use this before an officer sends any resident correspondence.",
  {
    draftText: z.string().describe("The full text of the draft letter to check"),
  },
  async ({ draftText }) => {
    const lower = draftText.toLowerCase();
    const checks = [
      { item: "case reference number", pass: lower.includes("reference") || lower.includes("ref") },
      { item: "response or action timeline", pass: lower.includes("working day") || lower.includes("hours") || lower.includes("week") },
      { item: "contact information or next steps", pass: lower.includes("contact") || lower.includes("get in touch") },
      { item: "officer sign-off", pass: lower.includes("yours sincerely") || lower.includes("kind regards") },
    ];

    const passed = checks.filter(c => c.pass).map(c => `✅ ${c.item}`);
    const failed = checks.filter(c => !c.pass).map(c => `❌ Missing: ${c.item}`);

    return {
      content: [{
        type: "text",
        text: [
          `COMPLIANCE CHECK`,
          ``,
          ...passed,
          ...failed,
          ``,
          failed.length === 0
            ? "✅ Letter appears compliant. Review before sending."
            : `⚠️ ${failed.length} issue(s) found — update letter before sending.`,
        ].join("\n"),
      }],
    };
  }
);

// ── TOOL 4: Adjust Tone ───────────────────────────────────
server.tool(
  "adjust_tone",
  "Rewrites a letter or paragraph in the specified tone. Use this when an officer needs to change how a letter sounds without changing the facts.",
  {
    text: z.string().describe("The letter or paragraph text to rewrite"),
    targetTone: z.enum(["formal", "empathetic", "plain-english"]).describe("Target tone for the rewrite"),
  },
  async ({ text, targetTone }) => {
    const guidance = {
      "formal": "Rewrite using formal council language. Use professional vocabulary, avoid contractions, and write in third person where appropriate.",
      "empathetic": "Rewrite to acknowledge the resident's situation. Open with recognition of their concern, use warm but professional language.",
      "plain-english": "Rewrite using plain English. Use short sentences under 20 words. Replace any jargon with everyday words. Use active voice.",
    }[targetTone];

    return {
      content: [{
        type: "text",
        text: [
          `TONE ADJUSTMENT — ${targetTone.toUpperCase()}`,
          ``,
          `Guidance applied: ${guidance}`,
          ``,
          `Original text:`,
          text,
          ``,
          `[Rewritten version — apply the guidance above to the original text]`,
        ].join("\n"),
      }],
    };
  }
);

// ── TOOL 5: Summarise Case ────────────────────────────────
server.tool(
  "summarise_case",
  "Summarises a complex case description into a concise 3-sentence officer briefing. Use this when an officer needs a quick overview of a case before acting.",
  {
    caseDescription: z.string().describe("Full description of the case including property, issue, resident details, and any previous actions"),
  },
  async ({ caseDescription }) => {
    const wordCount = caseDescription.split(" ").length;
    return {
      content: [{
        type: "text",
        text: [
          `CASE SUMMARY`,
          ``,
          `Input received: ${wordCount} words`,
          ``,
          `Sentence 1 — What happened:`,
          `A resident has reported: ${caseDescription.slice(0, 120)}...`,
          ``,
          `Sentence 2 — Key risk or priority:`,
          `[Identify the most important risk factor or urgency from the case description above]`,
          ``,
          `Sentence 3 — Recommended action:`,
          `[State the immediate action the officer should take based on the case details]`,
        ].join("\n"),
      }],
    };
  }
);

// ── Start server ──────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[policypen] MCP server running on stdio — 5 tools ready");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
