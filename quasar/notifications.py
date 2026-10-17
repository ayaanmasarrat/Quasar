"""Preview only: no contact data, network client, queue, storage, or delivery."""

from .pipeline import collection


def preview(payload: dict) -> dict:
    if not isinstance(payload, dict):
        raise ValueError("Body must be an object")
    if payload.get("opt_in") is not True:
        raise ValueError("Explicit opt_in=true is required for a simulated notification")
    channel = payload.get("channel", "email")
    if channel not in ("email", "sms"):
        raise ValueError("channel must be email or sms")
    ids = payload.get("property_ids")
    if not isinstance(ids, list) or not ids or len(ids) > 100 or any(not isinstance(i, str) for i in ids):
        raise ValueError("property_ids must contain 1-100 demo IDs")
    data = collection(payload.get("scenario", "baseline"))
    by_id = {f["id"]: f["properties"] for f in data["features"]}
    if any(i not in by_id for i in ids):
        raise ValueError("Unknown demo property ID")
    messages = []
    for identifier in dict.fromkeys(ids):
        risk = by_id[identifier]["risk"]
        if risk["band"] == "elevated":
            messages.append({"property_id": identifier, "channel": channel,
                             "delivery_status": "simulated_only",
                             "text": f"DEMO ONLY: {identifier} has an illustrative relative score of {risk['score']}/100. "
                                     "This is not an official warning. Follow NWS and local emergency guidance."})
    return {"mode": "simulation", "sent_count": 0, "preview_count": len(messages),
            "messages": messages, "scenario": data["scenario"]["id"]}
