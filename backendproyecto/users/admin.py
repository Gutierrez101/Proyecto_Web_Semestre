from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Curso, Video, Taller, Prueba

# Registro del modelo User
admin.site.register(User, UserAdmin)

# Registro básico de modelos
admin.site.register(Curso)



# Configuración avanzada para modelos de actividades 
# con esto se refleja en el admin de Django
@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'curso', 'fecha_creacion')
    list_filter = ('curso',)
    search_fields = ('titulo', 'descripcion')
    raw_id_fields = ('curso',)

@admin.register(Taller)
class TallerAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'curso', 'formato_permitido', 'fecha_entrega')
    list_filter = ('curso', 'formato_permitido')
    search_fields = ('titulo', 'descripcion')
    raw_id_fields = ('curso',)

@admin.register(Prueba)
class PruebaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'curso', 'fecha_creacion')
    list_filter = ('curso',)
    search_fields = ('titulo', 'descripcion')
    raw_id_fields = ('curso',)