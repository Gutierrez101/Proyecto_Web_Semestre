// esta pestaña es para el curso del estudiante
//donde se verán los detalles del curso, videos, talleres y pruebas
'use client';
import { useEffect, useState } from 'react';
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

        // Obtener todos los datos en paralelo
        const [cursoRes, videosRes, talleresRes, pruebasRes] = await Promise.all([
          fetch(`http://localhost:8000/api/cursos/${id}/`, { headers }),
          fetch(`http://localhost:8000/api/cursos/${id}/videos/`, { headers }),
          fetch(`http://localhost:8000/api/cursos/${id}/talleres/`, { headers }),
          fetch(`http://localhost:8000/api/cursos/${id}/pruebas/`, { headers })
        ]);

        // Verificar respuestas
        if (!cursoRes.ok) throw new Error('Error al obtener el curso');
        
        const cursoData = await cursoRes.json();
        setCurso(cursoData);
        
        if (videosRes.ok) setVideos(await videosRes.json());
        if (talleresRes.ok) setTalleres(await talleresRes.json());
        if (pruebasRes.ok) setPruebas(await pruebasRes.json());

      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  // Función para obtener el tipo de archivo
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

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Componente para mostrar recursos
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

              <div className="mt-3 flex flex-wrap gap-2">
                {resourceType === 'video' && (
                  <a 
                    href={`http://localhost:8000${resource.archivo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Ver Video
                  </a>
                )}
                
                {(resourceType === 'taller' || resourceType === 'prueba') && (
                  <a 
                    href={`http://localhost:8000${resource.archivo || resource.archivo_xml}`}
                    download
                    className="inline-flex items-center bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    Descargar
                  </a>
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
          {/* Encabezado del curso */}
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
          
          {/* Secciones de recursos */}
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
          
          {/* Botón de volver */}
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
      

    </div>
  );
}