# Change Desk

> An approval room where AI agents and team owners decide, in minutes, whether an API change is safe to ship, and what it costs if it isn't.

Built for the **Flip the Switch Hackathon** (WeMakeDevs + Switch), **Track 1: Best Business Workflow**.  
**Team**: `404_Not_Found` | **Builder**: Rushikesh ([@rushixh](https://github.com/Rushikesh1911))

---

## 90-Second Story
1. **One renamed field (`qty` &rarr; `quantity`)** in a checkout API.
2. In production, checkout fails silently for 3 hours before someone notices.
3. **Loss: ₹3,60,000 gone.**
4. **Change Desk** fixes this by putting the API change into a Switch room with `@diff`, `@impact`, and `@skeptic` alongside real human owners. Breaking changes get an **owner** and a **rupee figure** before they ever hit production.

---

## Why Switch is Essential
- **Shared human-agent context:** Humans and AI agents collaborate in a shared chat room (Discord/Slack) with one history. Remove Switch, and this degrades to a disconnected CI script that people ignore.
- **Selective addressing:** Addressing rules ensure only affected owners (e.g. `@priya` for checkout) are tagged, eliminating alarm fatigue.
- **Audit trail:** Switch rooms maintain an immutable record of who accepted or challenged which risk.

---

## Architecture

```
 Humans (Author, Service Owners, Approver)
        │
   Team Chat (Discord / Slack)
        │
   Switch Room "change-desk" (shared log, participants, decisions)
        │
   ┌────┴───────────┬─────────────┬────────────┐
   │                │             │            │
 @diff           @impact       @skeptic    (@fixer, @verify)
   │                │             │
 tools/detect    tools/usage-scan, tools/cost
   │                │
 specs (v1, v2)  demo consumer repos + service-map.yaml
```

> **Principle:** Deterministic tools produce facts (files, lines, rupee cost). AI agents reason, challenge, and debate. Humans make the final call.

---

## Quickstart (Judge Reproduction)

Clone and set up in 2 minutes:

```bash
git clone https://github.com/Rushikesh1911/change-desk.git
cd change-desk
npm install
```

### 1. Run Seed Script (Idempotent Demo Reset)
```bash
# On Linux / macOS / Git Bash:
./scripts/seed.sh

# On Windows PowerShell:
powershell -ExecutionPolicy Bypass -File scripts/seed.ps1
```

### 2. Run the Core Verification Suite
Test all deterministic tools directly from CLI:

```bash
# Step 1: Detect changes between v1 and v2 specs (2 BREAKING, 1 SAFE)
npx tsx tools/detect.ts demo/api-service/openapi.v1.yaml demo/api-service/openapi.v2.yaml > changes.json

# Step 2: Scan consumer codebase for actual usage of changed fields
npx tsx tools/usage-scan.ts changes.json service-map.yaml > findings.json

# Step 3: Compute revenue at risk per service
npx tsx tools/cost.ts findings.json service-map.yaml
```

**Expected Result:**
- `detect.ts`: Identifies `c1` (`qty` removed, BREAKING), `c2` (`coupon` required, BREAKING), `c3` (`nickname` added, SAFE).
- `usage-scan.ts`: Finds `checkout-service` breaks on lines 2, 3, 6, 7 of `cart.ts`. Confirms `mobile-app` is safe.
- `cost.ts`: Outputs `₹3,60,000` estimated loss for `checkout-service` (₹1,20,000/hr &times; 3 hrs).

---

## Setting Up the Switch Room

1. Open **Switch Console**.
2. Import the template at `switch/change-desk.template.yaml`.
3. Choose your bridge (Discord or Slack) and agent provider (Claude Code, Codex, or OpenCode).
4. Launch the room `{team}-change-desk`.
5. Post the specs to start the workflow:
   ```
   Please inspect demo/api-service/openapi.v1.yaml and demo/api-service/openapi.v2.yaml
   ```

---

## Repository Structure

```
change-desk/
  ├── README.md                      # Overview & reproduction guide
  ├── package.json                   # Dependencies (TypeScript, tsx, yaml)
  ├── service-map.yaml               # Service ownership & revenue figures
  ├── switch/
  │   └── change-desk.template.yaml  # Switch room blueprint & agent instructions
  ├── tools/
  │   ├── detect.ts                  # OpenAPI breaking change detector
  │   ├── usage-scan.ts              # Codebase usage scanner
  │   ├── cost.ts                    # Revenue-at-risk calculator
  │   └── lib/                       # Types and safe path resolvers
  ├── demo/
  │   ├── api-service/               # Sample OpenAPI specs (v1 and v2)
  │   ├── checkout-service/          # Affected consumer (reads qty)
  │   └── mobile-app/                # Unaffected consumer
  ├── scripts/
  │   ├── seed.sh                    # Bash reset script
  │   └── seed.ps1                   # PowerShell reset script
  └── docs/
      └── demo-script.md             # 90-second recording script
```

---

## Honest Notes & Limitations
- **DriftMap Engine:** `tools/detect.ts` is modeled on the DriftMap API architecture. It natively parses OpenAPI 3.0 specs and checks for response field removals/renames, new required parameters, and safe optional additions.
- **Service Map Numbers:** The revenue figures in `service-map.yaml` are illustrative for the demo.
- **Deterministic First:** No numbers or file paths are ever guessed or hallucinated by LLMs.

---

## Credits & License
MIT License. Created by [Rushikesh (@rushixh)](https://github.com/Rushikesh1911) for the **Flip the Switch Hackathon 2026**.

