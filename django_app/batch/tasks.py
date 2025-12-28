import logging
import time
import random

from celery import shared_task
from django.db import transaction, models
from django.utils import timezone

from .models import BatchItem, BatchUpload

logger = logging.getLogger(__name__)


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

    # Simulate network/USSD processing delay
    time.sleep(1)

    # Mocked outcome: 90% success
    success = random.random() < 0.9

    if success:
        item.mark_success(message='Mocked USSD: OK')
        # update batch processed_rows counters
        BatchUpload.objects.filter(id=item.batch_id).update(processed_rows=models.F('processed_rows') + 1)
    else:
        item.mark_failed(message='Mocked USSD: FAILED')
        BatchUpload.objects.filter(id=item.batch_id).update(errors=models.F('errors') + 1)

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
