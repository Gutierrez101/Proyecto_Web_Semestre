'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NavbarEstudiante from '@/components/layout/NavbarEstudiante';
import Footer from '@/components/layout/Footer';

export default function CursoEstudiante() {
  const { id } = useParams();
  const router = useRouter();
  const [curso, setCurso] = useState(null);
  const [videos, setVideos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [pruebas, setPruebas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [attentionVerified, setAttentionVerified] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [showCameraSettings, setShowCameraSettings] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const abortController=new AbortController();

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

        const [cursoRes, videosRes, talleresRes, pruebasRes] = await Promise.all([
          fetch(`http://localhost:8000/api/cursos/${id}/`, { headers }),
          fetch(`http://localhost:8000/api/cursos/${id}/videos/`, { headers }),
          fetch(`http://localhost:8000/api/cursos/${id}/talleres/`, { headers }),
          fetch(`http://localhost:8000/api/cursos/${id}/pruebas/`, { headers })
        ]);

        if (!cursoRes.ok) throw new Error('Error al obtener el curso');
        
        const cursoData = await cursoRes.json();
        setCurso(cursoData);
        
        if (videosRes.ok) setVideos(await videosRes.json());
        if (talleresRes.ok) setTalleres(await talleresRes.json());
        if (pruebasRes.ok) setPruebas(await pruebasRes.json());

      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const loadCameraDevices = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setCameraDevices(videoDevices);
        }
      } catch (err) {
        console.error('Error al enumerar dispositivos:', err);
      }
    };

    loadCameraDevices();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          if (track.readyState === 'live') {
            track.enabled = false;
          }
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    };
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
      xml: 'XML',
      mp4: 'Video'
    };
    return types[extension] || extension.toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  const startCamera = async () => {
    try {
      setCameraLoading(true);
      setVerificationError(null);
      
      if (streamRef.current) {
        stopCamera();
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API de cámara no soportada');
      }

      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          deviceId: localStorage.getItem('preferredCamera') || undefined
        },
        audio: false
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        console.warn('Intento fallido con configuración ideal, probando básica...', err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (!stream) {
        throw new Error('No se pudo acceder a la cámara');
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Tiempo de espera agotado')), 5000);
          
          videoRef.current.onloadedmetadata = () => {
            clearTimeout(timer);
            videoRef.current.play().then(resolve).catch(resolve);
          };
          
          videoRef.current.onerror = () => {
            clearTimeout(timer);
            reject(new Error('Error en el elemento de video'));
          };
        });
      }

      setCameraActive(true);
      return true;

    } catch (err) {
      console.error('Error al iniciar cámara:', err);
      
      const errorMessages = {
        'NotAllowedError': 'Permiso denegado. Por favor habilita la cámara en la configuración de tu navegador.',
        'NotFoundError': 'No se encontró cámara conectada.',
        'NotReadableError': 'La cámara está siendo usada por otra aplicación.',
        'OverconstrainedError': 'Configuración no soportada. Prueba otra cámara.',
        'default': 'Error al acceder a la cámara. Intenta recargando la página.'
      };

      setVerificationError(errorMessages[err.name] || errorMessages['default']);
      return false;
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const verifyAttention = async (videoResource) => {
    try {
      if (!streamRef.current) {
        throw new Error('La cámara no está activa');
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      });

      const formData = new FormData();
      formData.append('frame', blob, 'frame.jpg');

      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/cursos/videos/${videoResource.id}/verify/`, 
        {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Token ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error en la verificación');
      }

      setAttentionVerified(true);
      setSelectedVideo({
        ...videoResource,
        token: response.token
      });
      stopCamera();

    } catch (err) {
      console.error('Error en verifyAttention:', err);
      setVerificationError(err.message || 'Error al verificar atención');
      await startCamera();
    }
  };

  const handleVideoClick = async (videoResource) => {
    if (attentionVerified && selectedVideo?.id === videoResource.id) {
      setSelectedVideo({
        ...videoResource,
        token: selectedVideo.token
      });
      return;
    }

    setAttentionVerified(false);
    setSelectedVideo(null);
    setVerificationError(null);

    await startCamera();
    setSelectedVideo(videoResource);
  };

  const ResourceSection = ({ title, resources, resourceType }) => (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">{title}</h2>
      {resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(resource => (
            <div key={resource.id} className="border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{resource.titulo}</h3>
                  {resource.descripcion && (
                    <p className="text-gray-600 mt-1 mb-3">{resource.descripcion}</p>
                  )}
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {getFileType(resource.archivo || resource.archivo_xml)}
                </span>
              </div>

              {resourceType === 'video' && resource.archivo && (
                <>
                  <div 
                    className="relative cursor-pointer mb-3 rounded-lg overflow-hidden"
                    onClick={() => handleVideoClick(resource)}
                  >
                    <video 
                      src={`http://localhost:8000${resource.archivo}`}
                      className="w-full h-48 object-cover"
                      muted
                      disablePictureInPicture
                      controlsList="nodownload"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                      </svg>
                    </div>
                  </div>
                  <button
                    onClick={() => handleVideoClick(resource)}
                    className="inline-flex items-center bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    Ver Video Completo
                  </button>
                </>
              )}
              
              {(resourceType === 'taller' || resourceType === 'prueba') && (
                <a 
                  href={`http://localhost:8000${resource.archivo || resource.archivo_xml}`}
                  download
                  className="inline-flex items-center bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors mt-2"
                >
                  Descargar
                </a>
              )}

              <div className="mt-3 text-sm text-gray-500">
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  Subido: {formatDate(resource.fecha_creacion)}
                </p>
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{curso.nombre}</h1>
            <p className="text-gray-600 mb-4">{curso.descripcion}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                Código: {curso.codigo}
              </span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                Profesor: {curso.profesor.username}
              </span>
            </div>
          </div>
          
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
              Volver a mis cursos
            </button>
          </div>
        </div>
      </main>

      {/* Modal de verificación de atención */}
      {cameraActive && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg overflow-hidden w-full max-w-2xl">
            <div className="flex justify-between items-center bg-gray-800 p-4">
              <h3 className="text-white font-medium">Verificación de atención</h3>
              <button 
                onClick={stopCamera}
                className="text-white hover:text-gray-300"
                disabled={cameraLoading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <p className="font-medium">Sigue estos pasos:</p>
                <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm text-gray-600">
                  <li>Asegúrate de estar en un lugar bien iluminado</li>
                  <li>Permite el acceso a la cámara cuando el navegador lo solicite</li>
                  <li>Mira directamente a la cámara</li>
                  {cameraDevices.length > 0 && (
                    <li>
                      Cámara seleccionada: {cameraDevices.find(d => d.deviceId === streamRef.current?.getVideoTracks()[0]?.getSettings()?.deviceId)?.label || 'Predeterminada'}
                    </li>
                  )}
                </ol>
              </div>

              {verificationError && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                  </svg>
                  {verificationError}
                </div>
              )}
              
              <div className="relative bg-black rounded-lg overflow-hidden mb-4 min-h-[300px] flex items-center justify-center">
                {!videoRef.current?.srcObject ? (
                  <div className="text-center p-4 text-white">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    {cameraLoading ? (
                      <p className="font-medium">Iniciando cámara...</p>
                    ) : (
                      <p className="font-medium">{verificationError || 'La cámara no está disponible'}</p>
                    )}
                  </div>
                ) : (
                  <video 
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto max-h-[60vh]"
                  />
                )}
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  <button 
                    onClick={() => setShowCameraSettings(true)}
                    className="text-blue-600 hover:underline"
                  >
                    Configurar cámara
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={stopCamera}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  {verificationError ? (
                    <button
                      onClick={startCamera}
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
                    >
                      Reintentar
                    </button>
                  ) : (
                    <button
                      onClick={() => verifyAttention(selectedVideo)}
                      disabled={!videoRef.current?.srcObject || cameraLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cameraLoading ? 'Verificando...' : 'Verificar Atención'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de configuración de cámara */}
      {showCameraSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg overflow-hidden w-full max-w-md">
            <div className="flex justify-between items-center bg-gray-800 p-4">
              <h3 className="text-white font-medium">Configuración de cámara</h3>
              <button 
                onClick={() => setShowCameraSettings(false)}
                className="text-white hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <h4 className="font-medium mb-3">Dispositivos disponibles:</h4>
              
              {cameraDevices.length > 0 ? (
                <ul className="space-y-2 mb-4">
                  {cameraDevices.map(device => (
                    <li key={device.deviceId} className="flex items-center">
                      <input
                        type="radio"
                        id={`device-${device.deviceId}`}
                        name="camera-device"
                        className="mr-2"
                        onChange={() => {
                          localStorage.setItem('preferredCamera', device.deviceId);
                        }}
                        defaultChecked={device.deviceId === localStorage.getItem('preferredCamera')}
                      />
                      <label htmlFor={`device-${device.deviceId}`}>
                        {device.label || `Cámara ${device.deviceId.slice(0, 5)}`}
                      </label>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 mb-4">No se detectaron cámaras</p>
              )}
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    localStorage.removeItem('preferredCamera');
                    setShowCameraSettings(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Restablecer
                </button>
                <button
                  onClick={() => {
                    setShowCameraSettings(false);
                    startCamera();
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reproductor de video */}
      {selectedVideo && attentionVerified && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg overflow-hidden w-full max-w-4xl">
            <div className="flex justify-between items-center bg-gray-800 p-4">
              <h3 className="text-white font-medium">{selectedVideo.titulo}</h3>
              <button 
                onClick={() => setSelectedVideo(null)}
                className="text-white hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <video 
              src={`http://localhost:8000${selectedVideo.archivo}`}
              className="w-full"
              controls
              autoPlay
              onError={(e) => {
                console.error('Error en video:', e);
                setVerificationError('Error al cargar el video');
                setSelectedVideo(null);
              }}
              onAbort={() => {
                console.log('Reproducción abortada');
                setSelectedVideo(null);
              }}
              onEnded={() => {
                console.log('Video finalizado');
                setSelectedVideo(null);
              }}
            />
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}