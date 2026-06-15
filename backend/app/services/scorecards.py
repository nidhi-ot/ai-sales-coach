from app.db.client import get_supabase


async def create_scorecard_stub(session_id: str, rep_id: str, business_id: str):
    supabase = get_supabase()
    result = supabase.table("scorecards").upsert({
        "session_id": session_id,
        "rep_id": rep_id,
        "business_id": business_id,
        "call_duration_seconds": 0,
        "rep_talk_percentage": 0.0,
        "interruptions_count": 0,
        "filler_words_count": 0,
        "rapport_score": 5,
        "needs_discovery_score": 5,
        "objection_handling_score": 5,
        "closing_score": 5,
        "overall_score": 5,
        "strengths": [],
        "improvement_areas": [],
        "feedback_summary": "Analysis pending (stub)."
    }, on_conflict="session_id").execute()

    return result.data[0]