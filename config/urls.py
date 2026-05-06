from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from automation.views import register_user, task_stats


def home(request):
    return JsonResponse({
        "message": "Automation Tool Backend läuft",
        "admin": "/admin/",
        "api": "/api/",
    })


urlpatterns = [
    path("", home, name="home"),
    path("admin/", admin.site.urls),

    path("api/register/", register_user, name="register_user"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/stats/", task_stats, name="task_stats"),

    path("api/", include("automation.urls")),
]