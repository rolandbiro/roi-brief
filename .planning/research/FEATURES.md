# Feature Research

**Domain:** AI-powered marketing campaign brief assistant (conversational intake)
**Researched:** 2026-02-10
**Confidence:** MEDIUM-HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or amateurish.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Campaign type detection** | Users mention their goal early -- the system must recognize whether it's media buying, PPC, brand, or social and adapt accordingly. Same-questions-for-all feels broken. | MEDIUM | AI detects type from first 2-3 responses, confirms with user. Must handle multi-type (e.g., "PPC + social"). |
| **Type-specific question sets** | Different campaign types need fundamentally different information. Asking GRP from a social media client is nonsensical. | MEDIUM | Each type needs 8-15 specialist questions beyond the shared base. See type breakdown below. |
| **Adaptive deepening** | If a user gives a thin answer ("not sure about budget"), a professional would probe further. Static next-question feels robotic. | MEDIUM | 2-3 levels of follow-up depth. "You mentioned 2M HUF -- does this include agency fee, or is it purely media spend?" |
| **Smart question ordering** | Big picture first (goals, audience), details later (budget split, ad accounts). Current system asks details too early, confusing users. | LOW | Funnel pattern: context -> strategy -> tactics -> logistics. Within each type, specific ordering matters. |
| **Progress indication** | Users need to know how much is left. Without it, they abandon thinking it's endless. | LOW | Show step count (e.g., "5/12 questions") not percentage. Steps may vary per type, so approximate. |
| **Brief summary/review** | Users must see what they said before submitting. Errors in the brief waste agency time. | LOW | Already exists as BriefEditor. Needs to become dynamic (show only type-relevant sections). |
| **One question at a time** | Conversational intake = one focused question per turn. Multiple questions overwhelm. | LOW | Already implemented. Maintain this strictly. |
| **Professional tone with suggested answers** | Users often don't know marketing terminology. Offering options (like "Brand awareness", "Lead generation", "Direct sales") helps them answer faster and more accurately. | LOW | Already exists. Improve by making suggestions type-specific. |
| **Email delivery of completed brief** | The brief must reach both the agency and the client as a formatted document. | LOW | Already exists via SendGrid. Maintain. |
| **Mobile-friendly chat interface** | Many decision-makers first see the link on mobile. Chat must work well on small screens. | LOW | Already responsive. Verify touch targets, scroll behavior. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but make it feel remarkably professional.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Dynamic report sections** | The generated brief only shows sections relevant to the campaign type. A social media brief shows platform strategy, not GRP tables. | MEDIUM | Requires flexible BriefData schema. Each type adds/removes sections. Multi-type briefs show union of relevant sections. |
| **Intelligent skip logic** | If a user already revealed their budget while discussing goals ("We have about 5M for Q2"), don't ask again. Extract implicit info from conversation context. | HIGH | LLM must track what's been answered across the conversation. Reduces questions from 15+ to 8-10 for well-prepared clients. |
| **Multi-campaign-type support** | A single brief can cover multiple types (e.g., "We need performance + social media"). The assistant handles both sets of specialist questions seamlessly. | HIGH | Needs careful UX: detect overlap, avoid duplicate questions, merge report sections. |
| **Contextual explanations** | When asking "What's your target ROAS?", explain what ROAS means and why it matters -- in plain Hungarian, not jargon soup. | LOW | Already partially implemented with the lightbulb emoji pattern. Deepen for specialist terms per type. |
| **Quick-reply buttons** | Offer clickable buttons for common answers (e.g., platform selection: Facebook, Instagram, TikTok, YouTube, LinkedIn). Reduces typing, speeds completion. | MEDIUM | Requires frontend change: render suggestion chips the user can click. Hybrid: buttons + free text. |
| **Brief quality scoring** | After completion, show a "brief completeness" indicator. "Your brief is 85% complete -- adding competitor info would help us prepare a better proposal." | MEDIUM | Encourages users to fill gaps without blocking submission. Separate from progress -- this is about content quality. |
| **Conversation branching with explanation** | When the system branches to type-specific questions, briefly explain why: "Since you're focusing on media buying, I have a few specific questions about media planning..." | LOW | Simple prompt engineering. Makes the transition feel intentional, not random. |
| **PDF download for the client** | Let the user download their own brief as a branded PDF immediately, not just via email. | LOW | Already have @react-pdf/renderer. Add a download button alongside email send. |
| **Agency-side enrichment notes** | The AI adds internal notes for the agency: "Client mentioned tight timeline -- consider simplified media mix" or "Budget suggests mid-tier campaign." | MEDIUM | Separate section in the agency-facing brief (not visible to client). Adds real value for account managers. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems in this specific context.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **User accounts / login** | "Save progress, return later" | Massive friction for a first-touch intake tool. Nobody creates an account to fill out a brief. Kills conversion rate. Anonymous sessions outperform auth for intake. | Session-based auto-save to localStorage. If they close and reopen the same link within 24h, state restores. No login needed. |
| **PDF/document upload** | "Let me upload our existing brief" | Scope creep into document parsing, format handling, extraction errors. The v2 vision is chat-first intake, not document processing. The v1 had this and it added complexity without clear value for the intake use case. | If user mentions they have a brief, the AI says: "Great -- you can share details from your existing brief in our conversation, and I'll structure it properly." |
| **Real-time collaboration** | "Multiple stakeholders fill it together" | Adds massive state management complexity (conflict resolution, presence, permissions). For a pre-sales intake, one person fills it out. | Single-session completion. The shareable review link (post-completion) lets others comment via email. |
| **Conversation history / drafts** | "I want to come back to this later" | Requires persistent storage, session management, and raises privacy questions (GDPR for EU). For a 7-10 minute conversation, abandonment is better solved by reducing friction, not adding persistence. | Keep conversations short enough (target: 7-10 min) that users complete in one sitting. localStorage backup for accidental tab closes. |
| **Full analytics dashboard** | "Track how many briefs, completion rates" | Over-engineering for current scale. Build when there's volume to analyze. | Simple server-side logging (brief count, completion flag) to a webhook or Google Sheet. Defer dashboard to v3. |
| **White-label / multi-agency** | "Other agencies could use this too" | Premature abstraction. Build for ROI Works first. Multi-tenant adds auth, billing, branding config. | Hardcode ROI Works branding. If demand appears later, refactor. |
| **Voice input** | "Let users speak their answers" | Browser speech APIs are unreliable in Hungarian. Transcription quality for marketing jargon is poor. Adds complexity for marginal gain. | Text input only. Hungarian text input is reliable and expected. |
| **Auto-generated campaign proposals** | "AI should also generate the proposal" | Brief intake != proposal generation. Mixing them confuses the product's purpose and creates unrealistic client expectations about what they'll get. | Clear scope: "This creates a brief. Our team uses this brief to prepare your custom proposal." |

## Campaign Type Question Matrix

What each campaign type needs beyond the shared base questions.

### Shared Base (All Types)
- Company info (name, contact, email, phone)
- Campaign goals / objectives
- Target audience (demographics, psychographics)
- Timeline (start, end, key dates)
- Budget (total, constraints)
- Competitors
- Previous campaign experience

### Media Buying Specific
| Question Area | Why Needed | Example Questions |
|--------------|------------|-------------------|
| Media types | Determines planning approach | TV, radio, outdoor, print, digital display, cinema |
| GRP / reach / frequency targets | Core media planning metrics | "Do you have target GRP? What reach percentage do you aim for?" |
| Geographic coverage | Affects media selection | National, regional, city-specific |
| Seasonality / flighting | Media scheduling pattern | Continuous, pulsing, seasonal burst |
| Existing media relationships | Affects buying strategy | Current media contracts, preferred publishers |
| Viewability / brand safety | Quality parameters | Minimum viewability %, brand safety categories |
| OTS (Opportunity to See) | Exposure expectations | Target frequency per person |

### Performance / PPC Specific
| Question Area | Why Needed | Example Questions |
|--------------|------------|-------------------|
| ROAS / CPA targets | Core performance metrics | "What return do you expect per forint spent?" |
| Landing pages | Conversion infrastructure | Existing pages, need new ones, A/B testing |
| Ad accounts | Technical setup | Existing Google/Meta accounts, access sharing |
| Conversion tracking | Measurement readiness | GA4, Meta Pixel, server-side tracking |
| Creative assets | Ad production needs | Existing creatives, need new ones, formats |
| Product feed | Shopping campaigns | Feed availability, product count, update frequency |
| Historical performance | Benchmark setting | Previous ROAS, CPA, best-performing campaigns |

### Brand / Awareness Specific
| Question Area | Why Needed | Example Questions |
|--------------|------------|-------------------|
| Brand positioning | Strategic foundation | Current positioning, desired positioning, USP |
| Brand lift goals | Measurement framework | Awareness %, recall, favorability targets |
| Tone of voice | Creative direction | Formal/casual, emotional/rational, humor/serious |
| Key messages | Communication hierarchy | Primary message, supporting messages, proof points |
| Competitive positioning | Differentiation | How to stand out from specific competitors |
| Visual identity | Creative constraints | Existing brand guidelines, flexibility level |
| Measurement approach | Success definition | Pre/post surveys, brand tracking, recall studies |

### Social Media Specific
| Question Area | Why Needed | Example Questions |
|--------------|------------|-------------------|
| Organic vs paid split | Strategy framing | Pure paid, organic + paid boost, community building |
| Platform selection | Resource allocation | Facebook, Instagram, TikTok, YouTube, LinkedIn, X |
| Content types | Production planning | Static, video, stories, reels, carousels, live |
| Posting frequency | Resource planning | Daily, 3x/week, campaign-burst |
| Community management | Scope definition | Comment moderation, DM responses, crisis protocol |
| Influencer involvement | Partnership planning | Micro/macro, content collaboration, whitelisting |
| Existing social presence | Starting point | Current followers, engagement rate, content history |
| UGC strategy | Content sourcing | User-generated content usage, rights, incentives |

## Feature Dependencies

```
[Campaign Type Detection]
    |
    +--requires--> [Type-Specific Question Sets]
    |                   |
    |                   +--requires--> [Flexible BriefData Schema]
    |                                       |
    |                                       +--enables--> [Dynamic Report Sections]
    |                                       |
    |                                       +--enables--> [Dynamic BriefEditor]
    |
    +--enhances--> [Smart Question Ordering]
    |
    +--enhances--> [Progress Indication]

[Adaptive Deepening]
    |
    +--enhances--> [Intelligent Skip Logic]
    |
    +--requires--> [Conversation State Tracking] (prompt-level)

[Multi-Campaign-Type Support]
    |
    +--requires--> [Campaign Type Detection]
    +--requires--> [Type-Specific Question Sets]
    +--requires--> [Flexible BriefData Schema]

[Quick-Reply Buttons]
    |
    +--requires--> [Chat UI Changes] (frontend)
    +--enhances--> [Progress / Completion Rate]

[Brief Quality Scoring]
    |
    +--requires--> [Flexible BriefData Schema]
    +--enhances--> [Brief Summary/Review]

[PDF Download]
    |
    +--requires--> [Dynamic Report Sections]
    +--uses--> [@react-pdf/renderer] (already exists)
```

### Dependency Notes

- **Flexible BriefData Schema is the foundation**: Almost everything depends on moving from a fixed 13-field structure to a type-aware, extensible schema. This must come first.
- **Campaign Type Detection enables specialization**: Without knowing the type, you can't specialize questions, report sections, or quality scoring.
- **Adaptive Deepening is prompt-only**: No code dependency, just sophisticated prompt engineering. Can be developed in parallel with schema work.
- **Multi-Type is the hardest feature**: It requires all single-type features to work first, plus merge logic for overlapping questions and report sections.

## MVP Definition

### Launch With (v1 -- this milestone)

Minimum viable improvement over current system.

- [ ] **Flexible BriefData schema** -- Foundation for everything else. Type-aware fields replacing the fixed 13-field structure.
- [ ] **Campaign type detection** -- AI identifies type(s) from first 2-3 exchanges, confirms with user.
- [ ] **Type-specific question sets** -- Each of the 4 types gets its specialist questions. Single-type flow first.
- [ ] **Smart question ordering** -- Funnel pattern: context -> strategy -> tactics -> logistics.
- [ ] **Adaptive deepening** -- AI probes thin answers, skips where info already emerged.
- [ ] **Dynamic report sections** -- Brief output only shows relevant sections for the detected type.
- [ ] **Dynamic BriefEditor** -- Editor adapts to show type-relevant fields.
- [ ] **Progress indication** -- Show approximate step position in the conversation.

### Add After Validation (v1.x)

Features to add once core type-specific flow is working and validated with real users.

- [ ] **Multi-campaign-type support** -- Trigger: users frequently say "we need both performance and social". Build when single-type is solid.
- [ ] **Quick-reply buttons** -- Trigger: completion rate data shows users struggle with text-heavy answers. Chip-style suggestions for common answers.
- [ ] **Brief quality scoring** -- Trigger: agency reports that briefs are frequently incomplete. Visual indicator encouraging better responses.
- [ ] **PDF download for client** -- Trigger: users ask for it (currently email-only). Low effort with existing @react-pdf/renderer.
- [ ] **Agency-side enrichment notes** -- Trigger: account managers confirm they'd use AI-generated intake notes.
- [ ] **localStorage session backup** -- Trigger: abandonment rate data shows users accidentally losing progress.

### Future Consideration (v2+)

Features to defer until product-market fit is established with ROI Works.

- [ ] **Conversation analytics** -- Defer until volume justifies it. Start with simple logging.
- [ ] **A/B testing question flows** -- Defer until there's enough data to optimize.
- [ ] **API / webhook integration** -- Defer until CRM integration need is validated.
- [ ] **Template management UI** -- Defer until non-developer team members need to update question logic.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Flexible BriefData schema | HIGH | MEDIUM | **P1** |
| Campaign type detection | HIGH | LOW | **P1** |
| Type-specific question sets | HIGH | MEDIUM | **P1** |
| Smart question ordering | HIGH | LOW | **P1** |
| Adaptive deepening | HIGH | MEDIUM | **P1** |
| Dynamic report sections | HIGH | MEDIUM | **P1** |
| Dynamic BriefEditor | HIGH | MEDIUM | **P1** |
| Progress indication | MEDIUM | LOW | **P1** |
| Multi-type support | MEDIUM | HIGH | **P2** |
| Quick-reply buttons | MEDIUM | MEDIUM | **P2** |
| Brief quality scoring | MEDIUM | MEDIUM | **P2** |
| PDF download | MEDIUM | LOW | **P2** |
| Agency enrichment notes | MEDIUM | MEDIUM | **P2** |
| localStorage backup | LOW | LOW | **P2** |
| Conversation analytics | LOW | MEDIUM | **P3** |
| A/B testing flows | LOW | HIGH | **P3** |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | HolaBrief | Briefly | Foreplay Briefs | The Brief AI | **ROI Brief v2** |
|---------|-----------|---------|-----------------|-------------|------------------|
| Brief creation method | Interactive templates with exercises | Guided form with AI triage | Modular drag-and-drop | AI agents + templates | **Conversational AI chat** |
| Adaptive questioning | No (static templates) | Partial (AI pre-checks) | No | No | **Yes (core differentiator)** |
| Campaign type specialization | Generic templates | Generic workflows | Performance-focused only | Ad creation focused | **4 specific types with specialist questions** |
| AI involvement | None (template-only) | AI for validation + enrichment | AI for ad analysis | AI for ad creation | **AI drives the entire intake** |
| Client experience | Fill form (no account needed) | Internal team tool | Internal team tool | Internal team tool | **Guided conversation (no account needed)** |
| Multi-language | English-focused | English | English | Multi-language ads | **Hungarian (specific market advantage)** |
| Target user | Agency + client collaboration | Internal creative ops teams | Performance marketers | Ad teams | **Prospective clients (pre-sale)** |
| Pricing | From $19/mo | Enterprise pricing | From $59/mo | From $49/mo | **Free for clients (agency tool)** |

### Our Unique Position

Most competitors build tools for internal agency teams. ROI Brief v2 is unique because:
1. **Client-facing**: The end user is the prospective client, not the agency team
2. **Conversational**: Chat-based intake vs form-based templates
3. **Pre-sale**: Happens before any contract, reducing friction to near-zero
4. **Adaptive**: AI adapts in real-time vs static templates
5. **Hungarian market**: No competitor serves Hungarian-language marketing brief intake

This positioning means our "competition" is really just email + phone calls + generic Google Forms -- not the sophisticated brief tools above.

## Sources

- [Uplifted.ai - Top 10 Creative Brief Tools 2026](https://www.uplifted.ai/blog/post/top-10-creative-brief-tools-for-2026-from-ai-collaboration-to-performance-driven-workflows) -- MEDIUM confidence (single commercial source)
- [HolaBrief](https://www.holabrief.com/) -- MEDIUM confidence (official site, feature claims verified)
- [Briefly](https://trybriefly.com/) -- MEDIUM confidence (official site)
- [Foreplay Briefs](https://www.foreplay.co/briefs) -- MEDIUM confidence (official site)
- [The Brief AI](https://www.thebrief.ai) -- MEDIUM confidence (official site)
- [AgencyAnalytics - 37 Client Onboarding Questions](https://agencyanalytics.com/blog/client-onboarding-questionnaire) -- HIGH confidence (practitioner-written, well-sourced)
- [Sendible - 42 Social Media Questions](https://www.sendible.com/insights/social-media-questionnaire) -- HIGH confidence (practitioner-written)
- [Leadsie - 27 Agency Onboarding Questions](https://www.leadsie.com/blog/client-onboarding-questionnaire) -- HIGH confidence (multiple agency input)
- [Ideta - Conversational Form Statistics](https://www.ideta.io/blog-posts-english/conversational-form-beats-web-form) -- MEDIUM confidence (vendor data)
- [Smashing Magazine - Conversational AI UX Guide](https://www.smashingmagazine.com/2024/07/how-design-effective-conversational-ai-experiences-guide/) -- HIGH confidence (respected publication)
- [PatternFly - Conversation Design](https://www.patternfly.org/patternfly-ai/conversation-design/) -- HIGH confidence (design system docs)
- [MindTheProduct - Chatbot UX Best Practices](https://www.mindtheproduct.com/deep-dive-ux-best-practices-for-ai-chatbots/) -- MEDIUM confidence

---
*Feature research for: AI-powered marketing campaign brief assistant*
*Researched: 2026-02-10*
