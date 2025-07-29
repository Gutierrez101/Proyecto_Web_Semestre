'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CursoDetalle() {
  const router = useRouter();
  const [curso, setCurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCurso = async () => {
      try {
        // Obtener ID del curso de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const cursoId = urlParams.get('curso');
        
        if (!cursoId) {
          throw new Error('No se especificó un curso');
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/cursos/${cursoId}/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
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
  }, []);

  if (loading) return <div className="text-center py-8">Cargando...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="bg-gradient-to-b bg-[#81BECE] min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Contenido del curso: {curso?.nombre}</h1>
        <div className="space-y-4">
          {/* Videos para Clases */}
          <div className="bg-white bg-opacity-80 rounded-lg p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Video para Clase</h2>
              <p className="text-gray-600 text-sm">{curso?.descripcion}</p>
            </div>
            <div className="flex gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded text-sm"
                onClick={() => router.push(`/dashboard/docente/SubirArchivos/VideoUpload?curso=${curso.id}`)}
              >
                Ver
              </button>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                onClick={() => router.push(`/dashboard/docente/SubirArchivos/VideoUpload?curso=${curso.id}`)}
              >
                Editar
              </button>
            </div>
          </div>
          
          {/* Otras secciones similares con datos del curso */}
        </div>
      </div>
    </div>
  );
}