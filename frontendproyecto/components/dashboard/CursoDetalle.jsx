'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CursoDetalle() {
  const router = useRouter();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurso = async () => {
      try {
        // Obtener ID del curso de la URL (como en el primer código)
        const urlParams = new URLSearchParams(window.location.search);
        const cursoId = urlParams.get('curso');
        
        if (!cursoId) {
          throw new Error('No se especificó un curso');
        }

        // Verificación de token (como en el primer código)
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`http://localhost:8000/api/cursos/${cursoId}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Error al obtener el curso');
        }

        const data = await response.json();
        setCurso(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCurso();
  }, [router]);

  // Estilos de carga del segundo código
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  // Estilos de error del segundo código
  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-4xl mx-auto mt-8">
      {error}
    </div>
  );

  if (!curso) return <div className="text-center py-8">No se encontró el curso</div>;

  // Manteniendo los estilos visuales del segundo código
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-2 text-[#012E4A]">{curso.nombre}</h1>
        <p className="text-gray-600 mb-6">{curso.descripcion}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Videos Educativos - Manteniendo el estilo del segundo código */}
          <Link 
            href={`/dashboard/docente/SubirArchivos/VideoUpload?curso=${curso.id}`}
            className="p-6 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-all hover:shadow-md"
          >
            <div className="text-center">
              <div className="bg-blue-100 p-3 rounded-full inline-block mb-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Videos Educativos</h2>
              <p className="text-sm text-gray-500">Sube material audiovisual para tus estudiantes</p>
            </div>
          </Link>

          {/* Talleres - Manteniendo el estilo del segundo código */}
          <Link 
            href={`/dashboard/docente/SubirArchivos/TallerUpload?curso=${curso.id}`}
            className="p-6 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-all hover:shadow-md"
          >
            <div className="text-center">
              <div className="bg-green-100 p-3 rounded-full inline-block mb-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Talleres Prácticos</h2>
              <p className="text-sm text-gray-500">Publica ejercicios y actividades prácticas</p>
            </div>
          </Link>

          {/* Pruebas - Manteniendo el estilo del segundo código */}
          <Link 
            href={`/dashboard/docente/SubirArchivos/PruebaUpload?curso=${curso.id}`}
            className="p-6 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-all hover:shadow-md"
          >
            <div className="text-center">
              <div className="bg-purple-100 p-3 rounded-full inline-block mb-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">Evaluaciones</h2>
              <p className="text-sm text-gray-500">Crea pruebas y exámenes para evaluar</p>
            </div>
          </Link>
        </div>

        {/* Botones adicionales del primer código */}
        <div className="mt-8 flex justify-end space-x-4">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded text-sm"
            onClick={() => router.push(`/dashboard/docente`)}
          >
            Volver a cursos
          </button>
        </div>
      </div>
    </div>
  );
}