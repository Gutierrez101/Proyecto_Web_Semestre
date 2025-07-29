from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # aquí podrías añadir campos extra si lo deseas
    pass

class Curso(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    codigo = models.CharField(max_length=20, unique=True)
    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=False,
        related_name='cursos'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre