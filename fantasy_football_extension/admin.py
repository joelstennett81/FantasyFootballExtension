from django.contrib import admin
from .models import Player
from .utils import *


@admin.action(description="Import CBS PPR Projections")
def import_cbs_ppr_action(modeladmin, request, queryset):
    path = "fantasy_football_extension/projected_rankings/cbs_ppr_rankings_2025.csv"
    import_csv_rankings(path, source_type='cbs', scoring_type='ppr')

    modeladmin.message_user(request, "CBS PPR projections imported from file.")


@admin.action(description="Import CBS STD Projections")
def import_cbs_std_action(modeladmin, request, queryset):
    path = "fantasy_football_extension/projected_rankings/cbs_std_rankings_2025.csv"
    import_csv_rankings(path, source_type='cbs', scoring_type='std')

    modeladmin.message_user(request, "CBS STD projections imported from file.")


@admin.action(description="Import ESPN PPR Projections")
def import_espn_ppr_action(modeladmin, request, queryset):
    path = "fantasy_football_extension/projected_rankings/espn_ppr_rankings_2025.csv"
    import_csv_rankings(path, source_type='espn', scoring_type='ppr')

    modeladmin.message_user(request, "ESPN PPR projections imported from file.")


@admin.action(description="Import ESPN STD Projections")
def import_espn_std_action(modeladmin, request, queryset):
    path = "fantasy_football_extension/projected_rankings/espn_std_rankings_2025.csv"
    import_csv_rankings(path, source_type='espn', scoring_type='std')

    modeladmin.message_user(request, "ESPN STD projections imported from file.")


@admin.action(description="Import Draft Sharks PPR Projections")
def import_draft_sharks_ppr_action(modeladmin, request, queryset):
    path = "fantasy_football_extension/projected_rankings/draft_sharks_ppr_rankings_2025.csv"
    import_csv_rankings(path, source_type='draft_sharks', scoring_type='ppr')

    modeladmin.message_user(request, "Draft Sharks PPR projections imported from file.")


@admin.action(description="Import Draft Sharks STD Projections")
def import_draft_sharks_std_action(modeladmin, request, queryset):
    path = "fantasy_football_extension/projected_rankings/draft_sharks_std_rankings_2025.csv"
    import_csv_rankings(path, source_type='draft_sharks', scoring_type='std')

    modeladmin.message_user(request, "Draft Sharks STD projections imported from file.")


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "team_name", "position", "projected_points_cbs_ppr",
                    "projected_points_cbs_std","projected_points_espn_ppr", "projected_points_espn_std", "projected_points_draft_sharks_ppr","projected_points_draft_sharks_std")
    list_filter = ("position", "team_name")
    search_fields = ("first_name", "last_name")  # 👈 This enables search by name
    actions = [import_cbs_ppr_action, import_cbs_std_action, import_espn_ppr_action, import_espn_std_action,
               import_draft_sharks_ppr_action, import_draft_sharks_std_action]
