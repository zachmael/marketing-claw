#!/usr/bin/env node
/**
 * Marketing Claw — Interactive Setup Wizard
 *
 * Asks 10 questions about your brand, fills all template variables,
 * copies configured files to your OpenClaw workspace, and prints
 * exact CLI commands to register your agents.
 *
 * Usage: node setup.mjs
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question, defaultValue = '') {
  return new Promise(resolve => {
    const hint = defaultValue ? ` (default: ${defaultValue})` : '';
    rl.question(`\n${question}${hint}\n> `, answer => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

function askChoice(question, choices, defaultIndex = 0) {
  const formatted = choices.map((c, i) => `  ${i + 1}. ${c}`).join('\n');
  return new Promise(resolve => {
    rl.question(`\n${question}\n${formatted}\n> `, answer => {
      const num = parseInt(answer.trim(), 10);
      if (num >= 1 && num <= choices.length) {
        resolve(choices[num - 1]);
      } else {
        resolve(choices[defaultIndex]);
      }
    });
  });
}

function banner(text) {
  const line = '─'.repeat(text.length + 4);
  console.log(`\n┌${line}┐`);
  console.log(`│  ${text}  │`);
  console.log(`└${line}┘`);
}

function applyVariables(content, vars) {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}

function findOpenClawWorkspace() {
  // Common workspace locations
  const candidates = [
    path.join(os.homedir(), '.openclaw', 'workspace'),
    path.join(os.homedir(), 'openclaw', 'workspace'),
    path.join(os.homedir(), 'Documents', 'openclaw', 'workspace'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
}

function writeFile(dest, content) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

function readTemplate(name) {
  const p = path.join(__dirname, 'templates', name);
  return fs.readFileSync(p, 'utf8');
}

function readAgentConfig(name) {
  const p = path.join(__dirname, 'agents', `${name}.json`);
  return fs.readFileSync(p, 'utf8');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.clear();
  banner('Marketing Claw — Setup Wizard');
  console.log('\nWelcome! This wizard will configure your 12-agent marketing squad.');
  console.log("It takes about 5 minutes. Let's go.\n");

  // ── Section 1: Brand Basics ──────────────────────────────────────────────

  banner('Section 1: Your Brand');

  const brandName = await ask('What is your brand/company name?');
  const userName = await ask('What is your name? (first name is fine)');
  const userRole = await ask('What is your role/title?', 'Founder');
  const mission = await ask(
    'Describe what you do in one sentence. (e.g. "We help SaaS founders grow without paid ads")'
  );
  const industry = await ask(
    'What industry/niche are you in? (e.g. SaaS, B2B services, e-commerce, creator economy)'
  );

  // ── Section 2: Brand Voice ───────────────────────────────────────────────

  banner('Section 2: Brand Voice & Tone');

  const tone = await askChoice(
    'How would you describe your brand tone?',
    ['casual — friendly and approachable, like talking to a friend', 'professional — polished and authoritative', 'edgy — bold, contrarian, and provocative', 'friendly — warm, encouraging, and supportive'],
    0
  );
  const toneName = tone.split(' —')[0];

  // ── Section 3: Social & Platforms ───────────────────────────────────────

  banner('Section 3: Social & Platforms');

  const socialPlatform = await askChoice(
    'What is your primary social platform?',
    ['X (Twitter)', 'LinkedIn', 'Both X and LinkedIn'],
    0
  );

  const socialHandle = await ask(
    'What is your social handle? (without @ — e.g. "yourhandle")'
  );

  const newsletterPlatform = await askChoice(
    'What newsletter platform do you use?',
    ['Beehiiv', 'Substack', 'ConvertKit', 'Kit (formerly ConvertKit)', 'Mailchimp', 'None'],
    5
  );

  const analyticsTool = await askChoice(
    'What analytics tool do you use?',
    ['Fathom', 'Google Analytics (GA4)', 'Plausible', 'PostHog', 'Mixpanel', 'None'],
    5
  );

  // ── Section 4: Audience & Market ────────────────────────────────────────

  banner('Section 4: Your Audience & Market');

  const icp = await ask(
    'Describe your ideal customer profile (ICP) in 1-2 sentences.\n  (e.g. "B2B SaaS founders at series A companies who are hiring their first marketing hire")'
  );

  const competitors = await ask(
    'List your top 3-5 competitors, comma-separated.\n  (e.g. "HubSpot, Mailchimp, ActiveCampaign")'
  );

  // ── Section 5: Workspace & Timezone ─────────────────────────────────────

  banner('Section 5: Technical Setup');

  const detectedWorkspace = findOpenClawWorkspace();
  const workspacePath = await ask(
    'Path to your OpenClaw workspace directory',
    detectedWorkspace || path.join(os.homedir(), '.openclaw', 'workspace')
  );

  const timezone = await ask(
    'Your timezone (for agent scheduling)',
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York'
  );

  const telegramId = await ask(
    'Your Telegram chat ID (for agent delivery — leave blank to configure later)',
    ''
  );

  const tier = await askChoice(
    'Which tier are you setting up?',
    ['Starter (5 core agents)', 'Pro (all 12 agents)'],
    0
  );
  const tierName = tier.startsWith('Starter') ? 'starter' : 'pro';

  // ── Build Variables Map ──────────────────────────────────────────────────

  const vars = {
    BRAND: brandName,
    USER_NAME: userName,
    ROLE: userRole,
    MISSION: mission,
    INDUSTRY: industry,
    TONE: toneName,
    SOCIAL_PLATFORM: socialPlatform,
    SOCIAL_HANDLE: `@${socialHandle}`,
    NEWSLETTER_PLATFORM: newsletterPlatform,
    ANALYTICS_TOOL: analyticsTool,
    ICP: icp,
    COMPETITORS: competitors,
    TIMEZONE: timezone,
    TELEGRAM_ID: telegramId || 'YOUR_TELEGRAM_CHAT_ID',
    CHAT_ID: telegramId || 'YOUR_TELEGRAM_CHAT_ID',
    DATE: new Date().toISOString().split('T')[0],
    YEAR: new Date().getFullYear().toString(),
  };

  // ── Confirm Before Writing ───────────────────────────────────────────────

  banner('Review Your Setup');
  console.log('\nHere\'s what will be configured:\n');
  console.log(`  Brand:          ${brandName}`);
  console.log(`  Contact:        ${userName} (${userRole})`);
  console.log(`  Mission:        ${mission}`);
  console.log(`  Industry:       ${industry}`);
  console.log(`  Tone:           ${toneName}`);
  console.log(`  Social:         ${socialPlatform} — @${socialHandle}`);
  console.log(`  Newsletter:     ${newsletterPlatform}`);
  console.log(`  Analytics:      ${analyticsTool}`);
  console.log(`  ICP:            ${icp}`);
  console.log(`  Competitors:    ${competitors}`);
  console.log(`  Workspace:      ${workspacePath}`);
  console.log(`  Timezone:       ${timezone}`);
  console.log(`  Tier:           ${tierName === 'starter' ? 'Starter (5 agents)' : 'Pro (12 agents)'}`);
  console.log('');

  const confirm = await ask('Looks good? Type "yes" to proceed or "no" to start over.', 'yes');
  if (confirm.toLowerCase() !== 'yes') {
    console.log('\nSetup cancelled. Run `node setup.mjs` to start over.');
    rl.close();
    process.exit(0);
  }

  // ── Write Configured Templates to Workspace ──────────────────────────────

  banner('Installing Files');
  console.log('\nFilling templates and copying to workspace...\n');

  const templates = ['SOUL.md', 'AGENTS.md', 'USER.md', 'HEARTBEAT.md', 'MEMORY.md'];

  for (const tmpl of templates) {
    try {
      const content = readTemplate(tmpl);
      const filled = applyVariables(content, vars);
      const dest = path.join(workspacePath, tmpl);

      // Back up existing file if present
      if (fs.existsSync(dest)) {
        const backup = `${dest}.backup-${Date.now()}`;
        fs.copyFileSync(dest, backup);
        console.log(`  ⚠ Backed up existing ${tmpl} → ${path.basename(backup)}`);
      }

      writeFile(dest, filled);
      console.log(`  ✓ ${tmpl}`);
    } catch (err) {
      console.log(`  ✗ ${tmpl} — ${err.message}`);
    }
  }

  // Copy playbooks to workspace/playbooks/
  const playbooksDir = path.join(__dirname, 'playbooks');
  const destPlaybooksDir = path.join(workspacePath, 'playbooks');
  if (!fs.existsSync(destPlaybooksDir)) fs.mkdirSync(destPlaybooksDir, { recursive: true });

  for (const f of fs.readdirSync(playbooksDir)) {
    const src = path.join(playbooksDir, f);
    const dest = path.join(destPlaybooksDir, f);
    fs.copyFileSync(src, dest);
    console.log(`  ✓ playbooks/${f}`);
  }

  // Copy dashboards to workspace/dashboards/
  const dashboardsDir = path.join(__dirname, 'dashboards');
  const destDashboardsDir = path.join(workspacePath, 'dashboards');
  if (!fs.existsSync(destDashboardsDir)) fs.mkdirSync(destDashboardsDir, { recursive: true });

  for (const f of fs.readdirSync(dashboardsDir)) {
    const src = path.join(dashboardsDir, f);
    const dest = path.join(destDashboardsDir, f);
    // Fill brand name into dashboards
    const content = fs.readFileSync(src, 'utf8');
    const filled = applyVariables(content, vars);
    fs.writeFileSync(dest, filled, 'utf8');
    console.log(`  ✓ dashboards/${f}`);
  }

  // ── Generate Agent Registration Commands ────────────────────────────────

  const starterAgents = ['pulse', 'hype', 'megaphone', 'mingle', 'ghost'];
  const proAgents = [...starterAgents, 'scout', 'oracle', 'quill', 'judge', 'hunter', 'prospector', 'standup'];
  const activeAgents = tierName === 'starter' ? starterAgents : proAgents;

  // Fill agent configs with variables and save to workspace
  const destAgentsDir = path.join(workspacePath, 'marketing-claw', 'agents');
  if (!fs.existsSync(destAgentsDir)) fs.mkdirSync(destAgentsDir, { recursive: true });

  const registrationCommands = [];
  for (const agentName of activeAgents) {
    try {
      const raw = readAgentConfig(agentName);
      const filled = applyVariables(raw, vars);
      const destPath = path.join(destAgentsDir, `${agentName}.json`);
      writeFile(destPath, filled);
      registrationCommands.push(`openclaw cron add --config "${destPath}"`);
    } catch (err) {
      console.log(`  ✗ agents/${agentName}.json — ${err.message}`);
    }
  }

  // ── Summary ──────────────────────────────────────────────────────────────

  banner('Setup Complete!');

  console.log(`
Marketing Claw is configured. Here's what was installed:

  Workspace:  ${workspacePath}
  Templates:  SOUL.md, AGENTS.md, USER.md, HEARTBEAT.md, MEMORY.md
  Playbooks:  x-engagement.md, social-strategy.md, newsletter.md, outbound-leads.md
  Dashboards: command-center.html, editorial-kanban.html, social-kanban.html
  Agents:     ${activeAgents.length} configured (${tierName} tier)

─────────────────────────────────────────────────
NEXT STEP: Register your agents with OpenClaw
─────────────────────────────────────────────────

Run these commands to activate your agents:

`);

  registrationCommands.forEach(cmd => console.log(`  ${cmd}`));

  console.log(`
─────────────────────────────────────────────────

Or run them all at once:

  ${registrationCommands.join(' && \\\n  ')}

─────────────────────────────────────────────────

Open your dashboards in a browser:
  ${path.join(workspacePath, 'dashboards', 'command-center.html')}
  ${path.join(workspacePath, 'dashboards', 'editorial-kanban.html')}
  ${path.join(workspacePath, 'dashboards', 'social-kanban.html')}

Read the docs:
  ${path.join(__dirname, 'docs', 'QUICKSTART.md')}

Your agents start running on their next scheduled time.
Welcome to your AI marketing squad, ${userName}.
`);

  rl.close();
}

main().catch(err => {
  console.error('\nSetup error:', err.message);
  process.exit(1);
});
