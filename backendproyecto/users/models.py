from django.conf import settings
from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    # Campos adicionales si los necesitas
    pass

# Primero definimos Curso antes de cualquier modelo que lo use
class Curso(models.Model):
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
    class Meta:
        verbose_name = 'Video'
        verbose_name_plural = 'Videos'
    def __str__(self):
        return self.titulo

class Taller(ActividadBase):
    archivo = models.FileField(upload_to='talleres/')
    formato_permitido = models.CharField(max_length=50, default='PDF, Word, Excel')


class TallerEnviado(models.Model):
    estudiante = models.ForeignKey(User, on_delete=models.CASCADE)
    taller = models.ForeignKey(Taller, on_delete=models.CASCADE)
    archivo = models.FileField(upload_to='talleres_enviados/')
    fecha_envio = models.DateTimeField(auto_now_add=True)
    calificacion = models.FloatField(null=True, blank=True)
    comentarios = models.TextField(blank=True)

    class Meta:
        verbose_name = "Taller enviado"
        verbose_name_plural = "Talleres enviados"

    def __str__(self):
        return f"{self.estudiante.username} - {self.taller.titulo}"


#Para las pruebas/evaluaciones del docente
class Prueba(models.Model):
    curso = models.ForeignKey(Curso, on_delete=models.CASCADE)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_entrega = models.DateTimeField(null=True, blank=True)
    archivo_json = models.FileField(upload_to='pruebas/json/', null=True, blank=True)
    json_content = models.JSONField(null=True, blank=True)
    
    def __str__(self):
        return self.titulo
    
    def clean(self):
        if not self.titulo:
            raise ValidationError("El título es obligatorio")
        if self.archivo_json and not self.archivo_json.name.endswith('.json'):
            raise ValidationError("El archivo debe ser un JSON")

class ResultadoPrueba(models.Model):
    estudiante = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resultados_prueba')
    prueba = models.ForeignKey(Prueba, on_delete=models.CASCADE, related_name='resultados')
    respuesta = models.JSONField()
    evaluacion_ia = models.JSONField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    fecha_inicio = models.DateTimeField(
        auto_now_add=False,
        null=True,
        blank=True
    )
    fecha_fin = models.DateTimeField(
        auto_now_add=False,
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = "Resultado de Prueba"
        verbose_name_plural = "Resultados de Pruebas"


    def __str__(self):
        return f"{self.estudiante.username} - {self.prueba.titulo} ({self.porcentaje}%)"



#modulo para la atencion del video
class VideoAccessToken(models.Model):
    token = models.OneToOneField(
        'authtoken.Token',
        on_delete=models.CASCADE,
        related_name='video_access'
    )
    video = models.ForeignKey(
        Video,  # Cambiado de 'Curso' a 'Video' para que sea más específico
        on_delete=models.CASCADE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Token de acceso a video'
        verbose_name_plural = 'Tokens de acceso a videos'

    def __str__(self):
        return f"Token para {self.video.titulo} (Expira: {self.expires_at})"


class AttentionResult(models.Model):
    video = models.ForeignKey(
        'Video', 
        on_delete=models.CASCADE,
        related_name='attention_results',
        null=True,
        blank=True,
        default=None 
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attention_results'
    )

    taller=models.ForeignKey(
        'Taller',
        on_delete=models.CASCADE,
        related_name='attention_results',
        null=True,
        blank=True,
        default=None
    )

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    attention_percentage = models.FloatField()
    attention_data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Resultado de atención'
        verbose_name_plural = 'Resultados de atención'

    def __str__(self):
        return f"Resultado de {self.student.username} para {self.video.titulo}"

class VideoAttention(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    video = models.ForeignKey(Video, on_delete=models.CASCADE)  # Asume que tienes un modelo Video
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    attention_percentage = models.FloatField()
    attention_data = models.JSONField()  # Almacena datos detallados de atención
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Registro de atención a video"
        verbose_name_plural = "Registros de atención a videos"