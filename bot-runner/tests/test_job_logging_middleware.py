# tests/test_job_logging_middleware.py
import types
import pytest

import src.utils.job_logging_middleware as JLM


class FakeCtx:
    """Minimal contextvar-like stub to track set/reset calls."""
    def __init__(self):
        self.set_calls = []
        self.reset_calls = []

    def set(self, rid):
        self.set_calls.append(rid)
        # return a token we can later verify was passed to reset
        return f"tok-{rid}"

    def reset(self, token):
        self.reset_calls.append(token)


class FakeLogger:
    def __init__(self):
        self.info_msgs = []
        self.error_msgs = []
        self.warning_msgs = []

    def info(self, msg, *a, **k): self.info_msgs.append(str(msg))
    def error(self, msg, *a, **k): self.error_msgs.append(str(msg))
    def warning(self, msg, *a, **k): self.warning_msgs.append(str(msg))


class DummyMsg:
    """Mimic dramatiq Message object enough for our middleware."""
    def __init__(self, *, args=None, kwargs=None, actor_name="act", msg_id="m1", queue="q1"):
        self.args = args or []
        self.kwargs = kwargs or {}
        self.actor_name = actor_name
        self.message_id = msg_id
        self.queue_name = queue


def _mk_mw(monkeypatch):
    """Create middleware with report_id_ctx + logger stubbed."""
    fake_ctx = FakeCtx()
    fake_log = FakeLogger()
    monkeypatch.setattr(JLM, "report_id_ctx", fake_ctx)
    monkeypatch.setattr(JLM, "log", fake_log)
    mw = JLM.JobLoggingMiddleware()
    return mw, fake_ctx, fake_log


def test_before_process_message_uses_kwargs_sets_ctx_and_logs(monkeypatch):
    mw, ctx, flog = _mk_mw(monkeypatch)
    msg = DummyMsg(kwargs={"report_id": "RID123", "domain": "example.com"},
                   actor_name="process_report", msg_id="abc", queue="high")

    mw.before_process_message(None, msg)

    # contextvar set & token stored on message
    assert ctx.set_calls == ["RID123"]
    assert getattr(msg, "_rid_token") == "tok-RID123"

    # log line present in stubbed logger
    assert any(
        "[Queue] Dequeued process_report" in m and "msg_id=abc" in m and "queue=high" in m
        for m in flog.info_msgs
    )


def test_before_process_message_falls_back_to_args(monkeypatch):
    mw, ctx, _ = _mk_mw(monkeypatch)
    # payload provided as the first positional arg (dict)
    msg = DummyMsg(args=[{"reportId": "RIDZ", "domain": "d.com"}])
    mw.before_process_message(None, msg)

    assert ctx.set_calls == ["RIDZ"]
    assert getattr(msg, "_rid_token") == "tok-RIDZ"


def test_before_process_message_no_payload_defaults(monkeypatch):
    mw, ctx, _ = _mk_mw(monkeypatch)
    msg = DummyMsg()  # no args/kwargs

    mw.before_process_message(None, msg)

    assert ctx.set_calls == ["-"]  # default report id
    assert getattr(msg, "_rid_token") == "tok--"  # token echoes rid


def test_after_process_message_success_resets_and_logs(monkeypatch):
    mw, ctx, flog = _mk_mw(monkeypatch)
    msg = DummyMsg(actor_name="worker", msg_id="m42")
    # simulate before hook ran
    msg._rid_token = "tok-RIDX"

    mw.after_process_message(None, msg, result={"ok": True}, exception=None)

    # reset called with the same token
    assert ctx.reset_calls == ["tok-RIDX"]
    # info log acknowledging message
    assert any("Acked worker" in m and "m42" in m for m in flog.info_msgs)


def test_after_process_message_error_resets_and_logs_error(monkeypatch):
    mw, ctx, flog = _mk_mw(monkeypatch)
    msg = DummyMsg(actor_name="worker", msg_id="m99")
    msg._rid_token = "tok-ERR"

    mw.after_process_message(None, msg, result=None, exception=RuntimeError("boom"))

    assert ctx.reset_calls == ["tok-ERR"]
    assert any("Failed worker" in m and "m99" in m for m in flog.error_msgs)


def test_after_skip_message_logs_warning(monkeypatch):
    mw, _, flog = _mk_mw(monkeypatch)
    msg = DummyMsg(actor_name="actorX", msg_id="mx")

    mw.after_skip_message(None, msg)

    assert any("Skipped actorX" in m and "mx" in m for m in flog.warning_msgs)
