from django.db import models


class Player(models.Model):
    POSITION_CHOICES = [
        ("QB", "Quarterback"),
        ("RB", "Running Back"),
        ("WR", "Wide Receiver"),
        ("TE", "Tight End"),
        ("DST", "Defense"),
        ("K", "Kicker"),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=50)
    team_name = models.CharField(max_length=50)
    position = models.CharField(max_length=3, choices=POSITION_CHOICES)
    projected_points_cbs_ppr = models.FloatField(default=0)
    projected_points_cbs_std = models.FloatField(default=0)
    projected_points_espn_ppr = models.FloatField(default=0)
    projected_points_espn_std = models.FloatField(default=0)
    projected_points_draft_sharks_ppr = models.FloatField(default=0)
    projected_points_draft_sharks_std = models.FloatField(default=0)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.position})"
