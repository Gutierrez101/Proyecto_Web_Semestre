from django.conf import settings
from django.db import models
from rest_framework.views import APIView
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    # Campos adicionales si los necesitas
    pass

# Primero definimos Curso antes de cualquier modelo que lo use
class Curso(models.Model):
    id=models.AutoField(primary_key=True, unique=True)
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    codigo = models.CharField(max_length=20, unique=True)
    profesor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cursos'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    estudiantes = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='cursos_inscritos',
        blank=True
    )

    def __str__(self):
        return self.nombre

# Luego definimos los modelos que dependen de Curso
class ActividadBase(models.Model):
    curso = models.ForeignKey(
        Curso,  # Ahora Curso está definido
        on_delete=models.CASCADE, 
        related_name='%(class)s_actividades'
    )
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_entrega = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True

class Video(ActividadBase):
    archivo = models.FileField(upload_to='videos/')
    duracion = models.PositiveIntegerField(help_text="Duración en segundos", null=True, blank=True)

class Taller(ActividadBase):
    archivo = models.FileField(upload_to='talleres/')
    formato_permitido = models.CharField(max_length=50, default='PDF, Word, Excel')

class Prueba(ActividadBase):
    archivo_xml = models.FileField(upload_to='pruebas/')
    plantilla_calificacion = models.TextField(help_text="Instrucciones para la calificación automática")

class VideoAccessToken(models.Model):
    token = models.OneToOneField(
        'authtoken.Token',
        on_delete=models.CASCADE,
        related_name='video_access'
    )
    video = models.ForeignKey(
        'Curso',
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

