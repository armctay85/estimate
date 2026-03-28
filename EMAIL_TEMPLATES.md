# Email Templates

## Welcome Email

**Subject:** Your EstiMate account is ready 🚀

```
Hi {{firstName}},

Welcome to EstiMate - the construction cost platform that's replacing CostX for Australian QSs.

**Here's what you can do right now:**

1. **Upload your first PDF** - Try our takeoff engine on any architectural drawing
2. **Check the cost database** - 680+ benchmark rates from real tenders
3. **Validate a quote** - Upload a contractor quote and see the trust score

**Quick tip:** Start with the Kmart Gladstone dataset to see how real tender data looks in the platform.

→ Start Estimating: https://estimate-app.com/dashboard

Questions? Reply to this email.

Cheers,
The EstiMate Team

---
P.S. Join our QS community: https://discord.gg/estimate
```

---

## Quote Validation Results

**Subject:** Your quote validation is ready - Trust Score: {{trustScore}}/100

```
Hi {{firstName}},

We've analyzed {{contractorName}}'s quote for {{projectName}}.

**Trust Score: {{trustScore}}/100**

{{#if highVariance}}
⚠️ We found {{varianceCount}} items significantly above benchmark:
{{#each highVarianceItems}}
- {{description}}: {{actualRate}} vs {{benchmarkRate}} benchmark ({{variance}}% higher)
{{/each}}

**Recommendation:** Negotiate on these items or request breakdown.
{{/if}}

{{#if lowVariance}}
✅ All items within acceptable range. This quote looks fair.
{{/if}}

View full analysis: https://estimate-app.com/quotes/{{quoteId}}

---
Want to validate more quotes? Upgrade to Pro:
https://estimate-app.com/upgrade
```

---

## Weekly Summary

**Subject:** Your week at EstiMate - {{estimateCount}} estimates created

```
Hi {{firstName}},

Here's your weekly EstiMate summary:

📊 **This Week:**
- {{estimateCount}} estimates created
- {{savedAmount}} saved through quote validation
- {{newRates}} new rates added to your regional database

🏆 **Top Benchmarks Used:**
{{#each topElements}}
{{index}}. {{name}} - Used {{count}} times
{{/each}}

💡 **Trending Up:**
{{trendingElement}} rates increased {{trendPercent}}% this week

→ Continue estimating: https://estimate-app.com/dashboard
```

---

## Trial Expiring

**Subject:** Your trial expires in {{days}} days - Don't lose your data

```
Hi {{firstName}},

Your EstiMate Pro trial expires in {{days}} days.

**What you'll lose:**
- Access to quote validator
- Regional cost comparisons
- Tender analyzer
- Team collaboration features

**What you keep (Free plan):**
- 3 estimates/month
- Basic cost database
- PDF takeoffs

**Upgrade now:** https://estimate-app.com/upgrade

Use code EARLYADOPTER for 20% off your first year.

→ Upgrade to Pro: https://estimate-app.com/upgrade
```

---

## New Feature Announcement

**Subject:** NEW: {{featureName}} is now live 🎉

```
Hi {{firstName}},

We've just shipped {{featureName}} - and it's going to change how you {{benefit}}.

**What's new:**
{{featureDescription}}

**Try it now:**
→ {{ctaLink}}

Watch the 2-min demo: {{videoLink}}

---
As always, reply with feedback - we build what you need.

The EstiMate Team
```

---

## Password Reset

**Subject:** Reset your EstiMate password

```
Hi {{firstName}},

Click the link below to reset your password:

→ Reset Password: {{resetLink}}

This link expires in 1 hour.

If you didn't request this, ignore this email.

---
EstiMate Security Team
```
