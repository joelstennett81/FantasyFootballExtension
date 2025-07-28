import csv
from .models import *


def calculate_vorp_and_voas(num_teams=12, starting_spots=None, ppr_type="ppr"):
    if starting_spots is None:
        starting_spots = {
            "QB": 1, "RB": 2, "WR": 2, "TE": 1, "FLEX": 1, "K": 1, "DEF": 1
        }

    # Determine projection field suffix
    suffix_map = {
        "ppr": "ppr",
        "std": "std"
    }
    suffix = suffix_map.get(ppr_type, "ppr")

    players = list(Player.objects.all())

    for p in players:
        try:
            projections = [
                getattr(p, f'projected_points_cbs_{suffix}'),
                getattr(p, f'projected_points_espn_{suffix}'),
            ]
            p.avg_proj = sum(projections) / len(projections)
        except Exception as e:
            p.avg_proj = 0.0

    pos_replacements = {pos: starting_spots.get(pos, 0) * num_teams for pos in ["QB", "RB", "WR", "TE", "K", "DEF"]}
    flex_count = starting_spots.get("FLEX", 0) * num_teams
    for pos in ["RB", "WR", "TE"]:
        pos_replacements[pos] += flex_count / 3

    results = []
    for pos, count in pos_replacements.items():
        pos_players = [p for p in players if p.position == pos]
        if not pos_players:
            continue

        pos_players.sort(key=lambda x: x.avg_proj, reverse=True)

        cutoff = int(count) - 1
        replacement_value = pos_players[cutoff].avg_proj if 0 <= cutoff < len(pos_players) else pos_players[-1].avg_proj

        avg_starter_count = min(int(count), len(pos_players))
        avg_starter_value = sum([p.avg_proj for p in pos_players[:avg_starter_count]]) / avg_starter_count

        for p in pos_players:
            vorp = p.avg_proj - replacement_value
            voas = p.avg_proj - avg_starter_value
            results.append({
                "name": f"{p.first_name} {p.last_name}",
                "position": p.position,
                "team": p.team_name,
                "avg_proj": round(p.avg_proj, 2),
                "replacement_value": round(replacement_value, 2),
                "average_starter_value": round(avg_starter_value, 2),
                "vorp": round(vorp, 2),
                "voas": round(voas, 2)
            })

    results.sort(key=lambda x: x['vorp'], reverse=True)
    return results


def import_csv_rankings(path_to_file, source_type, scoring_type):
    with open(path_to_file, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            first_name = row["First Name"].strip()
            last_name = row["Last Name"].strip()
            position = row["Position"].strip()
            team = row["Team"].strip()
            points = float(row["Projected Points"])

            player, _ = Player.objects.update_or_create(
                first_name=first_name,
                last_name=last_name,
                position=position,
                team_name=team,
            )
            if source_type == 'cbs':
                if scoring_type == 'ppr':
                    player.projected_points_cbs_ppr = points
                elif scoring_type == 'std':
                    player.projected_points_cbs_std = points
            elif source_type == 'espn':
                if scoring_type == 'ppr':
                    player.projected_points_espn_ppr = points
                elif scoring_type == 'std':
                    player.projected_points_cbs_ppr = points
            player.save()
            count += 1

    print(f"Imported {count} players from CBS.")
