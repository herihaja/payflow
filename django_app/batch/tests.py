from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from .models import BatchUpload, BatchItem
from decimal import Decimal
from django.utils import timezone

User = get_user_model()


class BatchItemListTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='alice', password='password')
        self.other = User.objects.create_user(username='bob', password='password')
        self.batch = BatchUpload.objects.create(original_filename='test.xlsx', uploaded_by=self.user)

        # create 30 items
        for i in range(1, 31):
            BatchItem.objects.create(
                batch=self.batch,
                row_number=i,
                phone=f'+123456{i:03d}',
                amount=Decimal('10.00') + i,
                status=BatchItem.STATUS_SUCCESS if i % 3 == 0 else BatchItem.STATUS_PENDING,
                processed_at=timezone.now() if i % 2 == 0 else None,
            )

    def test_unauthenticated_get_denied(self):
        url = reverse('batch-items-list', kwargs={'batch_id': self.batch.id})
        resp = self.client.get(url)
        self.assertIn(resp.status_code, (401, 403))

    def test_owner_can_get_with_pagination(self):
        url = reverse('batch-items-list', kwargs={'batch_id': self.batch.id})
        client = APIClient()
        client.force_authenticate(user=self.user)
        resp = client.get(url, {'page_size': 10, 'page': 2})
        self.assertEqual(resp.status_code, 200)
        self.assertIn('results', resp.data)
        self.assertEqual(len(resp.data['results']), 10)
        self.assertEqual(resp.data['count'], 30)

    def test_filter_by_status_and_phone(self):
        url = reverse('batch-items-list', kwargs={'batch_id': self.batch.id})
        client = APIClient()
        client.force_authenticate(user=self.user)
        resp = client.get(url, {'status': BatchItem.STATUS_SUCCESS, 'phone': '123456006'})
        self.assertEqual(resp.status_code, 200)
        # there is one item with phone ending 006 and status success (i=6)
        self.assertEqual(resp.data['count'], 1)

    def test_other_user_cannot_view_unless_staff(self):
        url = reverse('batch-items-list', kwargs={'batch_id': self.batch.id})
        client = APIClient()
        client.force_authenticate(user=self.other)
        resp = client.get(url)
        self.assertEqual(resp.status_code, 403)

        # make bob staff
        self.other.is_staff = True
        self.other.save()
        client.force_authenticate(user=self.other)
        resp2 = client.get(url)
        self.assertEqual(resp2.status_code, 200)
