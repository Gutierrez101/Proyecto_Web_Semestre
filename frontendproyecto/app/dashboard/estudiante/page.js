'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavbarEstudiante from '@/components/layout/NavbarEstudiante';
import Footer from '@/components/layout/Footer';
import ClassGrid from '@/components/dashboard/ClassGrid';

export default function StudentPage() {
  const router = useRouter();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchCursos = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/mis-cursos/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setCursos(data);
        } else {
          console.error('Error al obtener cursos');
        }
      } catch (error) {
        console.error('Error de conexión:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCursos();
  }, [router]);

  const handleCursoClick = (cursoId) => {
    router.push(`/dashboard/estudiante/curso/${cursoId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavbarEstudiante />
        <div className="text-center p-8">Cargando cursos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavbarEstudiante />
      <main>
        <div className="flex justify-center items-center bg-cover bg-top min-h-[420px]"
             style={{ backgroundImage: "url('/logo_estudiante.jpg')" }}>
          <h1 className="text-3xl font-bold text-gray-900 bg-white bg-opacity-80 px-6 py-4 rounded-xl shadow text-center">
            Bienvenido Estudiante
          </h1>
        </div>
      </main>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-[#81BECE]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#012E4A]">
            Tus Cursos
          </h2>
          <button 
            onClick={() => router.push('/dashboard/estudiante/unirseClaseEstudiante')}
            className="bg-[#012E4A] text-white px-4 py-2 rounded hover:bg-[#034168]"
          >
            Unirse a otro curso
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <ClassGrid 
            classes={cursos} 
            onItemClick={handleCursoClick}
            mode="estudiante"
          />
        </div>
      </section>
    </div>
  );
}