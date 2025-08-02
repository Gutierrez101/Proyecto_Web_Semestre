'use client';

import Navbar from "@/components/layout/NavbarEstudiante";
import Footer from "@/components/layout/Footer";
import { useState } from "react";

export default function RegistroCurso() {
  const [codigoCurso, setCodigoCurso] = useState("");
  const [estadoRegistro, setEstadoRegistro] = useState("");

  const handleRegistro = () => {
    // Aquí deberías hacer la lógica real de verificación en el backend
    if (codigoCurso.trim() !== "") {
      setEstadoRegistro("Registro Exitoso");
    } else {
      setEstadoRegistro("Ingrese un código válido");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-sky-200">
      <Navbar />

      <main className="flex-grow p-6 flex justify-center items-center">
        <div className="bg-sky-900 p-8 rounded-2xl w-full max-w-md text-white">
          <h1 className="text-xl font-bold mb-6">Registrarse a un Curso</h1>

          <div className="mb-4">
            <label className="block mb-2 font-semibold">Código de la curso:</label>
            <input
              type="text"
              className="w-full p-2 rounded bg-blue-200 text-black"
              value={codigoCurso}
              onChange={(e) => setCodigoCurso(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold">Registro:</label>
            <span>{estadoRegistro}</span>
          </div>

          <button
            className="bg-sky-300 hover:bg-sky-400 text-black px-4 py-2 rounded"
            onClick={handleRegistro}
          >
            Registrarse Curso
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
