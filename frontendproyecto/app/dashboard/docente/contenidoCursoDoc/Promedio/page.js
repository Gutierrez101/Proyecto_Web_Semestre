'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import NavbarDocente from "@/components/layout/NavbarDocente";

const datos = [
  {
    nombre: "Video Clase 1",
    tipo: "1 Video",
    atencion: 75,
    nota: "/",
    notaFinal: "15/20",
  },
  {
    nombre: "Taller",
    tipo: "2 Talleres",
    atencion: 30,
    nota: "15/20",
    notaFinal: "9/20",
  },
  {
    nombre: "Prueba",
    tipo: "2 Evaluaciones",
    atencion: 65,
    nota: "16/20",
    notaFinal: "16.50/20",
  },
];

export default function EstadisticasEstudiante() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nombre = searchParams.get('nombre') || "Nombre del estudiante";

  return (
    <div className="min-h-screen bg-[#98c1d9]">
      <NavbarDocente />

      <main className="container mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold mb-2 text-black">Estudiantes Curso:</h1>
        <h2 className="text-md font-medium mb-6 text-black">{nombre}</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-[#98c1d9]">
            <thead>
              <tr className="text-left text-black font-semibold border-b border-gray-300">
                <th className="py-2">Nombre</th>
                <th className="py-2">Nivel de Atención</th>
                <th className="py-2">Nota</th>
                <th className="py-2">Nota Final</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((item, idx) => (
                <tr key={idx} className="text-black border-t border-gray-200">
                  <td className="py-4">
                    <div className="font-medium">{item.nombre}</div>
                    <div className="text-sm text-gray-700">{item.tipo}</div>
                  </td>
                  <td className="py-4">
                    <div className="w-12 h-12 relative">
                      <svg className="absolute top-0 left-0" viewBox="0 0 36 36">
                        <path
                          className="text-gray-300"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={
                            item.atencion >= 70
                              ? "text-green-500"
                              : item.atencion >= 50
                              ? "text-yellow-400"
                              : "text-red-500"
                          }
                          stroke="currentColor"
                          strokeWidth="4"
                          strokeDasharray={`${item.atencion}, 100`}
                          fill="none"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                        {item.atencion}%
                      </div>
                    </div>
                  </td>
                  <td className="py-4">{item.nota}</td>
                  <td className="py-4">{item.notaFinal}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
