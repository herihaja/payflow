import logging
import time
import random
import os
import pusher

from celery import shared_task
from django.db import transaction, models
from django.utils import timezone

from .models import BatchItem, BatchUpload

logger = logging.getLogger(__name__)

def get_pusher_client():
    return pusher.Pusher(
        app_id=os.environ.get("SOKETI_APP_ID", "1"),
        key=os.environ.get("SOKETI_APP_KEY", "devkey"),
        secret=os.environ.get("SOKETI_APP_SECRET", "devsecret"),
        host=os.environ.get("SOKETI_HOST", "soketi"),
        port=int(os.environ.get("SOKETI_PORT", 6001)),
        ssl=False,
    )


def _publish_item_update(item):
    """Publish an item_update event for the item's batch channel."""
    try:
        _pusher_client = get_pusher_client()
        data = {
            'type': 'item_update',
            'item': {
                'id': item.id,
                'batch': item.batch_id,
                'row_number': item.row_number,
                'phone': item.phone,
                'amount': float(item.amount) if item.amount is not None else None,
                'status': item.status,
                'result_message': item.result_message,
                'processed_at': item.processed_at.isoformat() if item.processed_at else None,
            },
        }
        # Trigger on the Pusher-compatible channel (e.g., 'batches.<id>')
        _pusher_client.trigger(f'batches.{item.batch_id}', 'item_update', data)
    except Exception:
        logger.exception('Failed to publish item update for item %s', getattr(item, 'id', None))

def _publish_batch_update(batch):
    """Publish an batch_update event for the batch channel."""
    try:
        _pusher_client = get_pusher_client()
        data = {
            'type': 'batch_update',
            'batch': {
                'id': batch.id,
                'status': batch.status,
            },
        }
        # Trigger on the Pusher-compatible channel (e.g., 'batches.<id>')
        _pusher_client.trigger(f'batches.{batch.id}', 'batch_update', data)
    except Exception:
        logger.exception('Failed to publish batch update for batch %s', getattr(batch, 'id', None))


@shared_task(bind=True)
def process_batch_item(self, item_id):
    """Process a single BatchItem.

    For now this simulates sending a USSD to a modem and randomly succeeds/fails.
    The real modem integration will be implemented later.
    """
    try:
        item = BatchItem.objects.select_related('batch').get(id=item_id)
    except BatchItem.DoesNotExist:
        logger.exception("BatchItem %s does not exist", item_id)
        return

    if item.status == BatchItem.STATUS_SUCCESS:
        logger.info("BatchItem %s already succeeded", item_id)
        return

    item.mark_processing()
    _publish_item_update(item)

    # Simulate network/USSD processing delay
    time.sleep(10)

    # Mocked outcome: 90% success
    success = random.random() < 0.9

    if success:
        item.mark_success(message='Mocked USSD: OK')
        # update batch processed_rows counters
        BatchUpload.objects.filter(id=item.batch_id).update(processed_rows=models.F('processed_rows') + 1)
    else:
        item.mark_failed(message='Mocked USSD: FAILED')
        BatchUpload.objects.filter(id=item.batch_id).update(errors=models.F('errors') + 1)

    _publish_item_update(item)
    # If all items are processed, mark the batch completed
    batch = item.batch
    total = batch.items.count()
    processed = batch.items.filter(status=BatchItem.STATUS_SUCCESS).count()
    failed = batch.items.filter(status=BatchItem.STATUS_FAILED).count()

    if processed + failed >= total:
        # final status
        new_status = BatchUpload.STATUS_COMPLETED if failed == 0 else BatchUpload.STATUS_FAILED
        batch.status = new_status
        batch.save(update_fields=['status'])
        _publish_batch_update(batch)
