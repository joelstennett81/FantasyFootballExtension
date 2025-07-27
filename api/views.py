from rest_framework.decorators import api_view
from rest_framework.response import Response

from fantasy_football_extension.utils import calculate_vorp_and_voas


@api_view(['POST'])
def player_rankings(request):
    data = request.data
    num_teams = data.get("num_teams", 12)
    ppr_type = data.get("ppr_type", "full")  # default to full PPR
    starting_spots = data.get("starting_spots", {
        "QB": 1, "RB": 2, "WR": 2, "TE": 1, "FLEX": 1, "K": 1, "DEF": 1
    })

    results = calculate_vorp_and_voas(num_teams=num_teams, starting_spots=starting_spots, ppr_type=ppr_type)
    return Response(results)