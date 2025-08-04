'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import NavbarDocente from "@/components/layout/NavbarDocente";
import { useState } from 'react';

export default function EstudianteDetalle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nombre = searchParams.get('nombre') || "Nombre del estudiante";

  const [temaActivo, setTemaActivo] = useState(null);

  const toggleTema = (index) => {
    setTemaActivo(temaActivo === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#98c1d9]">
      <NavbarDocente />

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold mb-2 text-black">Estudiantes Curso:</h1>
        <h2 className="text-md font-medium mb-6 text-black">{nombre}</h2>

        <div className="space-y-4 max-w-2xl mx-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md">
              <button
                onClick={() => toggleTema(i)}
                className="w-full text-left px-6 py-4 font-medium text-black hover:bg-gray-100 flex justify-between items-center"
              >
                <span>TEMA {i}</span>
                <span>{temaActivo === i ? '▲' : '▼'}</span>
              </button>
              {temaActivo === i && (
                <div className="px-6 py-4 border-t text-sm text-gray-600">
                  Aquí puedes colocar el contenido del Tema {i}, como archivos, tareas o asistencia.
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <button
            onClick={() => router.back()}
            className="bg-black text-white px-8 py-2 rounded-md hover:bg-gray-800"
          >
            Volver
          </button>
        </div>
      </main>
    </div>
  );
}
