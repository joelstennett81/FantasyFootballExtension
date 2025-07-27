from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .utils import calculate_vorp_and_voas

def view_player_rankings(request):
    return render(request, 'player_rankings.html')

def home_page(request):
    return render(request, 'home.html')