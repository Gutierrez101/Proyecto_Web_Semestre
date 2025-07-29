'use client';
import CursoDetalle from "@/components/dashboard/CursoDetalle";
import Navbar2 from "@/components/layout/NavbarDocente"; 
import { useRouter } from 'next/navigation';

const mockTeacherClasses = [
  { id: 1, title: "Documentación", description: "Info de la clase" },
  { id: 2, title: "Tareas", description: "Lista de actividades" },
  { id: 3, title: "Evaluaciones", description: "Exámenes y resultados" },
  { id: 4, title: "Estudiantes Matriculados", description: "Notas de Estudiantes" }
];

export default function ContenidoDashDocente() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar2 />
      <main className="container mx-auto px-4 py-6">
        {/* Banner superior */}
        <div 
          className="flex justify-center items-center bg-cover bg-top rounded-lg mb-6"
          style={{
            backgroundImage: "url('/ImagenCurso.jpg')",
            minHeight: "300px"
          }}
        ></div>           
      </main>
      <CursoDetalle />
    </div>
  );
}