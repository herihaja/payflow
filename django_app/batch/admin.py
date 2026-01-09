from django.contrib import admin

from .models import BatchUpload, BatchItem


@admin.register(BatchUpload)
class BatchUploadAdmin(admin.ModelAdmin):
    list_display = ('id', 'original_filename', 'status', 'created_at', 'uploaded_by', 'total_rows', 'processed_rows', 'errors')
    readonly_fields = ('created_at',)


@admin.register(BatchItem)
class BatchItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'batch', 'row_number', 'phone', 'amount', 'status', 'processed_at')
    list_filter = ('status',)
    search_fields = ('phone',)
