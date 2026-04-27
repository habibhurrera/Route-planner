from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health'),
    path('calculate-trip/', views.calculate_trip, name='calculate_trip'),
]
