from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework import validators
from .models import User
from .models import Curso

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

