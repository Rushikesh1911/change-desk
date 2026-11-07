# 90-Second Demo Recording Script

**Track**: Track 1: Best Business Workflow  
**Project**: Change Desk  
**Target Video Duration**: 90 seconds (1 min 30 sec)

---

## Storyboard & Voiceover

| Time | On Screen | What to Say (Voiceover) | Action to Take |
|---|---|---|---|
| **0:00 - 0:10** | Title slide: *"One renamed field. Three hours of failed checkouts. ₹3.6 lakh gone."* | "When an API changes, Slack warnings get lost. A single renamed field like `qty` can silently break checkout, costing lakhs before anyone notices." | Show title slide or intro graphic. |
| **0:10 - 0:25** | Switch room in Discord. Post: `Please check demo/api-service/openapi.v1.yaml and openapi.v2.yaml`. `@diff` replies. | "In Change Desk, the author drops the API specs into our Switch room. `@diff` runs a deterministic detector and surfaces two breaking changes and one safe addition." | `@diff` lists: `qty` removed (BREAKING), `coupon` required (BREAKING), `nickname` added (SAFE). |
| **0:25 - 0:40** | `@impact` triggers and posts affected services. | "Next, `@impact` scans consumer repositories and pairs findings with our service map. It tags only the affected owner, Priya, and calculates the exact blast radius: ₹3,60,000 at risk." | `@impact` tags `@priya`, shows `cart.ts:3`, clears `@sam` (mobile-app). |
| **0:40 - 1:00** | `@skeptic` chimes in with a challenge. Human owner replies. | "Then `@skeptic` plays devil's advocate. It challenges the coupon finding, confirming no active consumers send it. But Priya confirms the checkout breakage is very real." | `@skeptic` posts challenge on `coupon`. Human (Priya) types: *"Approved to block deployment until checkout migrates."* |
| **1:00 - 1:15** | Decision logged in room. | "Every change has an owner, every risk has a rupee value, and every approval is logged with a clean audit trail." | Show the thread summary / decisions. |
| **1:15 - 1:30** | Closing screen: Architecture diagram + GitHub repo link. | "Agents argue, numbers stay grounded in real tools, and humans make the final call. Without Switch, this is just another ignored CI run. With Switch, it's Change Desk." | Show GitHub link: `github.com/Rushikesh1911/change-desk`. |
