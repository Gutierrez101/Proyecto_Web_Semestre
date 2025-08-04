'use client';
import NavbarDocente from "@/components/layout/NavbarDocente"; 
import { useRouter, useSearchParams } from 'next/navigation';

export default function EstudiantesCurso() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cursoId = searchParams.get('curso');

  // Datos simulados de estudiantes
  const estudiantes = [
    "Dilan Moya",
    "Mateo Gutierrez",
    "List item",
    "List item",
    "List item",
    "List item",
    "List item",
    "List item",
    "List item",
    "List item",
    "List item",
  ];

  if (!cursoId) {
    router.push('/dashboard/docente');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#98c1d9]">
      <NavbarDocente />

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold text-black mb-4">Estudiantes Curso:</h1>

        <div className="bg-[#f4f0f8] p-6 rounded-lg max-w-xl mx-auto shadow-md">
          <ul className="space-y-4">
            {estudiantes.map((nombre, idx) => (
              <li key={idx} className="flex items-center justify-between bg-white px-4 py-2 rounded-lg shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="bg-purple-200 text-purple-700 font-bold rounded-full w-8 h-8 flex items-center justify-center">
                    A
                  </div>
                  <span className="text-sm font-medium">{nombre}</span>
                </div>
                <button className="text-purple-600 hover:text-purple-800">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
