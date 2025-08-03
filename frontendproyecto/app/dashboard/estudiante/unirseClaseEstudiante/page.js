'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/NavbarEstudiante";
import Footer from "@/components/layout/Footer";

export default function RegistroCurso() {
  const [codigoCurso, setCodigoCurso] = useState("");
  const [estado, setEstado] = useState({ mensaje: "", exito: false, detalles: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegistro = async () => {
    if (!codigoCurso.trim()) return;
    
    setLoading(true);
    setEstado({ mensaje: "", exito: false, detalles: "" });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/cursos/unirse/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ codigo: codigoCurso.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la solicitud');
      }

      setEstado({ 
        mensaje: data.mensaje || "¡Te has unido al curso exitosamente!", 
        exito: true,
        detalles: ""
      });
      
      // Redirigir después de 2 segundos
      setTimeout(() => router.push('/dashboard/estudiante'), 2000);
    } catch (err) {
      console.error('Error en handleRegistro:', err);
      setEstado({ 
        mensaje: "Error al unirse al curso", 
        exito: false,
        detalles: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-sky-200">
      <Navbar />

      <main className="flex-grow p-6 flex justify-center items-center">
        <div className="bg-sky-900 p-8 rounded-2xl w-full max-w-md text-white">
          <h1 className="text-xl font-bold mb-6">Unirse a un Curso</h1>

          <div className="mb-4">
            <label className="block mb-2 font-semibold">Código del curso:</label>
            <input
              type="text"
              className="w-full p-2 rounded bg-blue-200 text-black"
              value={codigoCurso}
              onChange={(e) => setCodigoCurso(e.target.value)}
              placeholder="Ingresa el código del curso"
              disabled={loading}
            />
          </div>

          {estado.mensaje && (
            <div className={`mb-4 p-3 rounded-md ${
              estado.exito 
                ? 'bg-green-300 text-green-900' 
                : 'bg-red-300 text-red-900'
            }`}>
              <p>{estado.mensaje}</p>
              {estado.detalles && <p className="text-xs mt-1">{estado.detalles}</p>}
            </div>
          )}

          <button
            className={`w-full py-2 px-4 rounded font-medium ${
              codigoCurso.trim() && !loading
                ? 'bg-sky-300 hover:bg-sky-400 text-black'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={handleRegistro}
            disabled={!codigoCurso.trim() || loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </span>
            ) : (
              'Unirse al Curso'
            )}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}