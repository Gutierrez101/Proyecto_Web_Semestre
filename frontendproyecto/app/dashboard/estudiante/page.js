'use client';
import ClassGrid from "@/components/dashboard/ClassGrid";
import Navbar from "@/components/layout/NavbarEstudiante";
import { useEffect, useState } from 'react';

export default function StudentPage() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/cursos/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        const data = await res.json();
        setCursos(data);
      } catch (error) {
        console.error('Error fetching cursos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCursos();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Cargando cursos...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main>
        <div className="flex justify-center items-center bg-cover bg-top min-h-[420px]"
             style={{ backgroundImage: "url('/logo_estudiante.jpg')" }}>
          <h1 className="text-3xl font-bold text-gray-900 bg-white bg-opacity-80 px-6 py-4 rounded-xl shadow text-center">
            Bienvenido Estudiante
          </h1>
        </div>
      </main>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-[#81BECE]">
        <h2 className="text-2xl font-bold mb-4 text-center text-[#012E4A]">
          Tus Cursos
        </h2>
        <div className="flex justify-center">
          <ClassGrid classes={cursos.map(curso => ({
            id: curso.id,
            title: curso.nombre,
            // ...otros campos necesarios
          }))} />
        </div>
      </section>
    </div>
  );
}