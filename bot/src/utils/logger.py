#logger.py
"""
Centralized logging setup for the bot.
- Provides a logger with correlation ID support for job tracking.
- Configures both console and file handlers with appropriate formatters.
"""


import logging, os, sys, contextvars, pathlib
from logging.handlers import RotatingFileHandler

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
    if logger.handlers:
        return logger
    logger.propagate = False

    level_name = os.getenv("LOG_LEVEL", "INFO").upper()
    use_json = os.getenv("LOG_JSON", "0") == "1"
    logger.setLevel(getattr(logging, level_name, logging.INFO))

    # stdout handler (existing)
    stream = logging.StreamHandler(sys.stdout)
    stream.setLevel(logger.level)
    stream.addFilter(JobContextFilter())
    # set JSON or plain formatter (same as you have now) ...
    # stream.setFormatter(...)

    logger.addHandler(stream)

    # file handler (new)
    if os.getenv("LOG_TO_FILE", "1") == "1":
        log_dir = os.getenv("LOG_DIR", "/app/logs")
        pathlib.Path(log_dir).mkdir(parents=True, exist_ok=True)

        max_bytes = int(os.getenv("LOG_FILE_MAX_BYTES", "5242880"))  # 5MB
        backup_count = int(os.getenv("LOG_BACKUP_COUNT", "5"))
        log_path = os.path.join(log_dir, os.getenv("LOG_FILE_NAME", "bot.log"))

        fh = RotatingFileHandler(log_path, maxBytes=max_bytes, backupCount=backup_count)
        fh.setLevel(logger.level)
        fh.addFilter(JobContextFilter())
        # use same formatter as stream
        try:
            if use_json:
                from pythonjsonlogger import jsonlogger
                fh.setFormatter(jsonlogger.JsonFormatter(
                    "%(asctime)s %(levelname)s %(name)s %(report_id)s %(message)s"
                ))
            else:
                fh.setFormatter(PlainFormatter())
        except Exception:
            fh.setFormatter(PlainFormatter())

        logger.addHandler(fh)

    return logger
