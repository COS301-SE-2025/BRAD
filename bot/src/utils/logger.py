import logging
import os
import sys
import contextvars

# -------- Correlation ID (per job) --------
report_id_ctx = contextvars.ContextVar("report_id", default="-")

class JobContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.report_id = report_id_ctx.get()
        return True

# -------- Formatter helpers --------
class PlainFormatter(logging.Formatter):
    def __init__(self):
        super().__init__(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] [rid=%(report_id)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)

    # Avoid duplicate handlers + stop propagation to root (kills duplicate lines)
    if logger.handlers:
        return logger
    logger.propagate = False

    # Levels & format toggles
    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    use_json = os.getenv("LOG_JSON", "0") == "1"

    logger.setLevel(getattr(logging, level_name, logging.INFO))

    stream = logging.StreamHandler(sys.stdout)
    stream.setLevel(logger.level)
    stream.addFilter(JobContextFilter())

    if use_json:
        # Optional JSON output (requires python-json-logger). Falls back to plain if missing.
        try:
            from pythonjsonlogger import jsonlogger
            stream.setFormatter(jsonlogger.JsonFormatter(
                "%(asctime)s %(levelname)s %(name)s %(report_id)s %(message)s"
            ))
        except Exception:
            stream.setFormatter(PlainFormatter())
    else:
        stream.setFormatter(PlainFormatter())

    logger.addHandler(stream)
    return logger
