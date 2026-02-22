# HEARTBEAT.md — Proactive Monitoring Checklist

Run through this checklist during heartbeat polls. Each check should take 30–60 seconds. Batch them — don't check everything every time. Rotate based on what you checked last.

## Checklist

### 1. Content Queue Health
- [ ] Check `memory/content-queue.md` — any items overdue?
- [ ] Check if Megaphone has pending posts that haven't been approved
- [ ] Flag if {{BRAND}}'s blog hasn't been updated in 5+ days

### 2. Lead Pipeline
- [ ] Check `memory/lead-pipeline.md` — any hot leads going cold?
- [ ] Flag if a hot lead hasn't been contacted within 24 hours
- [ ] Flag if Prospector or Hunter produced output that needs review

### 3. Social Presence
- [ ] Check if {{SOCIAL_HANDLE}} has had 0 engagement activity in 24+ hours
- [ ] Flag if there are unanswered replies or DMs that are 12+ hours old
- [ ] Note any viral posts in the ICP space that {{BRAND}} should comment on

### 4. Newsletter Status
- [ ] Check if the next newsletter issue is on track for its deadline
- [ ] Flag if Quill produced a draft that needs {{USER_NAME}}'s review
- [ ] Check {{NEWSLETTER_PLATFORM}} for delivery issues or anomalies

### 5. Analytics Signals
- [ ] Quick check on {{ANALYTICS_TOOL}} for any traffic spikes or drops
- [ ] Flag if a piece of content is suddenly getting outsized traffic
- [ ] Flag if a traffic source is dropping significantly

### 6. Brand Mentions & Intelligence
- [ ] Check if Scout produced a daily report — surface any urgent mentions
- [ ] Flag if a competitor made a major announcement
- [ ] Surface any relevant industry news or opportunities

### 7. Agent Health
- [ ] Did all scheduled agents run? Any missed runs?
- [ ] Did Standup produce its daily audit? Any blockers?
- [ ] Any agent errors or failures to note?

---

## Response Protocol

**If nothing needs attention:**
Reply `HEARTBEAT_OK`

**If something needs attention:**
Send a brief message to {{USER_NAME}} ({{TELEGRAM_ID}}) with:
- What you found
- Why it matters
- What you recommend they do

Keep it to 3–5 bullet points max. Lead with the most urgent item.

## Track Your Checks

After running this, update `memory/heartbeat-state.json`:

```json
{
  "lastChecks": {
    "contentQueue": null,
    "leadPipeline": null,
    "social": null,
    "newsletter": null,
    "analytics": null,
    "brandMentions": null,
    "agentHealth": null
  },
  "lastMessageSent": null
}
```

Use Unix timestamps. Rotate: don't check the same thing twice in a row when something else hasn't been checked recently.

## When to Message {{USER_NAME}} Unsolicited

**Do message when:**
- A hot lead is going cold (>24h without contact)
- Competitor made a major move worth responding to
- Traffic spike or drop >20% from baseline
- Viral content opportunity that will expire in <4 hours
- Agent failure affecting critical output

**Don't message when:**
- It's 11 PM – 7 AM {{TIMEZONE}} (unless genuinely urgent)
- Nothing new has happened since the last message
- It's something that can wait for the next scheduled report
- You already messaged in the last 2 hours about non-urgent items

---

*Configured: {{DATE}} | {{BRAND}} Marketing Claw*
