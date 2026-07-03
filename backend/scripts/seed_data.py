"""Seed test data for development."""

import uuid

from app.db.client import get_supabase

supabase = get_supabase()


business = (
    supabase.table("business_profiles")
    .insert(
        {
            "name": "AI Sales Coach",
            "framework": "BANT",

            # New B1 fields
            "products": (
                "AI-powered sales practice software where reps rehearse realistic "
                "calls with buyer personas before speaking with live prospects"
            ),
            "icp": (
                "B2B SaaS companies with growing sales teams, onboarding pressure, "
                "and sales managers who need scalable coaching"
            ),
            "objections": (
                "AI cant replace coaching, too expensive, my team wont adopt it, "
                "we already use Gong or enablement tools"
            ),
            "language": "en",

            # Existing context data (keep this)
            "context_data": {
                "service": (
                    "AI-powered sales practice software where reps rehearse realistic calls "
                    "with buyer personas before speaking with live prospects"
                ),
                "market": (
                    "B2B SaaS and sales-led companies with growing teams, onboarding pressure, "
                    "and stretched sales managers"
                ),
                "pricing": (
                    "30-day pilot for 5 to 15 reps, then around $79 per rep per month "
                    "plus a $499 per month manager workspace"
                ),
                "buyer_profiles": [
                    "Head of Sales or VP Sales",
                    "Sales Enablement Leader",
                    "Founder-led SaaS Team",
                ],
                "common_objections": [
                    "AI cant replace coaching",
                    "too expensive",
                    "my team wont adopt it",
                    "we already use call recording or enablement tools",
                    "I do not trust AI to sound like our real buyers",
                    "we do not have time to set this up",
                ],
                "value_props": [
                    "Reps practice realistic calls before live pipeline is at risk",
                    "AI buyers stay in character across a full call",
                    "Managers create repeatable coaching moments without joining every role-play",
                    "Custom personas reflect the team's ICP and real objections",
                ],
            },
        }
    )
    .execute()
)
business_id = business.data[0]["id"]

print(f"Created business: {business_id}")

rep_id = str(uuid.uuid4())

print(f"Test rep ID: {rep_id}")

(
    supabase.table("salesperson_profiles")
    .insert(
        {
            "rep_id": rep_id,
            "version": 0,
            "business_id": business_id,
            "metric_scores": {
                "rapport": 5,
                "needs_discovery": 5,
                "objection_handling": 5,
                "closing": 5,
            },
            "weakest_dimension": "objection_handling",
        }
    )
    .execute()
)

print("Created initial profile: version 0")
print(f"\nSeed data created! Use rep_id={rep_id} for testing.")
