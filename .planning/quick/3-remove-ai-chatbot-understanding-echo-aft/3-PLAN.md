---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [lib/prompts/base.ts]
autonomous: true

must_haves:
  truths:
    - "A chatbot NEM ismétli vissza megértését minden válasz után"
    - "A chatbot rövid nyugtázás után azonnal a következő kérdésre tér"
  artifacts:
    - path: "lib/prompts/base.ts"
      provides: "BASE_PROMPT szabályok szekció bővítése"
      contains: "NE ismételd vissza"
  key_links:
    - from: "lib/prompts/base.ts"
      to: "app/api/chat/route.ts"
      via: "system prompt paraméter"
      pattern: "systemPrompt.*BASE_PROMPT"
---

<objective>
AI chatbot felesleges "megértés-visszhang" viselkedésének eltávolítása a system promptból.

Purpose: Átláthatóbb, világosabb chat folyamat — Claude ne ismételgesse vissza minden válasz után a megértését ("Értem, tehát AI HR szoftvert csinálsz..."). Az összefoglalót úgyis megkapja a végén.

Output: Módosított BASE_PROMPT SZABÁLYOK szekcióval, ami explicit megtiltja az "Értem, tehát..." típusú visszaismételgetést.
</objective>

<execution_context>
@/Users/biroroland/.claude/get-shit-done/workflows/execute-plan.md
@/Users/biroroland/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@/Users/biroroland/roi-brief/.planning/PROJECT.md
@/Users/biroroland/roi-brief/.planning/STATE.md

@/Users/biroroland/roi-brief/lib/prompts/base.ts
</context>

<tasks>

<task type="auto">
  <name>Prompt szabály hozzáadása: NE visszhangozz megértést</name>
  <files>lib/prompts/base.ts</files>
  <action>
    Módosítsd a `lib/prompts/base.ts` fájl SZABÁLYOK szekciójában (jelenleg 42-52. sor) a szabályokat:

    - Add hozzá az első szabályként (a "Magyar nyelv, tegező hang végig" UTÁN):
      "- NE ismételd vissza a megértésedet ("Értem, tehát...") — rögzítsd update_brief-fel és kérdezz tovább. A végén összefoglalót kap, addig ne visszhangozz."

    - Ez megelőzi Claude default LLM viselkedését, hogy minden válaszra reflektáljon.
    - A szabály explicit magyarázatot ad: a végén összefoglaló lesz, nincs szükség közben visszaismételgetésre.
  </action>
  <verify>
    - `cat lib/prompts/base.ts | grep -A 2 "NE ismételd vissza"` mutatja az új szabályt
    - A SZABÁLYOK szekció továbbra is jól formázott és olvasható
  </verify>
  <done>
    BASE_PROMPT SZABÁLYOK szekciója tartalmazza az új szabályt, ami megtiltja Claude-nak a "megértés-visszhang" viselkedést.
  </done>
</task>

</tasks>

<verification>
- [ ] lib/prompts/base.ts módosítva
- [ ] SZABÁLYOK szekció tartalmazza: "NE ismételd vissza a megértésedet"
- [ ] Prompt továbbra is jól formázott, ékezetes magyar szöveg
</verification>

<success_criteria>
A BASE_PROMPT explicit megtiltja Claude-nak, hogy visszaismételje a megértését minden válasz után. Ez világosabb, átláthatóbb chat folyamatot eredményez, ahol Claude rövid nyugtázás után azonnal a következő kérdésre tér.
</success_criteria>

<output>
Végrehajtás után: `.planning/quick/3-remove-ai-chatbot-understanding-echo-aft/3-01-SUMMARY.md`
</output>
