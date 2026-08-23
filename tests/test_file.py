import pytest

from fantasy_football_extension.models import Player
from fantasy_football_extension.utils import calculate_vorp_and_voas


def test_sanity():
    assert 1 + 1 == 2

def test_calculate_vorp_and_voas_basic():
    # create 3 QBs with projections
    p1 = Player.objects.create(
        first_name="Tom", last_name="Brady", position="QB", team_name="TB",
        projected_points_cbs_ppr=300, projected_points_espn_ppr=290, projected_points_draft_sharks_ppr=310,
    )
    p2 = Player.objects.create(
        first_name="Peyton", last_name="Manning", position="QB", team_name="DEN",
        projected_points_cbs_ppr=280, projected_points_espn_ppr=275, projected_points_draft_sharks_ppr=285,
    )
    p3 = Player.objects.create(
        first_name="Aaron", last_name="Rodgers", position="QB", team_name="GB",
        projected_points_cbs_ppr=260, projected_points_espn_ppr=255, projected_points_draft_sharks_ppr=265,
    )

    results = calculate_vorp_and_voas(num_teams=1, starting_spots={"QB": 1})
    qbs = [r for r in results if r["position"] == "QB"]

    # Avg projections calculated correctly
    assert next(r for r in qbs if r["name"] == "Tom Brady")["avg_proj"] == pytest.approx(300.0)

    # Replacement is QB #1 for 1 team → cutoff 0 → replacement value = top QB
    tom = next(r for r in qbs if r["name"] == "Tom Brady")
    assert tom["replacement_value"] == pytest.approx(300.0)
    assert tom["vorp"] == pytest.approx(0.0)  # top player vs himself is 0

    # Peyton should have VORP negative
    peyton = next(r for r in qbs if r["name"] == "Peyton Manning")
    assert peyton["vorp"] < 0