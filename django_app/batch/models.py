from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone


class BatchUpload(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_PROCESSING = 'processing'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
    ]

    created_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        get_user_model(), on_delete=models.SET_NULL, null=True, blank=True
    )
    original_filename = models.CharField(max_length=255, blank=True)
    file = models.FileField(upload_to='batches/')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    total_rows = models.IntegerField(default=0)
    processed_rows = models.IntegerField(default=0)
    errors = models.IntegerField(default=0)

    def __str__(self):
        return f"Batch {self.id} ({self.status})"


class BatchItem(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_PROCESSING = 'processing'
    STATUS_SUCCESS = 'success'
    STATUS_FAILED = 'failed'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_SUCCESS, 'Success'),
        (STATUS_FAILED, 'Failed'),
    ]

    batch = models.ForeignKey(BatchUpload, related_name='items', on_delete=models.CASCADE)
    row_number = models.IntegerField()
    phone = models.CharField(max_length=32)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    result_message = models.TextField(blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    attempt_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def mark_processing(self):
        self.status = self.STATUS_PROCESSING
        self.attempt_count += 1
        self.save(update_fields=['status', 'attempt_count'])

    def mark_success(self, message=''):
        self.status = self.STATUS_SUCCESS
        self.result_message = message
        self.processed_at = timezone.now()
        self.save(update_fields=['status', 'result_message', 'processed_at'])

    def mark_failed(self, message=''):
        self.status = self.STATUS_FAILED
        self.result_message = message
        self.processed_at = timezone.now()
        self.save(update_fields=['status', 'result_message', 'processed_at'])
