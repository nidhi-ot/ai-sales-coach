"""Seed test data for development."""

import uuid

from app.db.client import supabase


business = (
    supabase.table("business_profiles")
    .insert(
        {
            "name": "Optimal Trappstädning",
            "framework": "BANT",
            "context_data": {
                "industry": "B2B stairwell cleaning",
                "typical_objections": [
                    "Already have a supplier",
                    "Too expensive",
                    "Not looking to switch right now",
                ],
                "value_props": [
                    "Eco-friendly products",
                    "24/7 emergency service",
                    "Flexible contracts",
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
