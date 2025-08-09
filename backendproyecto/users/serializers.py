from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework import validators
import json
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
            'codigo': {
                'validators': [
                    validators.UniqueValidator(queryset=Curso.objects.all())
                ]
            }
        }


# modulo para talleres, videos y pruebas
class VideoSerializer(serializers.ModelSerializer):
    curso = serializers.PrimaryKeyRelatedField(queryset=Curso.objects.all())
    
    class Meta:
        model = Video
        fields = ['id', 'titulo', 'descripcion', 'archivo', 'fecha_creacion', 'curso', 'duracion']
        read_only_fields = ['id', 'fecha_creacion', 'duracion']

    def validate_archivo(self, value):
        if not value.name.lower().endswith('.mp4'):
            raise serializers.ValidationError("Solo se permiten archivos MP4")
        return value

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
    

    
#Serializador de pruebas
class PruebaSerializer(serializers.ModelSerializer):
    
    archivo_json=serializers.FileField(required=False, allow_null=True)
    json_content=serializers.JSONField(required=False, allow_null=True)
    
    
    class Meta:
        model = Prueba
        fields = ['id', 'titulo', 'descripcion', 'curso', 'fecha_creacion', 
                 'fecha_entrega', 'archivo_json', 'json_content']
        read_only_fields = ['id', 'fecha_creacion']
        
    def validate(self, data):
        # Validación del archivo JSON si se proporciona
        archivo_json = data.get('archivo_json')
        if archivo_json:
            try:
                content = archivo_json.read().decode('utf-8')
                data['json_content'] = json.loads(content)
                archivo_json.seek(0)  # Rebobinar el archivo
            except json.JSONDecodeError:
                raise serializers.ValidationError({
                    'archivo_json': 'El archivo no contiene un JSON válido'
                })
            except UnicodeDecodeError:
                raise serializers.ValidationError({
                    'archivo_json': 'El archivo no está en formato UTF-8'
                })
        return data
        
    def create(self, validated_data):
        # Si se subió un archivo JSON, leer su contenido
        if 'archivo_json' in validated_data and validated_data['archivo_json']:
            json_file = validated_data['archivo_json']
            validated_data['json_content'] = json.loads(json_file.read().decode('utf-8'))
            json_file.seek(0)  # Rebobinar el archivo
            
        return super().create(validated_data)

