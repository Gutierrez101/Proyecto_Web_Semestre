'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import NavbarEstudiante from '@/components/layout/NavbarEstudiante';
import Footer from '@/components/layout/Footer';

export default function ResultadosEstudiante() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pruebaId = searchParams.get('prueba');
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResultados = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }
        // Endpoint para usar el nuevo de resultados evaluados por OpenAI
        const res = await fetch(`http://localhost:8000/api/resultados-estudiante/?prueba=${pruebaId}`, {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (!res.ok) throw new Error('No se pudieron cargar los resultados');
        const data = await res.json();
        setResultados(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (pruebaId) fetchResultados();
  }, [id, pruebaId, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavbarEstudiante />
        <main className="flex-grow p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando resultados...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !resultados) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavbarEstudiante />
        <main className="flex-grow p-6 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="bg-red-100 text-red-700 p-3 rounded-full inline-flex mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar resultados</h3>
            <p className="text-gray-600 mb-4">{error || 'No hay resultados disponibles'}</p>
            <button 
              onClick={() => router.push(`/dashboard/estudiante/curso/${id}`)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Volver al curso
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <NavbarEstudiante />
      <main className="flex-grow p-4 md:p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Resultados de la Prueba</h1>
          <div className="mb-6">
            <p className="text-gray-700"><strong>Puntaje:</strong> {resultados.puntaje} / {resultados.total}</p>
            <p className="text-gray-700"><strong>Porcentaje:</strong> {((resultados.puntaje / resultados.total) * 100).toFixed(1)}%</p>
            <p className="text-gray-700"><strong>Fecha:</strong> {resultados.fecha}</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Detalle de Preguntas</h2>
            <ul className="space-y-4">
              {resultados.detalle.map((pregunta, idx) => (
                <li key={idx} className={`p-4 rounded-lg ${pregunta.correcta ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                  <p className="font-medium text-gray-800">{pregunta.texto}</p>
                  <p className="text-gray-700">Tu respuesta: <span className="font-semibold">{pregunta.respuesta_usuario}</span></p>
                  <p className="text-gray-700">Respuesta correcta: <span className="font-semibold">{pregunta.respuesta_correcta}</span></p>
                  {pregunta.explicacion && (
                    <p className="text-gray-500 mt-2">Explicación: {pregunta.explicacion}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <button 
              onClick={() => router.push(`/dashboard/estudiante/curso/${id}`)}
              className="flex items-center bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Volver al curso
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}