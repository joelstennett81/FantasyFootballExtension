from django.urls import path
from .views import *

urlpatterns = [
    path('player_rankings/', player_rankings, name='player_rankings'),
]
