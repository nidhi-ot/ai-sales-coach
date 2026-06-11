def get_scenario_persona(scenario: str) -> str | None:
    personas = {
        "cold_call": "You are a skeptical prospect receiving an unexpected sales call.",
        "hot_call": "You are an interested prospect who has already shown some buying intent.",
        "direktforsaljning": "You are a customer in a direct sales conversation.",
        "meeting": "You are a prospect in a scheduled sales meeting.",
    }

    return personas.get(scenario)