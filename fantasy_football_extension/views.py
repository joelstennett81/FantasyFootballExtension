from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import render, redirect
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .forms import CustomUserCreationForm
from .utils import calculate_vorp_and_voas


def view_player_rankings(request):
    return render(request, 'player_rankings.html')


def home_page(request):
    return render(request, 'home.html')


# Simple register form

def register_view(request):
    if request.method == "POST":
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect("home_page")
    else:
        form = CustomUserCreationForm()
    return render(request, "register.html", {"form": form})
def logout_view(request):
    logout(request)
    return redirect("home_page")
