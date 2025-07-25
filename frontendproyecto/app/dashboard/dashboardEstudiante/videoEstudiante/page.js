'use client';

import { useRef, useEffect, useState } from 'react';
import Navbar from "@/components/layout/NavbarEstudiante";
import Footer from "@/components/layout/Footer";

export default function Page() {
  const videoRef = useRef(null);
  const [camaraActiva, setCamaraActiva] = useState(false);

  useEffect(() => {
    // Activar cámara automáticamente al entrar a la página
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCamaraActiva(true); // Se marca como activa al obtener el stream
        }
      })
      .catch(err => {
        console.error("Error al acceder a la cámara:", err);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-sky-200">
      <Navbar />

      <main className="flex-grow p-6">
        <div className="bg-white rounded text-center font-bold text-2xl py-4 text-black mb-4">
          Fundamentos de Programación
        </div>

        <div className="flex justify-center mb-4">
          <button className="bg-black text-white px-4 py-2 rounded">
            Hecho
          </button>
        </div>

        <div className="bg-white p-4 rounded mb-6 text-black">
          <p><strong>Video Nº1</strong></p>
          <p>Descripción: Qué son variables</p>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-start gap-6 mb-6">
          {/* Cámara */}
          <div className="flex flex-col items-center bg-white p-4 rounded shadow">
            <video ref={videoRef} className="w-64 h-48 border mb-2" />
            <button
              onClick={() => console.log("Monitoreo iniciado")}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Comenzar
            </button>
          </div>

          {/* Video de clase */}
          <div className="bg-white p-4 rounded shadow">
            <video controls className="w-96 h-48">
              <source src="/videos/fundamentos.mp4" type="video/mp4" />
              Tu navegador no soporta el video.
            </video>
          </div>
        </div>

        <div className="flex justify-between px-10">
          <button className="bg-black text-white px-6 py-2 rounded">Volver al inicio</button>
          <button className="bg-black text-white px-6 py-2 rounded">Continuar</button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
