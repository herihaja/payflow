import io
import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated

from openpyxl import load_workbook
from django.db import transaction

from .models import BatchUpload, BatchItem
from .serializers import BatchUploadSerializer, BatchUploadCreateSerializer, BatchItemSerializer
from .tasks import process_batch_item

logger = logging.getLogger(__name__)


class BatchUploadCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, format=None):
        serializer = BatchUploadCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file_obj = serializer.validated_data['file']

        # Create the BatchUpload record
        batch = BatchUpload.objects.create(
            original_filename=getattr(file_obj, 'name', ''),
            file=file_obj,
            status=BatchUpload.STATUS_PROCESSING,
            uploaded_by=request.user,
        )

        # Parse Excel and create items
        try:
            in_memory = file_obj.read()
            wb = load_workbook(filename=io.BytesIO(in_memory), data_only=True)
            sheet = wb.active

            rows = list(sheet.iter_rows(values_only=True))
            if not rows:
                raise ValueError('Uploaded file is empty')

            # Expect header on first row with 'phone' and 'amount' or assume first two columns
            header = [str(h).strip().lower() if h is not None else '' for h in rows[0]]
            has_header = 'phone' in header and 'amount' in header

            data_rows = rows[1:] if has_header else rows

            created_items = []
            with transaction.atomic():
                for i, row in enumerate(data_rows, start=1):
                    if not row or row[0] is None:
                        continue
                    if has_header:
                        phone = row[header.index('phone')]
                        amount = row[header.index('amount')]
                    else:
                        phone = row[0]
                        amount = row[1] if len(row) > 1 else None

                    if phone is None or amount is None:
                        # skip invalid rows
                        continue

                    item = BatchItem.objects.create(
                        batch=batch,
                        row_number=i,
                        phone=str(phone).strip(),
                        amount=round(float(amount), 2),
                    )
                    created_items.append(item)

            batch.total_rows = len(created_items)
            batch.save(update_fields=['total_rows'])

            # Enqueue tasks for each item (auto-start)
            for item in created_items:
                process_batch_item.apply_async(args=(item.id,))

            response = BatchUploadSerializer(batch)
            return Response(response.data, status=status.HTTP_201_CREATED)

        except Exception as exc:
            logger.exception('Failed to parse or process uploaded batch')
            batch.status = BatchUpload.STATUS_FAILED
            batch.save(update_fields=['status'])
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class BatchUploadDetailView(generics.RetrieveAPIView):
    queryset = BatchUpload.objects.all()
    serializer_class = BatchUploadSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class BatchItemListView(generics.ListAPIView):
    serializer_class = BatchItemSerializer

    def get_queryset(self):
        batch_id = self.kwargs.get('batch_id')
        return BatchItem.objects.filter(batch_id=batch_id)
