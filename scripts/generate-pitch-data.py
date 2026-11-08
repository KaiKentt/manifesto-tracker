"""Generates src/lib/pitch-data.ts from the final financial model (Excel, Base case).

Every financial figure on the landing page comes from that file, so the
page never drifts from the model. Re-run after the model changes:

    pip install openpyxl
    python scripts/generate-pitch-data.py "path/to/Manifesto - Startup Financial Model.xlsx" src/lib/pitch-data.ts

Save the workbook in Excel first (with the Base case selected) so cached values are current.
"""
import json
import sys
import openpyxl

XLSX = sys.argv[1]
OUT = sys.argv[2]
wb = openpyxl.load_workbook(XLSX, data_only=True)
S, F, R, C, M, A, ST = (wb[n] for n in ["Summary", "Funding", "Revenue", "Costs", "Market", "Assumptions", "Statements"])

assert S["D4"].value == "Base", "Model must be on the Base case"

from decimal import Decimal, ROUND_HALF_UP

def r0(v):
    # Round half away from zero, as Excel does (Python's round() would turn 11,374.5 into 11,374).
    return int(Decimal(str(v)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

months = []
for row in range(45, 69):
    m = S.cell(row, 3).value
    months.append({
        "month": int(m.lstrip("M")),
        "revenue": r0(S.cell(row, 4).value),
        "costs": r0(S.cell(row, 5).value),
        "cash": r0(S.cell(row, 6).value),
        "ebitda": r0(S.cell(row, 9).value),
    })

def rev_row(label):
    for row in range(1, R.max_row + 1):
        if R.cell(row, 3).value == label:
            return [R.cell(row, c).value for c in range(7, 31)]
    raise KeyError(label)

citizens = rev_row("Closing citizen accounts")
plus = rev_row("Closing Plus subscribers")
paid = rev_row("Closing paid politician accounts")
workspaces = rev_row("Closing politician workspaces")
for i, m in enumerate(months):
    m["citizens"] = r0(citizens[i])
    m["plus"] = r0(plus[i])
    m["paidPoliticians"] = r0(paid[i])
    m["workspaces"] = r0(workspaces[i])

def years(sheet, row):
    return [sheet.cell(row, 4).value, sheet.cell(row, 5).value]

data = {
    "source": "Manifesto - Startup Financial Model.xlsx, Base case",
    "forecastStart": S["D5"].value.strftime("%Y-%m"),
    "raise": A["D9"].value,
    "reserve": A["D24"].value,
    "fundedMonths": S["D29"].value,
    "firstMonthBelowReserve": S["D30"].value,
    "firstNonNegativeEbitdaMonth": S["D31"].value,
    "extraFundingFor24Months": r0(F["E23"].value),
    "extraFundingFor12Months": r0(F["E22"].value),
    "founders": S["D33"].value,
    "founderMonthlySalary": S["D34"].value,
    "prices": {"citizenPlus": A["D20"].value, "politician": A["D21"].value, "party": A["D22"].value},
    "years": {
        "revenue": [r0(v) for v in years(S, 8)],
        "cashCosts": [r0(v) for v in years(S, 9)],
        "ebitda": [r0(v) for v in years(S, 11)],
        "netLoss": [r0(v) for v in years(S, 10)],
        "grossMargin": [round(v, 4) for v in years(S, 13)],
        "citizens": [r0(v) for v in years(S, 20)],
        "plus": [r0(v) for v in years(S, 21)],
        "paidPoliticians": [r0(v) for v in years(S, 22)],
        "subscriptionArr": [r0(v) for v in years(S, 25)],
        "annualizedRevenue": [r0(v) for v in years(S, 27)],
        "politicianRevenue": [r0(v) for v in years(ST, 9)],
        "plusRevenue": [r0(v) for v in years(ST, 8)],
        "adRevenue": [r0(v) for v in years(ST, 11)],
    },
    "year1Costs": [
        {"label": "Founder payroll and development tools", "amount": r0(C["D31"].value)},
        {"label": "Infrastructure and security", "amount": r0(C["D34"].value)},
        {"label": "Legal and company admin", "amount": r0(C["D35"].value)},
        {"label": "Community and acquisition", "amount": r0(C["D33"].value)},
        {"label": "Verification and editorial", "amount": r0(C["D32"].value)},
        {"label": "Payment and billing fees", "amount": r0(C["D26"].value)},
    ],
    "year1CashCosts": r0(C["D29"].value),
    "market": [
        {
            "key": "TAM", "value": M["D21"].value, "users": M["D9"].value,
            "plusRate": M["D10"].value, "plusRevenue": M["D13"].value,
            "politicians": M["D15"].value, "politicianRevenue": M["D17"].value, "ads": M["D20"].value,
        },
        {
            "key": "SAM", "value": M["E21"].value, "users": M["E9"].value,
            "plusRate": M["E10"].value, "plusRevenue": M["E13"].value,
            "politicians": M["E15"].value, "politicianRevenue": M["E17"].value, "ads": M["E20"].value,
        },
        {
            "key": "SOM", "value": M["F21"].value, "users": M["F9"].value,
            "plusRate": M["F10"].value, "plusRevenue": M["F13"].value,
            "politicians": M["F15"].value, "politicianRevenue": M["F17"].value, "ads": M["F20"].value,
        },
    ],
    "months": months,
}

# Internal consistency checks against the model's own totals.
assert sum(c["amount"] for c in data["year1Costs"]) - data["year1CashCosts"] in (-1, 0, 1)
assert data["years"]["annualizedRevenue"][1] == data["market"][2]["value"]
assert months[22]["ebitda"] >= 0 and months[21]["ebitda"] < 0
assert months[11]["cash"] > 0 and months[12]["cash"] < 0

ts = f"""// Generated from {data['source']}.
// Do not edit by hand: every financial figure on /pitch comes from the final model.
// Year 1 = Jan–Dec {data['forecastStart'][:4]}, Year 2 = Jan–Dec {int(data['forecastStart'][:4]) + 1}. Amounts in RM.

export const PITCH_MODEL = {json.dumps(data, indent=2)} as const;

export type PitchMonth = (typeof PITCH_MODEL.months)[number];
"""
open(OUT, "w").write(ts)
print("wrote", OUT, "months:", len(months))
print(json.dumps({k: v for k, v in data.items() if k not in ("months", "market")}, indent=1)[:1800])
