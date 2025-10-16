#bot-runner/src/utils/sem.py
import time, uuid, os, redis

r = redis.Redis(
    host=os.getenv("REDIS_HOST", "brad-redis"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    password=os.getenv("REDIS_PASSWORD") or None,
    decode_responses=True,
)

def acquire(key: str, limit: int, ttl: int = 180) -> str:
    token = str(uuid.uuid4())
    now = time.time()
    while True:
        r.zremrangebyscore(key, "-inf", now - 1)  # drop stale holders
        pipe = r.pipeline()
        pipe.zadd(key, {token: now + ttl})
        pipe.zcard(key)
        ok = pipe.execute()[1] <= limit
        if ok:
            return token
        r.zrem(key, token)
        time.sleep(0.25)
        now = time.time()

def release(key: str, token: str):
    r.zrem(key, token)
