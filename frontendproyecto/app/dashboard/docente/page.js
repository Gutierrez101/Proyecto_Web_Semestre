'use client';
import ClassGrid from "@/components/dashboard/ClassGrid";
import Navbar2 from "@/components/layout/NavbarDocente";

// Ejemplo de datos simulados para las clases
const mockClasses = [
  { id: 1, title: "Introducción a la Programación" }
];

export default function DocentePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar2 />
      <main>
        <div
          className="flex justify-center items-center bg-cover bg-top"
          style={{
            backgroundImage: "url('/logo_estudiante.jpg')",
            minHeight: "420px"
          }}
        >
          <h1 className="text-3xl font-bold text-gray-900 bg-white bg-opacity-80 px-6 py-4 rounded-xl shadow text-center">
            Bienvenido Nombre Docente
          </h1>
        </div>
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
        style={{ backgroundColor: "#81BECE" }}>
          <h2
            className="text-2xl font-bold mb-4 text-center"
            style={{ color: "#012E4A" }}
          >
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