"""Seed test data for development."""

import uuid

from app.db.client import get_supabase

supabase = get_supabase()


business = (
    supabase.table("business_profiles")
    .insert(
        {
            "name": "Optimal Trappstadning",
            "framework": "BANT",
            "products": (
                "professional stairwell cleaning, entrance cleaning, floor care, and recurring "
                "property cleaning services for apartment buildings and housing associations"
            ),
            "icp": (
                "Swedish housing associations, property managers, and landlords responsible for "
                "clean, safe, and well-maintained shared building spaces"
            ),
            "objections": (
                "we already have a cleaning supplier, too expensive, residents have "
                "not complained, we need board approval, we only review supplier "
                "contracts once per year"
            ),
            "language": "sv",
            "context_data": {
                "service": (
                    "recurring stairwell cleaning and property cleaning for Swedish "
                    "apartment buildings, including entrances, stairs, railings, "
                    "elevators, laundry-room areas, and floor care"
                ),
                "market": (
                    "Swedish housing associations, property owners, and property "
                    "managers who need reliable cleaning quality, fewer resident "
                    "complaints, clear routines, and predictable supplier communication"
                ),
                "pricing": (
                    "monthly recurring cleaning contract based on building size, "
                    "cleaning frequency, "
                    "floor count, and add-on services such as floor care or deep cleaning"
                ),
                "buyer_profiles": [
                    "BRF board member responsible for supplier contracts",
                    "property manager handling daily building operations",
                    "landlord or owner of smaller apartment buildings",
                ],
                "common_objections": [
                    "we already have a cleaning supplier",
                    "too expensive",
                    "residents have not complained",
                    "we need board approval",
                    "we only review supplier contracts once per year",
                    "we are worried switching suppliers will create extra work",
                ],
                "value_props": [
                    "cleaner stairwells and shared spaces residents notice",
                    "reliable routines with clear communication when something changes",
                    "reduced complaints and less follow-up work for the board or property manager",
                    "flexible recurring cleaning plans matched to building size and traffic",
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
(
    supabase.table("scenario_configs")
    .insert(
        [
            {
                "business_id": business_id,
                "scenario_slug": "cold_call",
                "title": "Cold Call",
                "objective": (
                    "Earn attention from a Swedish housing-association buyer and book "
                    "a cleaning walkthrough or introductory meeting."
                ),
                "persona_notes": (
                    "Sara Andersson is a practical BRF board member. She is busy, careful with "
                    "supplier changes, and only becomes interested if the rep connects the call "
                    "to stairwell cleanliness, resident complaints, supplier "
                    "reliability, or board workload."
                ),
            },
            {
                "business_id": business_id,
                "scenario_slug": "hot_call",
                "title": "Hot Call",
                "objective": (
                    "Guide an interested property-management buyer toward a walkthrough, quote, "
                    "or board discussion for Optimal Trappstadning."
                ),
                "persona_notes": (
                    "Johan Berg manages several apartment buildings. He is open to learning more, "
                    "but worries about switching effort, cleaning consistency, "
                    "budget fit, and whether "
                    "the board will see a clear reason to compare suppliers."
                ),
            },
            {
                "business_id": business_id,
                "scenario_slug": "directsales",
                "title": "Direct Sales",
                "objective": (
                    "Handle final commercial concerns and earn a clear cleaning-service commitment "
                    "or approved quote process."
                ),
                "persona_notes": (
                    "Emma Karlsson chairs a BRF board that is close to a decision. "
                    "She wants practical answers about monthly cost, switching from "
                    "the current supplier, quality follow-up, "
                    "contract timing, and what happens after approval."
                ),
            },
            {
                "business_id": business_id,
                "scenario_slug": "meeting",
                "title": "Meeting",
                "objective": (
                    "Run a structured supplier-evaluation meeting and secure a "
                    "walkthrough, quote review, "
                    "or board-ready proposal."
                ),
                "persona_notes": (
                    "Daniel Svensson is a board chair evaluating cleaning quality "
                    "for shared spaces. He cares about resident satisfaction, "
                    "reliable routines, budget, contract timing, "
                    "and avoiding extra work for the board."
                ),
            },
        ]
    )
    .execute()
)

print("Created Optimal Trappstadning scenario configs")
print(f"\nSeed data created! Use rep_id={rep_id} for testing.")
