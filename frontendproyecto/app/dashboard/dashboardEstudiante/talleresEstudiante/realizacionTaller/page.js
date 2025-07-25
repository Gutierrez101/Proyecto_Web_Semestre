'use client';

import { useEffect, useRef, useState } from 'react';
import Navbar from "@/components/layout/NavbarEstudiante";
import Footer from "@/components/layout/Footer";

export default function TallerMonitoreoPage() {
  const videoRef = useRef(null);
  const [respuesta, setRespuesta] = useState("");
  const [monitoreando, setMonitoreando] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(error => {
        console.error("No se pudo acceder a la cámara:", error);
      });
  }, []);

  const manejarSubida = () => {
    alert(`Respuesta enviada: ${respuesta}`);
    // Aquí puedes conectar con tu backend si necesitas subir datos reales
  };

  return (
    <div className="flex flex-col min-h-screen bg-sky-200">
      <Navbar />

      <main className="flex-grow p-6">
        {/* Título */}
        <div className="bg-white rounded text-center font-bold text-2xl py-4 text-black mb-4">
          Fundamentos de Programación
        </div>

        {/* Botón hecho */}
        <div className="flex justify-center mb-6">
          <button className="bg-black text-white px-4 py-2 rounded">
            Hecho
          </button>
        </div>

        {/* Taller Nº1 info */}
        <div className="bg-white p-4 rounded mb-6 text-black">
          <p className="font-semibold">Taller Nº1</p>
        </div>

        {/* Sección cámara y respuesta */}
        <div className="flex flex-col md:flex-row items-start gap-6 bg-white p-6 rounded mb-6">
          {/* Lado izquierdo: cámara */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setMonitoreando(true)}
              className="bg-black text-white px-6 py-2 rounded mb-4"
            >
              Empezar
            </button>
            <video ref={videoRef} className="w-64 h-48 border" />
          </div>

          {/* Lado derecho: campo de texto */}
          <div className="flex flex-col flex-1">
            <label className="text-black font-semibold mb-2">Descripción del taller</label>
            <textarea
              className="p-2 border rounded resize-none"
              rows={4}
              placeholder="Ingrese su respuesta"
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
            />
          </div>
        </div>

        {/* Botón subir */}
        <div className="flex justify-end px-4 mb-8">
          <button
            onClick={manejarSubida}
            className="bg-black text-white px-6 py-2 rounded"
          >
            Subir
          </button>
        </div>

        {/* Navegación */}
        <div className="flex justify-between px-10">
          <button className="bg-black text-white px-6 py-2 rounded">Volver al Inicio</button>
          <button className="bg-black text-white px-6 py-2 rounded">Siguiente</button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
