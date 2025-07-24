'use client';

import Navbar from "@/components/layout/NavbarEstudiante";
import Footer from "@/components/layout/Footer";

// Simula datos del estudiante logeado y sus notas
const estudiante = {
  nombre: "Estudiante Ejemplo", // Aquí deberás obtener el nombre real del usuario logeado
  notas: [
    { actividad: "Video Clase Nº1", nota: 7.0 },
    { actividad: "Taller Nº1", nota: 6.5 },
    { actividad: "Prueba Nº1", nota: 8.0 }
  ]
};

export default function NotasEstudiante() {
  return (
    <div className="flex flex-col min-h-screen bg-sky-200">
      <Navbar />

      <main className="flex-grow p-6">
        <div className="bg-white text-left font-bold py-2 rounded mb-6 text-black">
          Estudiante: {estudiante.nombre}
        </div>
        <div className="bg-white rounded p-4">
          <h2 className="font-bold text-lg mb-4 text-black">Notas de Actividades</h2>
          <table className="w-full text-black">
            <thead>
              <tr>
                <th className="text-left p-2">Actividad</th>
                <th className="text-left p-2">Nota</th>
              </tr>
            </thead>
            <tbody>
              {estudiante.notas.map((nota, idx) => (
                <tr key={idx}>
                  <td className="p-2">{nota.actividad}</td>
                  <td className="p-2">{nota.nota}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  );
}