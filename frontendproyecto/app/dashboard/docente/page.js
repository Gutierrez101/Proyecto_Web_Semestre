'use client';
import ClassGrid from "@/components/dashboard/ClassGrid";
import NavbarDocente from "@/components/layout/NavbarDocente";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Datos de ejemplo mejor estructurados
const mockClasses = [
  { 
    tema: "Introducción a la Programación",
    recursos: ["Material de clase", "Ejercicios prácticos", "Guía de estudio"]
  },
  { 
    tema: "Algoritmos Avanzados",
    recursos: ["Presentaciones", "Proyectos", "Casos de estudio"]
  }
];

export default function DocentePage() {
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación y tipo de usuario
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!token || !username?.startsWith('P')) {
      router.push('/login');
    }
  }, []);

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
          <div className="flex justify-center">
            <ClassGrid classes={mockClasses} />
          </div>
        </section>
      </main>
    </div>
  );
}