from django.urls import path
from .views import *

urlpatterns = [
    path('', home_page, name='home_page'),
    path('player_rankings/', view_player_rankings, name='view_player_rankings'),
]
