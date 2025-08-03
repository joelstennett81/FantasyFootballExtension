from django.urls import path
from .views import *
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('player_rankings/', player_rankings, name='player_rankings'),
    path('register/', register_user),
    path("login/", login_user),
]
