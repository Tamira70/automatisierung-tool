from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("status/", views.status, name="status"),
    path("tasks/", views.TaskListCreateView.as_view(), name="task-list-create"),
    path("tasks/<int:pk>/", views.TaskDetailView.as_view(), name="task-detail"),
    path("tasks-overdue/", views.overdue_tasks, name="tasks-overdue"),
]