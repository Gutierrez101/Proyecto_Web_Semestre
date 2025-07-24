'use client';

import Navbar from "@/components/layout/NavbarEstudiante";
import Footer from "@/components/layout/Footer";
import ClassGrid from "@/components/dashboard/ClassGrid";



export default function DashboardEstudiante() {
  const temas = [
    { tema: "TEMA 1", recursos: ["Video Clase Nº1", "Taller Nº1", "Prueba Nº1"] },
    { tema: "TEMA 2", recursos: [] },
    { tema: "TEMA 3", recursos: [] },
    { tema: "Notas", recursos: [] }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-sky-200">
      <Navbar />

      <main className="flex-grow p-6">
        <div className="bg-white text-center font-bold py-2 rounded mb-6 text-black">
          Fundamentos de Programación
        </div>

        <ClassGrid classes={temas} />
      </main>

      <Footer />
    </div>
  );
}
