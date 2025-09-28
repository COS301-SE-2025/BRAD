# tests/integration/test_worker_integration.py
import pytest
from importlib import reload


@pytest.mark.integration
def test_worker_processes_report_function_path(monkeypatch, capsys):
    # Minimal env to satisfy imports/paths
    monkeypatch.setenv("API_URL", "http://fake-api")
    monkeypatch.setenv("BOT_ACCESS_KEY", "k")
    monkeypatch.setenv("SCREENSHOTS_DIR", "/tmp/screenshots")
    monkeypatch.setenv("PROXY_URL", "")
    monkeypatch.setenv("PW_CONTEXTS_PER_IP", "1")

    # ---- stub Docker so no real container is launched ----
    captured = {}
    class _FakeContainer:
        id = "deadbeefcafe"  # short for logs

    class _FakeContainers:
        def run(self, image, **kwargs):
            captured["image"] = image
            captured["kwargs"] = kwargs
            return _FakeContainer()

    class _FakeDockerClient:
        containers = _FakeContainers()

    import docker
    monkeypatch.setattr(docker, "from_env", lambda: _FakeDockerClient())

    # ---- stub reporter to avoid real HTTP anywhere else ----
    import src.utils.reporter as reporter
    monkeypatch.setattr(reporter, "report_analysis", lambda *a, **k: True)

    # Import worker fresh so it sees the env/stubs
    import bot.src.worker as worker
    reload(worker)
    import io, logging
    log_buf = io.StringIO()
    handler = logging.StreamHandler(log_buf)
    handler.setLevel(logging.INFO)
    worker.logger.addHandler(handler)

    # Call the actor body whether it's an Actor or a plain function
    payload = {"report_id": "it-999", "domain": "https://example.com"}
    proc = getattr(worker, "process_report")
    if hasattr(proc, "fn"):
        proc.fn(payload)          # Dramatiq Actor
    else:
        proc(payload)             # Plain function

    # Assert container launch params
    assert captured["image"] == "brad-bot-runner:latest"
    env = captured["kwargs"]["environment"]
    assert env["TARGET_URL"] == "https://example.com"
    assert env["REPORT_ID"] == "it-999"
    assert env["API_URL"] == "http://fake-api"
    assert env["BOT_ACCESS_KEY"] == "k"

    # Capture stdout/stderr ONCE after the call
    text = log_buf.getvalue()
    assert "[DISPATCHER] Spawning sandbox" in text
    assert "Sandbox" in text
