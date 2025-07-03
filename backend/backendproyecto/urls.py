# urls.py (en tu app)
from django.urls import path
from . import views

urlpatterns = [
    path('api/users/', views.get_users, name='get_users'),
    path('api/users/create/', views.create_user, name='create_user'),
]

# urls.py (principal del proyecto)
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('tu_app.urls')),  # Incluir las URLs de tu app
]