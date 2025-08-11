from django.db import models
from django.conf import settings


class Prueba(models.Model):
    nombre = models.CharField(max_length=100)

class Pregunta(models.Model):
    texto = models.TextField()
    tipo = models.CharField(max_length=50, default='opcion_multiple')
    opciones = models.JSONField(default=list)
    respuesta_correcta = models.CharField(max_length=255)
    explicacion = models.TextField(blank=True, null=True)

class RespuestaPrueba(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    prueba = models.ForeignKey(Prueba, on_delete=models.CASCADE)
    pregunta = models.ForeignKey(Pregunta, on_delete=models.CASCADE)
    respuesta_usuario = models.CharField(max_length=255)
    fecha = models.DateTimeField(auto_now_add=True)