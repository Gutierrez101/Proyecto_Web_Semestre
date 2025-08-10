from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework import validators
import json
from .models import User
from .models import Curso, ResultadoPrueba


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
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("El contenido debe ser un JSON válido")
        
        if not isinstance(value, dict):
            raise serializers.ValidationError("El contenido debe ser un objeto JSON")
        
        # Aceptar tanto 'questions' como 'preguntas'
        questions = value.get('questions', value.get('preguntas', []))
        
        if not isinstance(questions, list):
            raise serializers.ValidationError("Las preguntas deben ser una lista")
        
        if len(questions) == 0:
            raise serializers.ValidationError("La prueba debe contener al menos una pregunta")
        
        for i, question in enumerate(questions):
            if not isinstance(question, dict):
                raise serializers.ValidationError(f"Pregunta {i} debe ser un objeto")
                
            # Validar campos requeridos
            required_fields = ['question_text', 'options', 'correct_answer']
            for field in required_fields:
                if field not in question:
                    raise serializers.ValidationError(
                        f"Pregunta {i} no tiene el campo requerido: {field}"
                    )
        
        return value

class ResultadoPruebaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResultadoPrueba
        fields = ['id', 'prueba', 'respuestas', 'evaluacion_ia', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']

    def validate_respuestas(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Las respuestas deben ser un objeto/diccionario")
        
        # Verificar que hay al menos una respuesta
        if not value:
            raise serializers.ValidationError("Debe proporcionar al menos una respuesta")
            
        return value

    def validate(self, data):
        # Validar que el usuario no haya enviado ya esta prueba
        if ResultadoPrueba.objects.filter(estudiante=self.context['request'].user, prueba=data['prueba']).exists():
            raise serializers.ValidationError("Ya has enviado esta prueba")
        
        # Validar estructura básica de las respuestas
        if 'respuestas' in data:
            try:
                # Convertir a dict si es string
                if isinstance(data['respuestas'], str):
                    data['respuestas'] = json.loads(data['respuestas'])
            except json.JSONDecodeError:
                raise serializers.ValidationError({"respuestas": "Formato JSON inválido"})
        
        return data