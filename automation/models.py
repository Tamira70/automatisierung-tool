from django.conf import settings
from django.db import models


class Task(models.Model):
    STATUS_CHOICES = [
        ("offen", "Offen"),
        ("in_bearbeitung", "In Bearbeitung"),
        ("erledigt", "Erledigt"),
    ]

    PRIORITY_CHOICES = [
        ("niedrig", "Niedrig"),
        ("mittel", "Mittel"),
        ("hoch", "Hoch"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="offen")
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default="mittel")
    due_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tasks",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title