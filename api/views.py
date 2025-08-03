from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework import status
from fantasy_football_extension.utils import calculate_vorp_and_voas
import re


@api_view(['POST'])
def player_rankings(request):
    data = request.data
    num_teams = data.get("num_teams", 12)
    ppr_type = data.get("ppr_type", "full")
    starting_spots = data.get("starting_spots", {
        "QB": 1, "RB": 2, "WR": 2, "TE": 1, "FLEX": 1, "K": 1, "DEF": 1
    })
    position = data.get("position", "all").upper()
    sort_by = data.get("sort_by", "vorp")  # default sort by VORP

    results = calculate_vorp_and_voas(num_teams=num_teams, starting_spots=starting_spots, ppr_type=ppr_type)

    if position != "ALL":
        results = [r for r in results if r["position"] == position]

    if sort_by in ["avg_proj", "vorp", "voas"]:
        results.sort(key=lambda x: x.get(sort_by, 0), reverse=True)

    return Response(results)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([])  # No token auth needed for login/register
@permission_classes([AllowAny])
def register_user(request):
    email = request.data.get("email", "").strip().lower()
    password = request.data.get("password", "").strip()
    first_name = request.data.get("first_name", "").strip()
    last_name = request.data.get("last_name", "").strip()

    # Validate required fields
    if not email or not password or not first_name or not last_name:
        return Response({"error": "All fields are required."}, status=status.HTTP_400_BAD_REQUEST)

    # Validate email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return Response({"error": "Invalid email address."}, status=status.HTTP_400_BAD_REQUEST)

    # Validate password
    if len(password) < 6:
        return Response({"error": "Password must be at least 6 characters long."}, status=status.HTTP_400_BAD_REQUEST)

    # Check for existing email
    if User.objects.filter(username=email).exists():
        return Response({"error": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

    # Create user (use email as username)
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )

    return Response({"message": "User registered successfully."}, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([])  # disable default auth for login
@permission_classes([AllowAny])
def login_user(request):
    email = request.data.get("username", "").strip().lower()
    password = request.data.get("password", "").strip()

    if not email or not password:
        return Response({"error": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=email, password=password)
    if user is not None:
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key})
    else:
        return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
