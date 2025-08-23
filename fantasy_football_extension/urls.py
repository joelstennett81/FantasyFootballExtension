from django.urls import path
from .views import *
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('', home_page, name='home_page'),
    path('player_rankings/', view_player_rankings, name='view_player_rankings'),
    path("register/", register_view, name="register"),
    path("login/", auth_views.LoginView.as_view(template_name="login.html"), name="login"),
    path("logout/", logout_view, name="logout"),
]
