'use client';

import Navbar from "@/components/layout/NavbarEstudiante";
import Footer from "@/components/layout/Footer";

export default function TalleresPage() {
  return (
    <div className="flex flex-col min-h-screen bg-sky-200">
      <Navbar />

      <main className="flex-grow p-6">
        {/* Título principal */}
        <div className="bg-white text-center rounded py-4 mb-6">
          <h1 className="text-3xl font-bold text-black">Talleres</h1>
          <p className="text-gray-700">taller de Fundamentos de Programación</p>
        </div>

        {/* Descripción del taller */}
        <div className="bg-white p-4 rounded mb-6 text-black">
          <p className="font-semibold">Descripción del taller a realizar</p>
          <p>Realice un bucle utilizando el for, while y el do while</p>
          <p className="mt-2">
            Descargar:{" "}
            <a
              href="/docs/Taller_1.pdf"
              download
              className="text-blue-600 underline"
            >
              Taller_1.pdf
            </a>
          </p>
        </div>

        {/* Contenido central */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-10">
          <div className="flex flex-col items-center bg-white p-4 rounded shadow">
            <button className="bg-black text-white px-6 py-2 rounded mb-4">
              Empezar
            </button>
            <img
              src="/images/taller_codigo.png"
              alt="Código del taller"
              className="w-96 border"
            />
          </div>
        </div>

        {/* Navegación */}
        <div className="flex justify-end px-10">
          <button className="bg-black text-white px-6 py-2 rounded">Siguiente</button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
