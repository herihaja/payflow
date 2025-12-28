from django.urls import path
from .views import BatchUploadCreateView, BatchUploadDetailView, BatchItemListView

urlpatterns = [
    path('', BatchUploadCreateView.as_view(), name='batch-upload-create'),
    path('<int:pk>/', BatchUploadDetailView.as_view(), name='batch-upload-detail'),
    path('<int:batch_id>/items/', BatchItemListView.as_view(), name='batch-items-list'),
]
