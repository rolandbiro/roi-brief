# Quick Task 1: Fix Agency Brief XLSX, Budget Constraint, PM Email PDF

## Task 1: Fix fill-agency-brief.ts comprehensive mapping issues

### 1a. Fix channel checkbox string matching (rows 30-33)
The quick reply values differ from the fill code checks:
- `"Facebook"` → code checks `"Facebook ads"` ✗
- `"Instagram"` → code checks `"Instagram ads"` ✗
- `"TikTok"` → code checks `"Tiktok ads"` ✗
- `"YouTube"` → code checks `"YouTube ads"` ✗
- `"Microsoft"` → code checks `"Microsoft ads"` ✗

**Fix**: Use a helper that checks if the channel starts with the expected prefix OR matches exactly.
```typescript
const ch = (name: string) => channels.some(c => c === name || c.startsWith(name.replace(/ ads$/, "")));
```

### 1b. Fix B21 mapping
B21 = "Kampány típusa" — currently maps `campaign_goal` but should map `campaign_types` labels.
Remove the duplicate B21 line, replace with campaign_types label join.

### 1c. Fix creative_source matching (C25, C26)
Code checks `.includes("client")` / `.includes("agency")` but quick replies are Hungarian.
**Fix**: Check for both English and Hungarian values:
- C25: `"client"` OR `"ügyfél"` OR `"Saját"`
- C26: `"agency"` OR `"ROI"` OR `"készíti"`
- Handle `"Mindkettő"` → both true

### 1d. Add creative_types mapping (E25, E26)
Template: D25="Statikus kreatívok" E25=checkbox, D26="Videós kreatívok" E26=checkbox
Map `brief.creative_types` array to these checkboxes.

### 1e. Fix gender "Mindkettő" handling
If `gender` array includes "Mindkettő", set both C46 and E46 to true.

## Task 2: Fix research prompts for budget constraint and channel filtering

### 2a. In `buildResearchPrompt` (prompts.ts)
Add hard constraint:
```
FONTOS MEGSZORÍTÁS: A TELJES büdzsé ${budget_range}. Ez az ABSZOLÚT MAXIMUM.
Az összes csatorna büdzsé elosztásának összege NEM HALADHATJA MEG ezt az összeget.
```

Add channel constraint when ad_channels is provided:
```
KIZÁRÓLAG az alábbi csatornákat használd a mediatervben: ${channels}.
NE javasolj és NE adj hozzá más csatornákat!
```

### 2b. In `STRUCTURE_SYSTEM_PROMPT` (prompts.ts)
Add:
```
- A forint összegek összege KÖTELEZŐEN meg kell egyezzen a megadott büdzséval (total_budget_huf)
- Ha a büdzsé meg van adva, NE lépd túl, és NE maradjon ki belőle jelentős rész
```

### 2c. In `structureResults` (structure.ts)
Pass the budget_range to the structuring prompt more explicitly:
```
- Büdzsé LIMIT: ${briefData.budget_range || "nem megadott"} — a total_budget_huf NE haladja meg!
```

Add channel constraint:
```
- Csatornák: KIZÁRÓLAG ${briefData.ad_channels?.join(", ")} — NE adj hozzá más csatornákat!
```

## Task 3: Add PDF attachment to PM email

### 3a. Generate PDF server-side in approve route (app/api/approve/route.ts)
Before Step 5 (sendPmEmail), add PDF generation:
```typescript
import { renderToBuffer } from "@react-pdf/renderer";
import { BriefPDF } from "@/lib/pdf-template";

const pdfElement = <BriefPDF data={briefData} />;
const pdfBuffer = Buffer.from(await renderToBuffer(pdfElement));
```

### 3b. Update sendPmEmail signature (lib/delivery/send-pm-email.ts)
Add `pdfBuffer: Buffer` parameter, add second attachment:
```typescript
{
  content: pdfBuffer.toString("base64"),
  filename: `${companyName}-brief.pdf`,
  type: "application/pdf",
  disposition: "attachment",
}
```

Also update email body text to mention both attachments.

### 3c. Update retry route (app/api/retry/[token]/route.ts)
Same PDF generation + sendPmEmail call with pdfBuffer.

## Files to modify:
1. `lib/xlsx/fill-agency-brief.ts` — Task 1
2. `lib/research/prompts.ts` — Task 2a, 2b
3. `lib/research/structure.ts` — Task 2c
4. `lib/delivery/send-pm-email.ts` — Task 3b
5. `app/api/approve/route.ts` — Task 3a
6. `app/api/retry/[token]/route.ts` — Task 3c
