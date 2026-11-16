"""NAMO standalone pre-money: no Ananta context, no ask anchor. Inputs dated 2026-11-16.
Run: python3 valuation/namo_independent.py"""
from startup_valuation import core
cr = 1e7
BASE = 8 * cr   # Indian pre-revenue consumer pre-seed, pre-money ₹3-10 cr band -> ₹8 cr [read: Backrr/IncorpX; midpoint is a guess]
res = {
 # idea, prototype, team, strategic relationships, rollout. India cap ₹2.5 cr/factor
 "Berkus": core.berkus_valuation(sound_idea=1.25*cr, prototype=2.0*cr, quality_team=1.25*cr,
        strategic_relationships=0.25*cr, product_rollout=0.25*cr, max_per_factor=2.5*cr),
 # team .30, market .25, product .15, competition .10, channels .10, funding need .05, other .05
 "Scorecard (base ₹8 cr)": core.scorecard_valuation(average_valuation=BASE,
        weights=[.30,.25,.15,.10,.10,.05,.05], scores=[0.9,1.5,1.1,0.5,0.4,0.9,1.0]),
 # mgmt, stage, regulatory, mfg, sales/mkt, funding, competition, tech, litigation, intl, reputation, exit
 "Risk Factor Summation (base ₹8 cr, ₹0.8 cr/unit)": core.risk_factor_summation(base_valuation=BASE,
        risk_ratings=[-1,-1,-1,0,-2,0,-2,2,0,0,-1,0], adjustment_per_unit=0.8*cr),
}
# VC method, comps-led exit: success case = ₹50 cr revenue in yr 5 (InstaAstro hit ₹52 cr ~4 yrs after seed)
# x 5x revenue (Astrotalk ~4.8x, Sri Mandir ~21x, discounted) = ₹250 cr; 30x target at pre-revenue; 50% retention
post = 250*cr / 30 * 0.5
res["VC method (20% round)"] = core.vc_method_pre_money(post_money=post, investment=0.2*post)
vals = [v.value for v in res.values()]
for k, v in res.items(): print(f"{k:50s} ₹{v.value/cr:5.2f} cr")
print(f"{'Average':50s} ₹{sum(vals)/len(vals)/cr:5.2f} cr   range ₹{min(vals)/cr:.1f}-{max(vals)/cr:.1f} cr")
