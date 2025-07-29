"use client";
import { useRouter } from 'next/navigation';

export default function CursoDetalle() {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-b  bg-[#81BECE] min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Contenido</h1>
        <div className="space-y-4">
          {/* Videos para Clases */}
          <div className="bg-white bg-opacity-80 rounded-lg p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Video para Clase</h2>
              <p className="text-gray-600 text-sm">Fragmento que lean como quiere dólares así aun, comentarias</p>
            </div>
            <div className="flex gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded text-sm"
                onClick={() => router.push('/dashboard/docente/SubirArchivos/VideoUpload')}
              >
                Ver
              </button>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                onClick={() => router.push('/dashboard/docente/SubirArchivos/VideoUpload')}
              >
                Editar
              </button>
            </div>
          </div>
          {/* Tareas */}
          <div className="bg-white bg-opacity-80 rounded-lg p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Taller</h2>
              <p className="text-gray-600 text-sm">Fragmento que lean como quiere dólares así aun, comentarias</p>
            </div>
            <div className="flex gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded text-sm"
                onClick={() => router.push('/dashboard/docente/SubirArchivos/TallerUpload')}
              >
                Ver
              </button>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                onClick={() => router.push('/dashboard/docente/SubirArchivos/TallerUpload')}
              >
                Editar
              </button>
            </div>
          </div>
          {/* Evaluaciones */}
          <div className="bg-white bg-opacity-80 rounded-lg p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Evaluacion</h2>
              <p className="text-gray-600 text-sm">Fragmento que lean como quiere dólares así aun, comentarias</p>
            </div>
            <div className="flex gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded text-sm"
                onClick={() => router.push('/dashboard/docente/SubirArchivos/PruebaUpload')}
              >
                Ver
              </button>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                onClick={() => router.push('/dashboard/docente/SubirArchivos/PruebaUpload')}
              >
                Editar
              </button>
            </div>
          </div>
          {/* Estudiantes Matriculados */}
          <div className="bg-white bg-opacity-80 rounded-lg p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Estudiantes Matriculados</h2>
              <p className="text-gray-600 text-sm">Fragmento que lean como quiere dólares así aun, comentarias</p>
            </div>
                        <div className="flex gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded text-sm"
                onClick={() => router.push('')}
              >
                Ver
              </button>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm"
                onClick={() => router.push('')}
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}