'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import NavbarEstudiante from '@/components/layout/NavbarEstudiante';
import Footer from '@/components/layout/Footer';
import Swal from 'sweetalert2';

export default function ResultadosPruebaPage() {
  const { id } = useParams();
  const router = useRouter();
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarResultado = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Verificar token de autenticación
        const token = localStorage.getItem('token');
        if (!token) {
          Swal.fire({
            icon: 'warning',
            title: 'Sesión expirada',
            text: 'Por favor inicia sesión nuevamente',
          });
          router.push('/login');
          return;
        }

        // Hacer la petición al endpoint de resultados
        const response = await fetch(`http://localhost:8000/api/pruebas/${id}/resultado/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });

        // Manejar posibles errores
        if (response.status === 401) {
          localStorage.removeItem('token');
          Swal.fire({
            icon: 'error',
            title: 'No autorizado',
            text: 'No tienes permiso para ver estos resultados',
          });
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(response.status === 404 
            ? 'No se encontraron resultados para esta prueba' 
            : 'Error al cargar los resultados');
        }

        // Procesar la respuesta exitosa
        const data = await response.json();
        console.log("Datos recibios del backend:",data);
        //setResultado(data);
        const normalizedData={
          ...data,
          preguntas:data.preguntas?.map((p,i)=>({
            id: data.id,
            fecha_fin: data.fecha_fin || data.fecha_creacion,
            texto: p.question_text || p.texto,
            opciones: p.options || p.opciones,
            respuestas: data.respuestas || data.answers || {},
            evaluacion_ia: data.evaluacion_ia || data.ai_evaluation || null,

            // Resultados de atención (si aplica)
            resultados_atencion: data.resultados_atencion || data.attention_results || [],
          })) || [],
        };
        setResultado(normalizedData);

      } catch (err) {
        setError(err.message);
        console.error('Error al cargar resultado:', err);
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.message || 'No se pudo cargar el resultado',
          confirmButtonText: 'Entendido'
        }).then(() => {
          router.push('/dashboard/estudiante');
        });
        
      } finally {
        setLoading(false);
      }
    };

    cargarResultado();
  }, [id, router]);

  const formatFecha = (fechaString) => {
    if (!fechaString) return 'Sin fecha';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(fechaString).toLocaleDateString('es-ES', options);
  };

  if (loading) {
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

  if (error || !resultado) {
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar resultados</h3>
            <p className="text-gray-600 mb-4">{error || 'No se encontraron resultados para esta prueba'}</p>
            <button 
              onClick={() => router.push('/dashboard/estudiante')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Volver al dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Calcular porcentaje si existe evaluación IA
  const porcentaje = resultado.evaluacion_ia 
    ? Math.round((resultado.evaluacion_ia.puntaje / resultado.evaluacion_ia.total) * 100)
    : 0;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavbarEstudiante />
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Resultados de la Prueba</h1>
            
            {/* Resumen general */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-3">Resumen de tu desempeño</h2>
              
              {resultado.evaluacion_ia ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-blue-700">Puntaje obtenido</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {resultado.evaluacion_ia.puntaje}/{resultado.evaluacion_ia.total}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-green-700">Porcentaje</p>
                    <p className="text-2xl font-bold text-green-900">
                      {porcentaje}%
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <p className="text-sm text-purple-700">Fecha de evaluación</p>
                    <p className="text-lg font-medium text-purple-900">
                      {formatFecha(resultado.fecha_fin)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800">
                    La evaluación de esta prueba aún está en proceso. Por favor revisa más tarde.
                  </p>
                </div>
              )}
            </div>

            {/* Detalle por pregunta */}
            {resultado.evaluacion_ia?.detalle && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-3">Detalle por pregunta</h2>
                
                {resultado.evaluacion_ia.detalle.map((item, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${item.correcta ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800">
                        Pregunta {index + 1}: {item.texto}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.correcta ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {item.correcta ? 'Correcta' : 'Incorrecta'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-gray-600">Tu respuesta:</p>
                        <p className="font-medium">
                          {typeof item.respuesta_usuario === 'object' 
                            ? JSON.stringify(item.respuesta_usuario) 
                            : item.respuesta_usuario}
                        </p>
                      </div>
                      {!item.correcta && (
                        <div>
                          <p className="text-sm text-gray-600">Respuesta correcta:</p>
                          <p className="font-medium">
                            {typeof item.respuesta_correcta === 'object' 
                              ? JSON.stringify(item.respuesta_correcta) 
                              : item.respuesta_correcta}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {item.explicacion && (
                      <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                        <p className="text-sm text-gray-600">Explicación:</p>
                        <p className="text-gray-800">{item.explicacion}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Resultados de atención si existen */}
            {resultado.resultados_atencion?.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h2 className="text-xl font-semibold mb-3">Monitoreo de atención</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {resultado.resultados_atencion.map((atencion, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600">Sesión {idx + 1}</p>
                      <p className="text-lg font-medium">
                        Atención: {Math.round(atencion.attention_percentage * 100)}%
                      </p>
                      <p className="text-sm text-gray-600">
                        Duración: {Math.round((new Date(atencion.end_time) - new Date(atencion.start_time)) / 1000)} segundos
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón para volver */}
            <div className="mt-6">
              <button
                onClick={() => router.push(`/dashboard/estudiante`)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Volver al curso
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}