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
    class Meta:
        model = Prueba
        fields = ['id','titulo', 'descripcion', 'fecha_entrega', 'archivo_json', 'json_content', 'curso']
        extra_kwargs = {
            'json_content': {'required': True},
            'archivo_json': {'required': True},
            'curso': {'required': True}  # Asegurar que el curso es obligatorio
        }

    def validate_json_content(self, value):
        try:
            if not isinstance(value, dict):
                raise serializers.ValidationError("Debe ser un objeto JSON")
            
            questions = value.get('questions', [])
            if not isinstance(questions, list):
                raise serializers.ValidationError("El campo 'questions' debe ser un array")
            
            for i, q in enumerate(questions):
                if not q.get('question_text'):
                    raise serializers.ValidationError(f"Pregunta {i} no tiene 'question_text'")
                
                if not isinstance(q.get('options', []), list):
                    raise serializers.ValidationError(f"Pregunta {i}: 'options' debe ser un array")
                
                if not q.get('correct_answer'):
                    raise serializers.ValidationError(f"Pregunta {i} no tiene 'correct_answer'")
            
            return value
        except Exception as e:
            # Mejorar mensajes de error
            raise serializers.ValidationError(f"Error en el formato JSON: {str(e)}")
