# tests/test_logger.py
import os
import logging
from pathlib import Path
import importlib
import types
import pytest


def _reset_logger_state():
    """Remove handlers so get_logger() will reconfigure from env for each test."""
    import src.utils.logger as L
    lg = logging.getLogger("queue")  # use a fixed name for assertions
    for h in list(lg.handlers):
        lg.removeHandler(h)
        try:
            h.close()
        except Exception:
            pass
    # also clear other named loggers if added in future
    for name in list(logging.Logger.manager.loggerDict.keys()):
        lgr = logging.getLogger(name)
        for h in list(lgr.handlers):
            lgr.removeHandler(h)
            try:
                h.close()
            except Exception:
                pass


def _reload_logger_module(env: dict):
    """Reload module with env changes applied."""
    for k in ("LOG_LEVEL", "LOG_JSON", "LOG_TO_FILE", "LOG_DIR", "LOG_FILE_MAX_BYTES", "LOG_BACKUP_COUNT", "LOG_FILE_NAME"):
        os.environ.pop(k, None)
    os.environ.update(env)
    if "src.utils.logger" in importlib.sys.modules:
        importlib.sys.modules.pop("src.utils.logger")
    return importlib.import_module("src.utils.logger")


def test_get_logger_adds_handlers_once_and_honors_level(monkeypatch):
    L = _reload_logger_module({"LOG_LEVEL": "DEBUG", "LOG_TO_FILE": "0"})
    _reset_logger_state()
    logger = L.get_logger("queue")

    # first call configures exactly one stream handler, no file handler
    handlers1 = list(logger.handlers)
    assert any(isinstance(h, logging.StreamHandler) for h in handlers1)
    assert not any(h.__class__.__name__ == "RotatingFileHandler" for h in handlers1)
    assert logger.propagate is False
    assert logger.level == logging.DEBUG

    # second call should NOT add more handlers
    logger2 = L.get_logger("queue")
    assert logger2 is logger
    assert handlers1 == list(logger2.handlers)


def test_file_handler_created_and_contains_correlation_id(tmp_path):
    log_dir = tmp_path / "logs"
    L = _reload_logger_module({
        "LOG_LEVEL": "INFO",
        "LOG_TO_FILE": "1",
        "LOG_DIR": str(log_dir),
        "LOG_FILE_NAME": "bot.log",
        "LOG_JSON": "0",  # plain text formatter
    })
    _reset_logger_state()
    logger = L.get_logger("queue")

    # Should have a RotatingFileHandler and a StreamHandler
    fh = None
    sh_count = 0
    for h in logger.handlers:
        if h.__class__.__name__ == "RotatingFileHandler":
            fh = h
        if isinstance(h, logging.StreamHandler):
            sh_count += 1
        # The JobContextFilter should be attached to each handler
        assert any(f.__class__.__name__ == "JobContextFilter" for f in getattr(h, "filters", []))
    assert fh is not None
    assert sh_count >= 1

    # Set a correlation id and log
    tok = L.report_id_ctx.set("RID-123")
    try:
        logger.info("hello world")
    finally:
        L.report_id_ctx.reset(tok)

    # Flush handlers to ensure write
    for h in logger.handlers:
        try:
            h.flush()
        except Exception:
            pass

    # File should exist and contain the rid tag from PlainFormatter
    log_file = log_dir / "bot.log"
    assert log_file.exists()
    data = log_file.read_text(encoding="utf-8", errors="ignore")
    assert "hello world" in data
    # PlainFormatter: "[rid=RID-123]"
    assert "[rid=RID-123]" in data


def test_file_handler_disabled_when_flag_is_zero(tmp_path):
    L = _reload_logger_module({
        "LOG_TO_FILE": "0",
        "LOG_LEVEL": "INFO",
        "LOG_DIR": str(tmp_path),
    })
    _reset_logger_state()
    logger = L.get_logger("queue")

    assert not any(h.__class__.__name__ == "RotatingFileHandler" for h in logger.handlers)
    assert any(isinstance(h, logging.StreamHandler) for h in logger.handlers)


def test_stream_handler_has_filter_even_without_formatter():
    # This module currently doesn't set a specific stream formatter, but it should still attach the filter.
    L = _reload_logger_module({"LOG_TO_FILE": "0"})
    _reset_logger_state()
    logger = L.get_logger("queue")

    sh = next((h for h in logger.handlers if isinstance(h, logging.StreamHandler)), None)
    assert sh is not None
    assert any(f.__class__.__name__ == "JobContextFilter" for f in getattr(sh, "filters", []))


def test_json_formatter_path_does_not_crash(tmp_path, monkeypatch):
    """
    If LOG_JSON=1 and pythonjsonlogger is missing, code falls back to PlainFormatter.
    Ensure no exception and file is written either way.
    """
    # Simulate absence of pythonjsonlogger by removing it from sys.modules (if present)
    import sys
    sys.modules.pop("pythonjsonlogger", None)

    L = _reload_logger_module({
        "LOG_LEVEL": "INFO",
        "LOG_TO_FILE": "1",
        "LOG_JSON": "1",
        "LOG_DIR": str(tmp_path),
        "LOG_FILE_NAME": "jsonish.log",
    })
    _reset_logger_state()
    logger = L.get_logger("queue")

    # Log something; regardless of JSON availability, a file should be written
    logger.info("json-mode-test")

    for h in logger.handlers:
        try:
            h.flush()
        except Exception:
            pass

    f = tmp_path / "jsonish.log"
    assert f.exists()
    txt = f.read_text(encoding="utf-8", errors="ignore")
    assert "json-mode-test" in txt
