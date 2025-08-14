'use client';

import { useEffect, useState } from 'react';
import Navbar from "@/components/layout/NavbarEstudiante";
import Footer from "@/components/layout/Footer";

export default function NotasEstudiante() {
  const [data, setData] = useState({
    nombre: "Cargando...",
    notas: [],
    promedio: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotas = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No hay token de autenticación');
        }

        const response = await fetch(`http://localhost:8000/api/estudiante/notas/`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.status === 401) {
          throw new Error('No autorizado - Token inválido o expirado');
        }

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        
        setData({
          nombre: result.nombre || "Estudiante",
          notas: result.notas?.map(item => ({
            actividad: item.actividad || `${item.tipo} ${item.id}`,
            nota: item.nota ? Number(item.nota).toFixed(1) : "N/A",
            maximo: item.maximo || 10,
            porcentaje: item.porcentaje || 0,
            fecha: item.fecha || "Sin fecha"
          })) || [],
          promedio: result.promedio ? Number(result.promedio).toFixed(1) : 0
        });
      } catch (err) {
        console.error("Error al obtener notas:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotas();
  }, []);


  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-sky-200">
        <Navbar />
        <main className="flex-grow p-6">
          <div className="bg-white rounded p-4 text-center">
            <p>Cargando notas...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-sky-200">
        <Navbar />
        <main className="flex-grow p-6">
          <div className="bg-white rounded p-4 text-center text-red-500">
            <p>Error: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Reintentar
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-sky-200">
      <Navbar />

      <main className="flex-grow p-6">
        <div className="bg-white text-left font-bold py-2 rounded mb-6 text-black">
          Estudiante: {data.nombre}
          {data.promedio > 0 && (
            <span className="float-right">Promedio: {data.promedio}%</span>
          )}
        </div>
        
        <div className="bg-white rounded p-4">
          <h2 className="font-bold text-lg mb-4 text-black">Notas de Actividades</h2>
          
          {data.notas.length > 0 ? (
            <table className="w-full text-black">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Actividad</th>
                  <th className="text-left p-2">Nota</th>
                  <th className="text-left p-2">Porcentaje</th>
                  <th className="text-left p-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.notas.map((nota, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="p-2">{nota.actividad}</td>
                    <td className="p-2">{nota.nota} / {nota.maximo}</td>
                    <td className="p-2">{nota.porcentaje}%</td>
                    <td className="p-2">{nota.fecha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500">No hay notas registradas</p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}