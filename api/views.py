from rest_framework.decorators import api_view
from rest_framework.response import Response
from fantasy_football_extension.utils import calculate_vorp_and_voas


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
