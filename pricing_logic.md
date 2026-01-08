# Critical and Strict Program Logic Guidelines
Version: 1.0  
Purpose: This document defines non-negotiable global rules and pricing logic for the AI Pricing Assistant. These rules apply across all programs unless explicitly overridden by a program-specific rule.

---

## How to Update This Logic (Builder Instructions)
The AI assistant must support incremental updates to this document using prompts that start with:

add to pricing logic: <your new rule text>

### Update Behavior (Required)
When the user sends a prompt that starts with **"add to pricing logic:"**, the assistant must:

1. **Extract the new rule(s)** from the user’s message.
2. **Normalize and rewrite** the new rule(s) into the same style and structure used in this document:
   - Clear heading (where applicable)
   - Bullet rules
   - Any required examples
   - Any required conditions / exceptions
3. **Insert the new rule(s)** into the most appropriate section below:
   - Global Final Pricing Logic
   - Prepayment Penalty Rules
   - Program Visibility Rules
   - State Eligibility Rules
   - Loan Amount Tier Matching
   - Pricing Adjustments & LLPA Display
   - Normalizing Names (Rate Sheet Mapping)
   - Final Rate & Price Display (Cap Logic)
4. If no appropriate section exists, create a new section titled:
   - `## Added Pricing Logic (User-Injected Rules)`
5. **Do not delete or weaken existing rules** unless the user explicitly says:
   - “replace” or “override” or “remove”
6. If a new rule conflicts with an existing rule:
   - Keep the existing rule
   - Add the new rule under a subheading: `### Conflict Noted (Needs Resolution)`
   - Explain the conflict in one sentence and continue.

---

# Global FINAL Pricing Logic (Apply After All Adjustments)

## Global Price Boundaries (Hard Clamp)
- GLOBAL_MIN_FINAL_PRICE = **99.000**
- GLOBAL_MAX_FINAL_PRICE = **101.000**

### Clamp Requirement
- After all adjustments are applied (including LLPAs and caps), the AI MUST clamp the final price into this range:
  - If final price < 99.000 → set final price to 99.000
  - If final price > 101.000 → set final price to 101.000

> Order of operations note: Clamp happens before the final rounding rule unless a program explicitly states otherwise.

---

## Final Pricing Rounding Rule (0.125 Increments)
### Rule
- After ALL adjustments are applied and the **FINAL price** is produced, the AI MUST round the **FINAL price** to the **nearest 0.125** (1/8).
- Rounding MUST go **up or down** based on the closest 0.125 increment.
- Do NOT round intermediate values.

### Valid Final Price Increments
Final prices MUST end in:
- .000
- .125
- .250
- .375
- .500
- .625
- .750
- .875

### Examples (Required Behavior)
- 100.788 → 100.750  
- 100.823 → 100.875  
- 99.920 → 99.875  
- 99.950 → 100.000  

### Instruction to the Assistant
- ONLY round once, at the end, on the FINAL price.
- Output the final price using the rounded value.

---

# Program Visibility Rules (Strict)

## DSCR Program Visibility
- Never show a DSCR program unless:
  - `Income Documentation Type = DSCR`

---

# Prepayment Penalty Rules (Strict)

## Owner-Occupied / Second Home Prepay Restriction
- Never add or display any of the following fields (or any variation of them) if:
  - `Occupancy` or `Occupancy Type` = Primary / Owner Occupied / Second Home / 2nd Home
- Restricted fields include (not limited to):
  - Prepay Period
  - Prepay Term
  - Prepay Fee
  - Prepay Fee Type
  - Prepay Type
  - PPP
  - “Prepayment Penalty”

## HELOC / HELOAN Second Liens Prepay Restriction
- HELOC & HELOAN **2nd liens** never have a prepay period.
- Therefore:
  - Do not calculate, add, infer, or display any prepayment penalty fields for HELOC/HELOAN 2nd liens.

---

# State Eligibility Rules (Dropdown + Scenario Eligibility)

## Primary / Second Home Occupancy: Allowed States Only
If the form field `Occupancy` is:
- Primary
- Second Home

THEN the state dropdown MUST ONLY allow:
- CA, CO, GA, FL, TX, AL, TN

## Non-DSCR Income Documentation Types: Allowed States Only
If `Income Documentation Type` is any of the following (or normalized equivalents):
- 2yr Full Doc
- 1yr Full Doc
- 12m Bank Stmts
- 24m Bank Stmts
- Asset Depletion
- 1yr P&L ONLY
- 1yr P&L w/2m Bank Stmts
- 1yr 1099 Only
- 1yr WVOE Only
- bank statements
- asset utilization
- full doc
- alt doc
- lite doc

THEN the state dropdown MUST ONLY allow:
- CA, CO, GA, FL, TX, AL, TN

## DSCR Income Documentation Type: Allowed States Only
If `Income Documentation Type = DSCR`  
THEN the state dropdown MUST ONLY allow:
- AL, AR, CA, CO, CT, DE, DC, FL, GA, HI, IN, IA, KS, KY, LA, ME, MD, MA, MS, MO, MT, NE, NH, NJ, NM, NY, OH, OK, PA, RI, SC, TN, TX, VA, WA, WV, WI, WY

---

# Loan Amount Tier Matching (If Applicable)

## Loan Amount Tier Search Order
If the program uses loan amount tiers (e.g. `#loanAmountTiersForProgram`):
- Treat tiers as open-ended ranges where applicable.
- Evaluate tiers from **largest to smallest**.
- Select the **first tier** where the loan amount falls within the tier’s defined range.

### Tie-breaker Rule
- If loan amount equals a boundary shared by two tiers:
  - choose the tier that explicitly includes the boundary (per rate sheet definition).
  - if unclear, choose the more conservative tier (worse pricing) and flag for review.

---

# Pricing Adjustments (LLPAs) & Display Rules

## What to Display
- Only display adjustments that are:
  - Relevant to the user’s selected factors AND
  - Have a non-zero value
    - Negative example: `-X.XXX`
    - Positive example: `X.XXX`

## What to Hide
- If an LLPA factor is not applicable or equals `0.000`:
  - Hide it from the final results output card.

## Required Transparency
- Always show both:
  - the adjustment factor name (label)
  - the exact positive/negative adjustment value used

---

# Normalizing Names (Rate Sheet → UI Factor Mapping)

## Factor Name Not Present = No Adjustment
- If a factor name itself is not present in the LLPA table for the chosen program:
  - Assume **no adjustment applies** (0.000)
  - Example:
    - Occupancy = Primary → No LLPA shown if not present
    - Property Type = SFR / Single Family → No LLPA shown if not present

---

# Final Rate & Final Price Display Rules (Per Program)

## Rebate Cap Logic (Show Best Rate That Hits the Price Cap)
- For each program:
  - Identify the maximum allowable final price (typically driven by GLOBAL_MAX_FINAL_PRICE or a program-specific max).
  - Display ONLY the rate that provides the highest rebate **without exceeding the cap**.
  - If multiple rates hit the same capped price, choose the **lowest rate** among those tied at the cap.

### Example
- If the program max final price is 101.000 and:
  - 7.000% = 101.000
  - 7.125% = 101.000
- The cap display rate MUST be:
  - **7.000%** (lowest rate that achieves the capped price)

---

# Output & Execution Order (Mandatory)

## Required Order of Operations
1. Determine eligibility (state + occupancy + doc type + program visibility).
2. Load base rate/price from the selected program.
3. Apply LLPAs (only those relevant to selected factors).
4. Apply clamps:
   - clamp final price to GLOBAL_MIN_FINAL_PRICE and GLOBAL_MAX_FINAL_PRICE
5. Apply final rounding rule:
   - round FINAL price to nearest 0.125
6. Apply rebate cap display rule:
   - show the highest rebate at/under cap; break ties by lowest rate
7. Output results:
   - final rate
   - rounded final price
   - itemized visible adjustments (non-zero only)

---

# Change Log (Auto-Append)
When the user uses: `add to pricing logic: ...`  
Append a new entry here:

## Change Log Entries when prompted: 'update logic'=
- (none yet)
