"""
URL configuration for backendproyecto project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from users.api_views import RegisterView, CustomLoginView, CursoCreateView, CursoListView, CursoDetailView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', RegisterView.as_view(), name='api-register'),
    path('api/login/', CustomLoginView.as_view(), name='login'),
    path('api/cursos/', CursoCreateView.as_view(),name='curso-create'),
    path('api/cursos/list/', CursoListView.as_view(), name='curso-list'),
    path('api/cursos/<int:pk>/', CursoDetailView.as_view(), name='curso-detail'),
]
