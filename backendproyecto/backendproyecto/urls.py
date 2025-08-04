
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
from django.conf import settings
from django.conf.urls.static import static
from users.api_views import (
    RegisterView, 
    CustomLoginView, 
    CursoListView, 
    CursoDetailView,
    VideoView, 
    TallerView, 
    PruebaView,
    verify_attention, 
    VideoStreamView
)


# Modulo para inscripcion de cursos
from users.api_views import UnirseCursoView,CursosInscritosView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/register/', RegisterView.as_view(), name='api-register'),
    path('api/login/', CustomLoginView.as_view(), name='login'),
    path('api/cursos/', CursoListView.as_view(), name='curso-create'),
    path('api/cursos/<int:pk>/', CursoDetailView.as_view(), name='curso-detail'),
    path('api/cursos/<int:curso_id>/videos/', VideoView.as_view(), name='video-actividad'),
    path('api/cursos/<int:curso_id>/talleres/', TallerView.as_view(), name='taller-actividad'),
    path('api/cursos/<int:curso_id>/pruebas/', PruebaView.as_view(), name='prueba-actividad'),


    #inscripcion de cursos
    path('api/cursos/unirse/', UnirseCursoView.as_view(), name='unirse-curso'),
    path('api/mis-cursos/', CursosInscritosView.as_view(), name='mis-cursos'),
    path('api/videos/<int:video_id>/verify/', verify_attention, name='verify_attention'),
    path('api/videos/<int:video_id>/stream/', VideoStreamView.as_view(), name='video_stream'),
]

# para los archivos multimedia
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


