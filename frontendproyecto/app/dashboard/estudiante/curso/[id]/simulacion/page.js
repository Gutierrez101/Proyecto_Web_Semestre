'use client';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import NavbarEstudiante from '@/components/layout/NavbarEstudiante';
import Footer from '@/components/layout/Footer';
import { useEffect, useState } from 'react';

// Simula el banco de preguntas y respuestas del usuario
const bancoPreguntas = [
  {
    id: 1,
    texto: '¿Cuál es la capital de Francia?',
    opciones: ['Madrid', 'París', 'Roma', 'Berlín'],
    respuesta_usuario: 'París'
  },
  {
    id: 2,
    texto: '¿Cuál es el elemento químico H?',
    opciones: ['Helio', 'Hidrógeno', 'Hierro', 'Hafnio'],
    respuesta_usuario: 'Hidrógeno'
  },
  {
    id: 3,
    texto: '¿Quién escribió "Cien años de soledad"?',
    opciones: ['Mario Vargas Llosa', 'Gabriel García Márquez', 'Julio Cortázar', 'Isabel Allende'],
    respuesta_usuario: 'Gabriel García Márquez'
  },
  {
    id: 4,
    texto: '¿Cuál es el planeta más grande del sistema solar?',
    opciones: ['Saturno', 'Júpiter', 'Marte', 'Venus'],
    respuesta_usuario: 'Júpiter'
  },
  {
    id: 5,
    texto: '¿En qué año llegó el hombre a la Luna?',
    opciones: ['1969', '1972', '1958', '1980'],
    respuesta_usuario: '1969'
  },
  {
    id: 6,
    texto: '¿Cuál es el río más largo del mundo?',
    opciones: ['Nilo', 'Amazonas', 'Yangtsé', 'Misisipi'],
    respuesta_usuario: 'Amazonas'
  },
  {
    id: 7,
    texto: '¿Qué país tiene la mayor población del mundo?',
    opciones: ['India', 'Estados Unidos', 'China', 'Brasil'],
    respuesta_usuario: 'China'
  },
  {
    id: 8,
    texto: '¿Cuál es el resultado de 9 x 8?',
    opciones: ['72', '81', '64', '88'],
    respuesta_usuario: '72'
  },
  {
    id: 9,
    texto: '¿Quién pintó la Mona Lisa?',
    opciones: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Claude Monet'],
    respuesta_usuario: 'Leonardo da Vinci'
  },
  {
    id: 10,
    texto: '¿Cuál es el océano más grande?',
    opciones: ['Atlántico', 'Índico', 'Pacífico', 'Ártico'],
    respuesta_usuario: 'Pacífico'
  },
  {
    id: 11,
    texto: '¿Cuál es el idioma más hablado en el mundo?',
    opciones: ['Inglés', 'Mandarín', 'Español', 'Hindi'],
    respuesta_usuario: 'Mandarín'
  },
  {
    id: 12,
    texto: '¿Qué inventó Alexander Graham Bell?',
    opciones: ['Teléfono', 'Radio', 'Televisión', 'Computadora'],
    respuesta_usuario: 'Teléfono'
  },
  {
    id: 13,
    texto: '¿Cuál es la fórmula química del agua?',
    opciones: ['CO2', 'H2O', 'O2', 'NaCl'],
    respuesta_usuario: 'H2O'
  },
  {
    id: 14,
    texto: '¿En qué continente está Egipto?',
    opciones: ['Asia', 'África', 'Europa', 'Oceanía'],
    respuesta_usuario: 'África'
  },
  {
    id: 15,
    texto: '¿Cuál es el animal terrestre más rápido?',
    opciones: ['León', 'Tigre', 'Guepardo', 'Antílope'],
    respuesta_usuario: 'Guepardo'
  },
  {
    id: 16,
    texto: '¿Quién desarrolló la teoría de la relatividad?',
    opciones: ['Isaac Newton', 'Albert Einstein', 'Nikola Tesla', 'Stephen Hawking'],
    respuesta_usuario: 'Albert Einstein'
  },
  {
    id: 17,
    texto: '¿Cuál es el país más grande en superficie?',
    opciones: ['Estados Unidos', 'China', 'Rusia', 'Canadá'],
    respuesta_usuario: 'Rusia'
  },
  {
    id: 18,
    texto: '¿Cuál es el símbolo químico del oro?',
    opciones: ['Ag', 'Au', 'Fe', 'Pb'],
    respuesta_usuario: 'Au'
  },
  {
    id: 19,
    texto: '¿Qué órgano bombea la sangre en el cuerpo humano?',
    opciones: ['Pulmón', 'Riñón', 'Corazón', 'Hígado'],
    respuesta_usuario: 'Corazón'
  },
  {
    id: 20,
    texto: '¿Cuál es la capital de Japón?',
    opciones: ['Kioto', 'Osaka', 'Tokio', 'Nagoya'],
    respuesta_usuario: 'Tokio'
  }
];

export default function SimulacionResultados() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { id } = useParams();
  const pruebaId = searchParams.get('prueba');

  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function evaluarConIA() {
      try {
        const response = await fetch('http://localhost:8000/api/evaluar-ia/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Si usas autenticación, agrega el token aquí
          },
          body: JSON.stringify({ preguntas: bancoPreguntas })
        });

        if (!response.ok) throw new Error('Error al obtener resultados de la IA');

        const data = await response.json();
        // Si tu backend responde con un string JSON, parsea:
        const resultadoIA = typeof data === 'string' ? JSON.parse(data) : data;
        setResultados(resultadoIA);
      } catch (err) {
        setResultados(null);
        alert('No se pudo obtener el resultado de la IA');
      } finally {
        setLoading(false);
      }
    }

    if (pruebaId) {
      evaluarConIA();
    }
  }, [pruebaId]);

  if (!pruebaId) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavbarEstudiante />
        <main className="flex-grow p-6 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontró la prueba</h3>
            <button 
              onClick={() => router.push(`/dashboard/estudiante/curso/${id}`)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Volver al curso
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading || !resultados) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavbarEstudiante />
        <main className="flex-grow p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando resultados...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const aprobado = resultados.puntaje >= 14;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavbarEstudiante />
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Resultados de la Prueba</h1>
          <div className="mb-6">
            <p className="text-gray-700"><strong>Puntaje:</strong> {resultados.puntaje} / {resultados.total}</p>
            <p className="text-gray-700"><strong>Porcentaje:</strong> {((resultados.puntaje / resultados.total) * 100).toFixed(1)}%</p>
            <p className="text-gray-700"><strong>Fecha:</strong> {resultados.fecha}</p>
            <p className={`text-lg font-semibold mt-2 ${aprobado ? 'text-green-600' : 'text-red-600'}`}>
              {aprobado
                ? '¡Felicidades! Has aprobado la prueba.'
                : 'Tu puntaje es menor a 14, necesitas volver a realizar la prueba.'}
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Detalle de Preguntas</h2>
            <ul className="space-y-4">
              {resultados.detalle.map((pregunta, idx) => (
                <li key={idx} className={`p-4 rounded-lg ${pregunta.correcta ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                  <p className="font-medium text-gray-800">{pregunta.texto}</p>
                  <p className="text-gray-700">Tu respuesta: <span className="font-semibold">{pregunta.respuesta_usuario}</span></p>
                  <p className="text-gray-700">Respuesta correcta: <span className="font-semibold">{pregunta.respuesta_correcta}</span></p>
                  {pregunta.explicacion && (
                    <p className="text-gray-500 mt-2">Explicación: {pregunta.explicacion}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <button 
              onClick={() => router.push(`/dashboard/estudiante/curso/${id}`)}
              className="flex items-center bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Volver al curso
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}