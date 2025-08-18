from fastapi import FastAPI
from pydantic import BaseModel
import dramatiq
from dramatiq.brokers.redis import RedisBroker
import os

# Redis broker setup
broker = RedisBroker(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    password=os.getenv("REDIS_PASSWORD")
)
dramatiq.set_broker(broker)

from worker import process_report

app = FastAPI()

class Job(BaseModel):
    domain: str
    report_id: str

@app.post("/queue")
async def queue_job(job: Job):
    process_report.send(job.dict())
    return {"status": "queued"}
