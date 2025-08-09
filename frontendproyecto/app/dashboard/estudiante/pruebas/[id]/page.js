'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import NavbarEstudiante from '@/components/layout/NavbarEstudiante';
import Footer from '@/components/layout/Footer';
import CameraComponent from '@/components/dashboard/CameraComponent';

export default function PruebaPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [prueba, setPrueba] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [respuestas, setRespuestas] = useState({});
  const [attentionResults, setAttentionResults] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  const parseJSONQuestions = (jsonContent) => {
    try {
      if (!jsonContent) throw new Error('No se proporcionó contenido JSON');
      
      // Soporte para ambos formatos (questions/preguntas)
      const questions = jsonContent.questions || jsonContent.preguntas || [];
      
      if (!Array.isArray(questions)) {
        throw new Error('El JSON debe contener un array "questions" o "preguntas"');
      }

      return questions.map((q, i) => {
        // Soporte para campos en español e inglés
        return {
          id: q.id || `q${i}`,
          texto: q.question_text || q.pregunta || q.texto || `Pregunta ${i + 1}`,
          tipo: q.type || q.tipo || 'opcion_multiple',
          opciones: q.options || q.opciones || [],
          respuesta_correcta: q.correct_answer ?? q.respuesta_correcta ?? 0,
          explicacion: q.explanation || q.explicacion || ''
        };
      });
    } catch (error) {
      console.error('Error al procesar preguntas:', error);
      throw new Error(`Formato de cuestionario incorrecto: ${error.message}`);
    }
  };

  useEffect(() => {
    const loadPruebaData = async () => {
      try {
        setLoading(true);
        
        // Primero intenta cargar desde los query params
        const pruebaDataParam = searchParams.get('pruebaData');
        if (pruebaDataParam) {
          const parsedData = JSON.parse(pruebaDataParam);
          setPrueba({
            ...parsedData,
            preguntas: parsedData.preguntas || []
          });
          setLoading(false);
          return;
        }

        // Si no hay query params, hace fetch al API
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`http://localhost:8000/api/pruebas/${id}/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Prueba no encontrada');
        
        const data = await response.json();
        // Asegurar que las preguntas están en el formato correcto
        if (data.json_content) {
          data.preguntas = parseJSONQuestions(data.json_content);
        }
        
        // Configurar tiempo límite si existe (en minutos)
        if (data.tiempo_limite) {
          setTimeRemaining(data.tiempo_limite * 60); // Convertir a segundos
        }
        
        setPrueba(data);
      } catch (err) {
        setError(err.message);
        console.error('Error al cargar prueba:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPruebaData();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [id, router, searchParams]);

  // Efecto para el temporizador
  useEffect(() => {
    if (timeRemaining === null) return;

    if (timeRemaining <= 0) {
      handleSubmitAuto();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeRemaining]);

  const handleStartMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      setIsMonitoring(true);
      if (videoRef.current) {
        await videoRef.current.play().catch(e => console.error("Error al reproducir:", e));
      }
    } catch (err) {
      console.error('Error al iniciar monitoreo:', err);
      alert('Debes permitir el acceso a la cámara para realizar esta prueba');
    }
  };

  const handleStopMonitoring = (results) => {
    setIsMonitoring(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (results) {
      setAttentionResults(prev => [...prev, results]);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      if (Object.keys(respuestas).length === 0) {
        alert('Debes responder al menos una pregunta');
        return;
      }


      // Validar que se hayan respondido todas las preguntas
      if (prueba.preguntas.length !== Object.keys(respuestas).length) {
        const confirmar = window.confirm(
          `No has respondido todas las preguntas. ¿Deseas enviar igualmente? (${Object.keys(respuestas).length}/${prueba.preguntas.length} respondidas)`
        );
        if (!confirmar) return;
      }

      const response = await fetch(`http://localhost:8000/api/pruebas/${id}/submit/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          respuesta:JSON.stringify(respuestas),
          //fecha_envio: new Date().toISOString(),
          resultados_atencion: attentionResults
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar la prueba');
      }

      alert('¡Prueba enviada correctamente!');
      router.push('/dashboard/estudiante');
    } catch (err) {
      console.error('Error al enviar:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleSubmitAuto = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    alert('El tiempo para esta prueba ha finalizado');
    handleSubmit();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavbarEstudiante />
        <main className="flex-grow p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando prueba...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !prueba) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavbarEstudiante />
        <main className="flex-grow p-6 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="bg-red-100 text-red-700 p-3 rounded-full inline-flex mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar la prueba</h3>
            <p className="text-gray-600 mb-4">{error || 'La prueba no existe o no tienes acceso'}</p>
            <button 
              onClick={() => router.push('/dashboard/estudiante')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Volver a mis cursos
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavbarEstudiante />
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{prueba.titulo}</h1>
                {prueba.descripcion && (
                  <p className="text-gray-600 mt-2">{prueba.descripcion}</p>
                )}
              </div>
              {timeRemaining !== null && (
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
                  Tiempo: {formatTime(timeRemaining)}
                </div>
              )}
            </div>
            
            {/* Sección de la prueba */}
            <div className="mb-6">
              <form onSubmit={handleSubmit}>
                {prueba.preguntas?.length > 0 ? (
                  prueba.preguntas.map((pregunta, index) => (
                    <div key={pregunta.id || index} className="mb-6 p-4 border border-gray-200 rounded-lg bg-white">
                      <p className="font-medium mb-3 text-gray-800">
                        {index + 1}. {pregunta.texto}
                      </p>
                      
                      {pregunta.tipo === 'opcion_multiple' && (
                        <div className="space-y-2">
                          {pregunta.opciones.map((opcion, i) => (
                            <div key={i} className="flex items-center">
                              <input
                                type="radio"
                                id={`p${index}_o${i}`}
                                name={`pregunta_${index}`}
                                value={i}
                                checked={respuestas[index] === i}
                                onChange={() => setRespuestas({
                                  ...respuestas,
                                  [index]: i
                                })}
                                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                              />
                              <label htmlFor={`p${index}_o${i}`} className="text-gray-700">
                                {opcion}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {pregunta.tipo === 'texto_libre' && (
                        <textarea
                          className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          rows={3}
                          value={respuestas[index] || ''}
                          onChange={(e) => setRespuestas({
                            ...respuestas,
                            [index]: e.target.value
                          })}
                          placeholder="Escribe tu respuesta aquí..."
                        />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <p className="text-yellow-800">Esta prueba no tiene preguntas definidas</p>
                  </div>
                )}
                
                {/* Monitoreo de atención */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Monitoreo de atención</h3>
                  <CameraComponent 
                    onStartMonitoring={handleStartMonitoring}
                    onStopMonitoring={handleStopMonitoring}
                    active={isMonitoring}
                  />
                  <p className={`mt-2 ${isMonitoring ? 'text-green-600' : 'text-blue-800'}`}>
                    {isMonitoring ? (
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Monitoreo activo - Por favor mantén tu atención en la prueba
                      </span>
                    ) : (
                      'Monitoreo inactivo - Actívalo antes de comenzar'
                    )}
                  </p>
                </div>
                
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard/estudiante')}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar prueba'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}