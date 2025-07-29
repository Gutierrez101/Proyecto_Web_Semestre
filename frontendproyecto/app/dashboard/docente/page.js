'use client';
import ClassGrid from "@/components/dashboard/ClassGrid";
import NavbarDocente from "@/components/layout/NavbarDocente";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DocentePage() {
  const router = useRouter();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCursos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/cursos/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      console.log('Response status:', response.status); // Para depuración

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al obtener cursos');
      }

      const data = await response.json();
      console.log('Datos recibidos:', data); // Para depuración
      setCursos(data);
      setError(null);
    } catch (err) {
      console.error('Error al obtener cursos:', err);
      setError(err.message);
      setCursos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (!username?.startsWith('P')) {
      router.push('/login');
    } else {
      fetchCursos();
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        Cargando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={fetchCursos}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavbarDocente nombreEstudiante="Nombre Docente" />
      <main>
        <div className="flex justify-center items-center bg-cover bg-top min-h-[420px]"
          style={{ backgroundImage: "url('/logo_estudiante.jpg')" }}>
          <h1 className="text-3xl font-bold text-gray-900 bg-white bg-opacity-80 px-6 py-4 rounded-xl shadow text-center">
            Bienvenido Docente
          </h1>
        </div>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-[#81BECE]">
          <h2 className="text-2xl font-bold mb-4 text-center text-[#012E4A]">
            Tus Cursos
          </h2>
          {cursos.length > 0 ? (
            <div className="flex justify-center">
              <ClassGrid classes={cursos.map(curso => ({
                tema: curso.nombre,
                recursos: [
                  `Código: ${curso.codigo}`,
                  `Descripción: ${curso.descripcion}`,
                  `Creado: ${new Date(curso.fecha_creacion).toLocaleDateString()}`
                ]
              }))} />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-700 mb-4">No tienes cursos creados aún</p>
              <button
                onClick={() => router.push('/dashboard/docente/crearcurso')}
                className="px-4 py-2 bg-[#012E4A] text-white rounded hover:bg-[#034168]"
              >
                Crear primer curso
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}