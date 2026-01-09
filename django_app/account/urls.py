from django.urls import path
from .views import CustomObtainAuthToken

urlpatterns = [
    path("login", CustomObtainAuthToken.as_view()),
]
