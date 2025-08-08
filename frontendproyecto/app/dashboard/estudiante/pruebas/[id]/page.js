'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NavbarEstudiante from '@/components/layout/NavbarEstudiante';
import Footer from '@/components/layout/Footer';
import CameraComponent from '@/components/dashboard/CameraComponent';

export default function PruebaPage() {
  const { id } = useParams();
  const router = useRouter();
  const [prueba, setPrueba] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [respuestas, setRespuestas] = useState({});
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchPrueba = async () => {
      try {
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

        if (!response.ok) {
          throw new Error('Prueba no encontrada');
        }

        const data = await response.json();
        setPrueba(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrueba();
  }, [id, router]);

  const handleStartMonitoring = async () => {
    try {
      setIsMonitoring(true);
      if (videoRef.current) {
        await videoRef.current.play().catch(e => console.error("Error al reproducir:", e));
      }
    } catch (err) {
      console.error('Error al iniciar monitoreo:', err);
    }
  };

  const handleStopMonitoring = (results) => {
    setIsMonitoring(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    console.log('Resultados de atención:', results);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/pruebas/${id}/submit/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          respuestas,
          fecha_envio: new Date().toISOString()
        })
      });

      if (response.ok) {
        alert('Prueba enviada correctamente');
        router.push('/dashboard/estudiante');
      } else {
        throw new Error('Error al enviar la prueba');
      }
    } catch (err) {
      console.error('Error al enviar prueba:', err);
      alert('Error al enviar la prueba');
    }
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
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{prueba.titulo}</h1>
            <p className="text-gray-600 mb-6">{prueba.descripcion}</p>
            
            {/* Sección de la prueba */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Preguntas</h2>
              <form onSubmit={handleSubmit}>
                {prueba.preguntas?.map((pregunta, index) => (
                  <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
                    <p className="font-medium mb-3">{pregunta.texto}</p>
                    {pregunta.tipo === 'opcion_multiple' && (
                      <div className="space-y-2">
                        {pregunta.opciones?.map((opcion, i) => (
                          <div key={i} className="flex items-center">
                            <input
                              type="radio"
                              id={`p${index}_o${i}`}
                              name={`pregunta_${index}`}
                              value={opcion}
                              onChange={() => setRespuestas({
                                ...respuestas,
                                [index]: opcion
                              })}
                              className="mr-2"
                            />
                            <label htmlFor={`p${index}_o${i}`}>{opcion}</label>
                          </div>
                        ))}
                      </div>
                    )}
                    {pregunta.tipo === 'texto_libre' && (
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded"
                        rows={3}
                        onChange={(e) => setRespuestas({
                          ...respuestas,
                          [index]: e.target.value
                        })}
                      />
                    )}
                  </div>
                ))}
                
                {/* Monitoreo de atención */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <CameraComponent 
                    onStartMonitoring={handleStartMonitoring}
                    onStopMonitoring={handleStopMonitoring}
                    active={isMonitoring}
                  />
                  <p className="mt-2 text-blue-800">
                    {isMonitoring ? 'Monitoreo de atención activo' : 'Monitoreo de atención inactivo'}
                  </p>
                </div>
                
                <button
                  type="submit"
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Enviar prueba
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}