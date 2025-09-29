import dramatiq
from typing import Any, Dict
from src.utils.logger import get_logger, report_id_ctx

log = get_logger("queue")

def _extract_payload(message) -> Dict[str, Any]:
    # Your actor gets one dict arg: process_report(data)
    if message.kwargs:
        return dict(message.kwargs)
    if message.args and isinstance(message.args[0], dict):
        return dict(message.args[0])
    return {}

class JobLoggingMiddleware(dramatiq.Middleware):
    def before_process_message(self, broker, message):
        data = _extract_payload(message)
        rid = data.get("report_id") or data.get("reportId") or "-"
        domain = data.get("domain", "")
        # set correlation id for all logs in this thread
        token = report_id_ctx.set(rid)
        # stash token so we can reset it later
        message._rid_token = token

        log.info(
            f"[Queue] Dequeued {message.actor_name} "
            f"msg_id={message.message_id} queue={getattr(message, 'queue_name', '')} "
            f"domain={domain}"
        )

    def after_process_message(self, broker, message, *, result=None, exception=None):
        # reset correlation id
        token = getattr(message, "_rid_token", None)
        if token:
            report_id_ctx.reset(token)

        if exception is None:
            log.info(f"[Queue] Acked {message.actor_name} msg_id={message.message_id}")
        else:
            log.error(
                f"[Queue] Failed {message.actor_name} msg_id={message.message_id}: {exception}",
                exc_info=True,
            )

    def after_skip_message(self, broker, message):
        log.warning(f"[Queue] Skipped {message.actor_name} msg_id={message.message_id}")
