# NAMO — standalone valuation, no Ananta context

Dated 2026-11-16. No Ananta, no ₹2 cr ask, no group distribution, no agent results.
Rerun: `python3 valuation/namo_independent.py`. Tags: [tested] [read] [guess].

## Number

**Pre-money ₹3–8 cr, midpoint ~₹5 cr.** The Ananta-framed run gave ₹6–15 cr. About half of that came from context
an outside investor would not credit.

| Method | Pre-money |
|---|---|
| Berkus | ₹5.0 cr |
| Scorecard (base ₹8 cr) | ₹8.0 cr |
| Risk Factor Summation | ₹3.2 cr |
| VC method (₹250 cr yr-5 exit, 30x, 50% retention) | ₹3.3 cr |
| **Average** | **₹4.9 cr** |

## Live product and live market, as measured

- Play installs `namo.social.app`: **100+** [tested].
- Consultants listed on the live API (`/v1/consultants/`): **2**. Together: **34 sessions, 8 ratings** [tested].
  The two names match the team's Rahul and Raghu [guess on identity].
- Live and responding: TV (Gita series featured), consult with chat/call/audio pricing at ₹10–25/min [tested].
  Wallet, market, tribes, groups need login [tested].
- Competitors: Astrotalk ₹1,823 cr FY26 revenue, ~$1 bn. InstaAstro ₹111 cr FY26, 12 M users, 5,000+ experts, $12 M Series A.
  Sri Mandir ₹70 cr FY25, 30 M downloads, ~$175 M est. [read].

## Why it lands at ₹5 cr, not higher

- **Tech risk is gone and it is the only strong factor.** 34 features, payments and live video shipped in 2 months.
  That earns the Berkus prototype score and nothing else.
- **No supply side.** A consult marketplace with 2 in-house consultants is a demo. InstaAstro has 5,000 experts.
- **No demand signal.** 100+ installs after 2+ months live, with no paid acquisition evidence.
- **Breadth cuts both ways.** A seed investor reads 34 features at 100 installs as unfocused, not as a moat.
- **The market is real and big.** That is what holds the Scorecard at ₹8 cr.

## What would double it

Proof of one loop, not more features: 50 outside consultants and 1,000 paid sessions a month with D30 retention shown.
That moves channels and rollout from 0.1 to about 0.5 and puts the standalone number at ₹10–12 cr [guess].
