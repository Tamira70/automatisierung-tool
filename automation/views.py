from django.contrib.auth.models import User
from django.utils.timezone import now
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_user(request):
    username = request.data.get("username", "").strip()
    password = request.data.get("password", "").strip()

    if not username or not password:
        return Response({"detail": "Benutzername und Passwort sind erforderlich."}, status=400)

    if len(password) < 8:
        return Response({"detail": "Passwort muss mindestens 8 Zeichen haben."}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({"detail": "Benutzername existiert bereits."}, status=400)

    user = User.objects.create_user(username=username, password=password)
    user.is_active = True
    user.save()

    return Response(
        {"message": "Benutzer erfolgreich erstellt.", "username": user.username},
        status=201,
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def home(request):
    return Response({"message": "Automation API läuft 🚀", "user": request.user.username})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def status(request):
    return Response({"status": "ok", "service": "automation", "user": request.user.username})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def overdue_tasks(request):
    tasks = (
        Task.objects.filter(created_by=request.user, due_date__lt=now().date())
        .exclude(status="erledigt")
        .order_by("due_date")
    )

    serializer = TaskSerializer(tasks, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def task_stats(request):
    tasks = Task.objects.filter(created_by=request.user)
    today = now().date()

    data = {
        "total": tasks.count(),
        "open": tasks.filter(status="offen").count(),
        "in_progress": tasks.filter(status="in_bearbeitung").count(),
        "done": tasks.filter(status="erledigt").count(),
        "overdue": tasks.filter(due_date__lt=today).exclude(status="erledigt").count(),
        "high_priority": tasks.filter(priority="hoch").count(),
    }

    return Response(data)


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.filter(created_by=self.request.user).order_by("-created_at")

        status_param = self.request.query_params.get("status")
        priority_param = self.request.query_params.get("priority")

        if status_param:
            queryset = queryset.filter(status=status_param)

        if priority_param:
            queryset = queryset.filter(priority=priority_param)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(created_by=self.request.user)