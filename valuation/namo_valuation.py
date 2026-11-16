"""NAMO pre-money, four methods (startup-valuation lib). Inputs dated 2026-11-16. Run: python3 valuation/namo_valuation.py"""
from startup_valuation import core
cr = 1e7
res = {
 "Berkus (cap ₹2.5 cr/factor)": core.berkus_valuation(sound_idea=1.5*cr, prototype=2.0*cr, quality_team=1.25*cr,
        strategic_relationships=1.0*cr, product_rollout=0.25*cr, max_per_factor=2.5*cr),
 # team, market size, product, competition, channels, funding need, other
 "Scorecard (base ₹15 cr)": core.scorecard_valuation(average_valuation=15*cr,
        weights=[.30,.25,.15,.10,.10,.05,.05], scores=[0.8,1.4,1.1,0.6,0.6,0.9,1.0]),
 # mgmt, stage, regulatory, mfg, sales/mkt, funding, competition, tech, litigation, intl, reputation, exit
 "Risk Factor Summation (base ₹15 cr, ₹1 cr/unit)": core.risk_factor_summation(base_valuation=15*cr,
        risk_ratings=[-1,-1,-1,0,-2,-1,-2,1,0,0,-1,-1], adjustment_per_unit=1*cr),
 # exit = ₹60 cr yr-5 revenue x 4x; 10x target; 60% retention after later rounds
 "VC method (pre-money)": core.vc_method_pre_money(post_money=240*cr/10*0.6, investment=2*cr),
}
vals = []
for k, v in res.items():
    vals.append(v.value); print(f"{k:50s} ₹{v.value/cr:6.2f} cr")
avg = sum(vals)/len(vals)
print(f"{'Average':50s} ₹{avg/cr:6.2f} cr  -> ₹2 cr buys {2*cr/(avg+2*cr):.1%}")
