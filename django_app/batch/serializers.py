from rest_framework import serializers
from .models import BatchUpload, BatchItem
from account.serializers import UserSerializer


class BatchItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BatchItem
        fields = ('id', 'row_number', 'phone', 'amount', 'status', 'result_message', 'processed_at', 'attempt_count')


class BatchUploadSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = BatchUpload
        fields = ('id', 'original_filename', 'status', 'created_at', 'total_rows', 'processed_rows', 'errors', 'uploaded_by')


class BatchUploadCreateSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)

    class Meta:
        model = BatchUpload
        fields = ('file',)
