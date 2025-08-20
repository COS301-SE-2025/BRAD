import dramatiq

@dramatiq.actor
def process_report(data):
    print(f"[QUEUE] Enqueued domain {data.get('domain')} with ID {data.get('report_id')}")
