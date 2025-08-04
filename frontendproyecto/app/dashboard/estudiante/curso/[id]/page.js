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
  const videoRef = useRef(null);
  const streamRef = useRef(null);

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

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setCameraActive(true);
      setVerificationError(null);
    } catch (err) {
      console.error('Error al acceder a la cámara:', err);
      setVerificationError('Debes permitir el acceso a la cámara para ver este video');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const verifyAttention = async (videoResource) => {
    try {
      if (!streamRef.current) {
        throw new Error('La cámara no está activa');
      }

      // Capturar frame del video
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const imageCapture = new ImageCapture(videoTrack);
      const frame = await imageCapture.grabFrame();
      
      // Convertir a Blob
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(frame, 0, 0);
      
      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.8);
      });

      // Enviar al backend para verificación
      const formData = new FormData();
      formData.append('frame', blob, 'attention_check.jpg');

      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8000/api/videos/${videoResource.id}/verify/`, 
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`
          },
          body: formData
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo verificar tu atención');
      }

      // Si la verificación es exitosa
      setAttentionVerified(true);
      setSelectedVideo({
        ...videoResource,
        token: data.token
      });
      stopCamera();

    } catch (err) {
      console.error('Error en verificación:', err);
      setVerificationError(err.message);
    }
  };

  const handleVideoClick = async (videoResource) => {
    if (attentionVerified && selectedVideo?.id === videoResource.id) {
      // Si ya está verificado, simplemente mostrar el video
      setSelectedVideo({
        ...videoResource,
        token: selectedVideo.token
      });
      return;
    }

    // Resetear estados
    setAttentionVerified(false);
    setSelectedVideo(null);
    setVerificationError(null);

    // Iniciar proceso de verificación
    if (!cameraActive) {
      await startCamera();
    }
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
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <p className="mb-4">Por favor, mira directamente a la cámara para verificar tu atención:</p>
              
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-auto max-h-[60vh]"
                />
              </div>
              
              {verificationError && (
                <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                  {verificationError}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={stopCamera}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => verifyAttention(selectedVideo)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Verificar Atención
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reproductor de video */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg overflow-hidden w-full max-w-4xl">
            <div className="flex justify-between items-center bg-gray-800 p-3">
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
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}