'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NavbarEstudiante from '@/components/layout/NavbarEstudiante';
import Footer from '@/components/layout/Footer';
import CameraComponent from '@/components/dashboard/CameraComponent';
import Link from 'next/link';

export default function CursoEstudiante() {
  const { id } = useParams();
  const router = useRouter();
  const [curso, setCurso] = useState(null);
  const [videos, setVideos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [pruebas, setPruebas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [attentionResults, setAttentionResults] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [completedActivities, setCompletedActivities] = useState({
    videos: [],
    talleres: [],
    pruebas: []
  });
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const headers = {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        };

        const [cursoRes, videosRes, talleresRes, pruebasRes, progressRes] = await Promise.all([
          fetch(`http://localhost:8000/api/cursos/${id}/`, { headers }),
          fetch(`http://localhost:8000/api/cursos/${id}/videos/`, { headers }),
          fetch(`http://localhost:8000/api/cursos/${id}/talleres/`, { headers }),
          fetch(`http://localhost:8000/api/cursos/${id}/pruebas/`, { headers }),
          fetch(`http://localhost:8000/api/cursos/${id}/completion/`, { headers })
        ]);

        if (!cursoRes.ok) throw new Error('Error al obtener el curso');
        
        const cursoData = await cursoRes.json();
        setCurso(cursoData);
        
        if (videosRes.ok) {
          const videosData = await videosRes.json();
          setVideos(videosData.map(video => ({
            ...video,
            archivo: video.archivo.startsWith('http') ? video.archivo : `http://localhost:8000${video.archivo}`
          })));
        }

        if (talleresRes.ok) {
          setTalleres(await talleresRes.json());
        }

        if (pruebasRes.ok) {
          const pruebasData = await pruebasRes.json();
          const pruebasConJSON = await Promise.all(
            pruebasData.map(async prueba => {
              try {
                if (!prueba.json_content && prueba.archivo_json) {
                  const jsonUrl = prueba.archivo_json.startsWith('http') 
                    ? prueba.archivo_json 
                    : `http://localhost:8000${prueba.archivo_json}`;
                  
                  const response = await fetch(jsonUrl, { headers });
                  
                  if (response.ok) {
                    const jsonData = await response.json();
                    if (!jsonData.quiz_title || !Array.isArray(jsonData.questions)) {
                      return {
                        ...prueba,
                        error: "Formato de cuestionario incorrecto"
                      };
                    }
                    prueba.json_content = jsonData;
                  }
                }
                return {
                  ...prueba,
                  archivo_json: prueba.archivo_json?.startsWith('http') 
                    ? prueba.archivo_json 
                    : `http://localhost:8000${prueba.archivo_json || ''}`
                };
              } catch (error) {
                return {
                  ...prueba,
                  error: "Error al cargar el cuestionario"
                };
              }
            })
          );
          setPruebas(pruebasConJSON);
        }

        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setCompletionPercentage(progressData.percentage || 0);
          setCompletedActivities({
            videos: progressData.details?.videos?.completed || [],
            talleres: progressData.details?.talleres?.completed || [],
            pruebas: progressData.details?.pruebas?.completed || []
          });
        }

      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const getFileType = (filename) => {
    if (!filename) return 'Archivo';
    const extension = filename.split('.').pop().toLowerCase();
    const types = {
      pdf: 'PDF',
      doc: 'Word',
      docx: 'Word',
      xls: 'Excel',
      xlsx: 'Excel',
      json: 'JSON',
      mp4: 'Video'
    };
    return types[extension] || extension.toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  const parseJSONQuestions = (jsonContent) => {
    try {
      if (!jsonContent) throw new Error('El cuestionario no tiene contenido');
      
      const questions = jsonContent.questions || jsonContent.preguntas;
      if (!Array.isArray(questions)) {
        throw new Error('Formato inválido: falta el array de preguntas');
      }

      return questions.map((q, i) => {
        if (!q.question_text && !q.pregunta) {
          throw new Error(`Pregunta ${i + 1} no tiene texto`);
        }

        return {
          id: q.id || `q${i}`,
          text: q.question_text || q.pregunta,
          options: q.options || q.opciones || [],
          correctAnswer: q.correct_answer ?? q.respuesta_correcta,
          explanation: q.explanation || q.explicacion
        };
      });
    } catch (error) {
      console.error('Error en parseJSONQuestions (Estudiante):', error);
      throw error;
    }
  };

  const handleVideoPlay = async (video) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      setActiveVideo(video);
      setShowCamera(true);
      setIsMonitoring(true);
      
    } catch (err) {
      alert('Debes permitir el acceso a la cámara para ver este video');
      console.error('Error al acceder a la cámara:', err);
    }
  };

  const handleTallerStart = async (taller) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      router.push(`/dashboard/estudiante/talleres/${taller.id}`);
    } catch (err) {
      alert('Debes permitir el acceso a la cámara para realizar este taller');
      console.error('Error al acceder a la cámara:', err);
    }
  };

  const handlePruebaStart = async (prueba) => {
    if (!prueba) {
      console.error('Prueba es undefined/null');
      alert('Error: No se ha seleccionado ninguna prueba');
      return;
    }

    if (!prueba?.id){
      console.error('Prueba no valida:',prueba);
      alert ('Error: La prueba seleccionad no es valida');
      return;
    }

    if (typeof prueba !== 'object' || Array.isArray(prueba)) {
      console.error('Prueba no es un objeto válido:', prueba);
      alert('Error: Datos de prueba inválidos');
      return;
    }

    try {
      let jsonContent = prueba.json_content;
      const hasJsonFile = prueba.archivo_json;
      
      if (!jsonContent && !hasJsonFile) {
        throw new Error('La prueba no tiene contenido asociado');
      }

      if (!jsonContent && hasJsonFile) {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const jsonUrl = prueba.archivo_json.startsWith('http') 
          ? prueba.archivo_json 
          : `http://localhost:8000${prueba.archivo_json}`;
        
        const response = await fetch(jsonUrl, {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status} al cargar el JSON`);
        }
        
        jsonContent = await response.json();
      }

      if (!jsonContent || typeof jsonContent !== 'object') {
        throw new Error('El contenido de la prueba no es válido');
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (cameraError) {
        throw new Error('Debes permitir el acceso a la cámara para realizar esta prueba');
      }

      const pruebaData = {
        id: prueba.id,
        titulo: prueba.titulo || 'Prueba sin título',
        descripcion: prueba.descripcion || '',
        tiempo_limite: prueba.tiempo_limite || 30,
        fecha_entrega: prueba.fecha_entrega || null,
        preguntas: parseJSONQuestions(jsonContent)
      };

      const queryParams = new URLSearchParams();
      queryParams.append('pruebaData', JSON.stringify(pruebaData));
      
      router.push(`/dashboard/estudiante/pruebas/${prueba.id}`);

    } catch (error) {
      console.error('Error en handlePruebaStart:', {
        error: error.message,
        prueba: prueba,
        stack: error.stack
      });
      
      alert(`Error al iniciar la prueba: ${error.message}`);
    }
  };

  const handleStartMonitoring = () => {
    setIsMonitoring(true);
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play();
    }
  };

  const handleStopMonitoring = () => {
    setIsMonitoring(false);
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  };

  const saveAttentionResults = (results) => {
    setAttentionResults(prev => [...prev, results]);
  };

  const ResourceSection = ({ title, resources, resourceType }) => {
    const isCompleted = (resourceId) => {
      if (resourceType === 'video') {
        return completedActivities.videos.includes(resourceId);
      } else if (resourceType === 'taller') {
        return completedActivities.talleres.includes(resourceId);
      } else if (resourceType === 'prueba') {
        return completedActivities.pruebas.includes(resourceId);
      }
      return false;
    };

    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">{title}</h2>
        {resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resources.map(resource => (
              <div 
                key={`${resourceType}-${resource.id}`}
                className={`border p-4 rounded-lg transition-all ${
                  resource.error ? 'border-red-200 bg-red-50' :
                  isCompleted(resource.id) ? 'border-green-500 bg-green-50' : 
                  'border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{resource.titulo}</h3>
                    {resource.error && (
                      <p className="text-red-600 text-sm mt-1">{resource.error}</p>
                    )}
                    {resource.descripcion && (
                      <p className="text-gray-600 mt-1 mb-3">{resource.descripcion}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-1">
                      {getFileType(resource.archivo || resource.archivo_json)}
                    </span>
                    {isCompleted(resource.id) && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Completado
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {resourceType === 'video' && (
                    <button
                      onClick={() => handleVideoPlay(resource)}
                      className={`inline-flex items-center px-3 py-2 rounded transition-colors ${
                        isCompleted(resource.id) ? 'bg-green-500 text-white hover:bg-green-600' : 
                        'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      {isCompleted(resource.id) ? 'Ver Nuevamente' : 'Ver Video'}
                    </button>
                  )}
                  
                  {resourceType === 'taller' && (
                    <button
                      onClick={() => handleTallerStart(resource)}
                      className={`inline-flex items-center px-3 py-2 rounded transition-colors ${
                        isCompleted(resource.id) ? 'bg-green-500 text-white hover:bg-green-600' : 
                        'bg-yellow-500 text-white hover:bg-yellow-600'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                      {isCompleted(resource.id) ? 'Ver Entrega' : 'Realizar Taller'}
                    </button>
                  )}

                  {resourceType === 'prueba' && (
                    isCompleted(resource.id) ? (
                      <button
                        onClick={() => router.push(`/dashboard/estudiante/curso/${id}/simulacion?prueba=${resource.id}`)}
                        className="inline-flex items-center px-3 py-2 rounded transition-colors bg-green-500 text-white hover:bg-green-600"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                        Ver Resultados
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePruebaStart(resource)}
                        className="inline-flex items-center px-3 py-2 rounded transition-colors bg-purple-500 text-white hover:bg-purple-600"
                        disabled={!!resource.error}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                        Realizar Prueba
                      </button>
                    )
                  )}
                </div>

                <div className="mt-3 text-sm text-gray-500">
                  <p className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Subido: {formatDate(resource.fecha_creacion)}
                  </p>
                  {resource.fecha_entrega && (
                    <p className="flex items-center mt-1">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Entrega: {formatDate(resource.fecha_entrega)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded text-center">
            <p className="text-gray-500">No hay {title.toLowerCase()} disponibles</p>
            <p className="text-sm text-gray-400 mt-1">El docente aún no ha subido contenido</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavbarEstudiante />
        <main className="flex-grow p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información del curso...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !curso) {
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar el curso</h3>
            <p className="text-gray-600 mb-4">{error || 'El curso no existe o no tienes acceso'}</p>
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
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{curso.nombre}</h1>
                <p className="text-gray-600 mb-4">{curso.descripcion}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex gap-2 mb-2">
                  {/* Botón de Notas*/}
                  <Link
                    href="/dashboard/dashboardEstudiante/notasEstudiante"
                    className="flex items-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Ver Notas
                  </Link>
                  <button 
                    onClick={() => setShowCamera(!showCamera)}
                    className={`px-4 py-2 rounded ${
                      showCamera ? 'bg-gray-500 hover:bg-gray-600' : 
                      'bg-[#012E4A] hover:bg-[#034168]'
                    } text-white`}
                  >
                    {showCamera ? 'Ocultar Cámara' : 'Mostrar Cámara'}
                  </button>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full bg-blue-600" 
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 mt-1">
                  Progreso: {completionPercentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm mt-4">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                Código: {curso.codigo}
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                Profesor: {curso.profesor.username}
              </span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                {completedActivities.videos.length}/{videos.length} Videos
              </span>
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
                {completedActivities.talleres.length}/{talleres.length} Talleres
              </span>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full">
                {completedActivities.pruebas.length}/{pruebas.length} Pruebas
              </span>
            </div>
          </div>
          
          {showCamera && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
              {activeVideo ? (
                <>
                  <h2 className="text-xl font-semibold mb-4">Reproduciendo: {activeVideo.titulo}</h2>
                  <video
                    ref={videoRef}
                    src={activeVideo.archivo}
                    controls
                    className="w-full rounded-lg mb-4"
                    onPlay={() => setIsMonitoring(true)}
                    onPause={() => setIsMonitoring(false)}
                    onEnded={() => {
                      setIsMonitoring(false);
                      setShowCamera(false);
                    }}
                  />
                </>
              ) : (
                <h2 className="text-xl font-semibold mb-4">Monitoreo de Atención</h2>
              )}
              
              <CameraComponent 
                onStartMonitoring={handleStartMonitoring}
                onStopMonitoring={handleStopMonitoring}
                videoId={activeVideo?.id}
                active={isMonitoring}
              />
              
              <div className="mt-3 p-3 bg-blue-50 rounded">
                <p className="text-blue-800">
                  <strong>Estado:</strong> {isMonitoring ? 'Monitoreando atención' : 'Monitoreo pausado'}
                </p>
                {activeVideo && !isMonitoring && (
                  <p className="text-blue-800 mt-1">
                    El video se pausará si detienes el monitoreo
                  </p>
                )}
              </div>
            </div>
          )}
          
          {attentionResults.length > 0 && (
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Tus Resultados de Atención</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {attentionResults.map((result, index) => (
                  <div key={index} className="border border-gray-200 p-3 rounded-lg">
                    <h3 className="font-medium">
                      {videos.find(v => v.id === result.videoId)?.titulo || 'Video'}
                    </h3>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            result.percentage > 70 ? 'bg-green-500' : 
                            result.percentage > 40 ? 'bg-yellow-500' : 
                            'bg-red-500'
                          }`} 
                          style={{ width: `${result.percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-sm mt-1 text-gray-600">
                        Atención: {result.percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <ResourceSection 
            title="Videos Educativos" 
            resources={videos} 
            resourceType="video"
          />
          
          <ResourceSection 
            title="Talleres Prácticos" 
            resources={talleres} 
            resourceType="taller"
          />
          
          <ResourceSection 
            title="Pruebas y Evaluaciones" 
            resources={pruebas} 
            resourceType="prueba"
          />
          
          <div className="mt-6">
            <button 
              onClick={() => router.push('/dashboard/estudiante')}
              className="flex items-center bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Volver a mis cursos
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}