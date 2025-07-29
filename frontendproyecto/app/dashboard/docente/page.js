'use client';
import ClassGrid from "@/components/dashboard/ClassGrid";
import NavbarDocente from "@/components/layout/NavbarDocente";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DocentePage() {
  const router = useRouter();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para cargar cursos
  const fetchCursos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/cursos/?timestamp=${Date.now()}`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (!response.ok) throw new Error('Error al obtener cursos');
      
      const data = await response.json();
      setCursos(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar cursos al iniciar
  useEffect(() => {
    fetchCursos();
    
    // Verificar autenticación
    const username = localStorage.getItem('username');
    if (!username?.startsWith('P')) {
      router.push('/login');
    }
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Cargando...</div>;

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
          {cursos.length === 0 ? (
            <p className="text-center text-gray-700">No tienes cursos creados aún</p>
          ) : (
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
          )}
        </section>
      </main>
    </div>
  );
}