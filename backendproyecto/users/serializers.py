from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework import validators
from .models import User
from .models import Curso


#importaciones para talleres, videos y pruebas
from .models import User, Curso, Video, Taller, Prueba



class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username','email','password']
        extra_kwargs = {'password': {'write_only': True}}
    def create(self, data):
        return User.objects.create_user(**data)

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    def validate(self, data):
        user = authenticate(**data)
        if not user:
            raise serializers.ValidationError('Credenciales inválidas')
        data['user'] = user
        return data

class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = '__all__'
        extra_kwargs = {
            'id':{'read_only':True},
            'codigo': {
                'validators': [
                    validators.UniqueValidator(queryset=Curso.objects.all())
                ]
            }
        }


# modulo para talleres, videos y pruebas
class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ['id', 'titulo', 'descripcion', 'archivo', 'curso', 'fecha_creacion']
        extra_kwargs = {
            'archivo': {'required': True},
            'titulo': {'required': True},
        }

    def validate_archivo(self, value):
        if not value.name.lower().endswith('.mp4'):
            raise serializers.ValidationError("Solo se permiten archivos MP4")
        return value

# serializers.py
class TallerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Taller
        fields = ['id', 'titulo', 'descripcion', 'archivo', 'curso', 'fecha_creacion']
        extra_kwargs = {
            'curso': {'required': True},
            'archivo': {'required': True},
            'titulo': {'required': True},
            'descripcion': {'required': False}  # Opcional si lo permites
        }

    def validate(self, data):
        if not data.get('curso'):
            raise serializers.ValidationError("Debe especificar un curso")
        return data

    def validate_archivo(self, value):
        valid_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']  # Añadi el formato  Excel
        if not any(value.name.lower().endswith(ext) for ext in valid_extensions):
            raise serializers.ValidationError(
                "Solo se permiten archivos PDF, Excel o Word"
            )
        return value
    

    

class PruebaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prueba
        fields = '__all__'
        extra_kwargs = {
            'archivo_xml': {'required': True},
            'titulo': {'required': True},
            'descripcion': {'required': True}
        }
        
    def validate_archivo_xml(self, value):
        if not value.name.lower().endswith('.xml'):
            raise serializers.ValidationError("Solo se permiten archivos XML")
        
        # Opcional: Validación básica del contenido XML
        try:
            from xml.etree import ElementTree
            ElementTree.parse(value)
        except ElementTree.ParseError:
            raise serializers.ValidationError("El archivo XML no es válido")
        
        return value

