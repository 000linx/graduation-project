import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from ..models.user_model import User
from .. import extensions

logger = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None


def process_expired_deletions():
    if extensions.mongo is None:
        logger.warning("MongoDB not available, skipping deletion cleanup")
        return

    try:
        expired_users = User.find_expired_deletions()
        if not expired_users:
            return

        logger.info("Found %d expired deletion requests, starting anonymization", len(expired_users))
        count = 0
        for user in expired_users:
            user_id = user.get("_id")
            try:
                result = User.anonymize_user(user_id)
                if result and result.modified_count > 0:
                    count += 1
                    logger.info("Anonymized account: %s", user_id)
            except Exception as exc:
                logger.exception("Failed to anonymize user %s: %s", user_id, exc)

        logger.info("Deletion cleanup completed: %d/%d accounts anonymized", count, len(expired_users))
    except Exception as exc:
        logger.exception("Deletion cleanup task failed: %s", exc)


def init_deletion_scheduler(app):
    global _scheduler

    if _scheduler is not None:
        return

    _scheduler = BackgroundScheduler(daemon=True)

    _scheduler.add_job(
        process_expired_deletions,
        trigger="interval",
        hours=1,
        id="deletion_cleanup",
        name="Account Deletion Cleanup",
        replace_existing=True,
        max_instances=1,
        misfire_grace_time=300
    )

    _scheduler.start()
    logger.info("Account deletion scheduler started (check interval: 1 hour)")

    app.extensions["deletion_scheduler"] = _scheduler


def shutdown_deletion_scheduler():
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Account deletion scheduler shut down")
