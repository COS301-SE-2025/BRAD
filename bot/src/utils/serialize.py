from datetime import datetime

def serialize(obj):
    if isinstance(obj, dict):
        return {k: serialize(v) for k, v in obj.items() if v not in (None, [], {}, "")}
    if isinstance(obj, list):
        return [serialize(i) for i in obj if i not in (None, "", [])]
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj
