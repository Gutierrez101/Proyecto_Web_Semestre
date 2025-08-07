'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavbarEstudiante from '@/components/layout/NavbarEstudiante';
import Footer from '@/components/layout/Footer';
import ClassGrid from '@/components/dashboard/ClassGrid';
import CameraComponent from '@/components/dashboard/CameraComponent';

export default function StudentPage() {
  const router = useRouter();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [attentionResults, setAttentionResults] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchCursos = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/mis-cursos/', {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setCursos(data);
        } else {
          console.error('Error al obtener cursos');
        }
      } catch (error) {
        console.error('Error de conexión:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCursos();
  }, [router]);

  const handleCursoClick = (cursoId) => {
    router.push(`/dashboard/estudiante/curso/${cursoId}`);
  };

  const handleStartMonitoring = (videoElement) => {
    console.log("Iniciando monitoreo con el elemento de video:", videoElement);
    // Implementar lógica de MediaPipe aquí si es necesario
  };

  const handleStopMonitoring = (results) => {
    if (results.length > 0) {
      setAttentionResults(prev => [...prev, {
        date: new Date().toISOString(),
        percentage: (results.filter(r => r.data?.is_paying_attention).length / results.length) * 100
      }]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavbarEstudiante />
        <div className="text-center p-8">Cargando cursos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavbarEstudiante />
      <main>
        <div className="flex justify-center items-center bg-cover bg-top min-h-[420px]"
             style={{ backgroundImage: "url('/logo_estudiante.jpg')" }}>
          <h1 className="text-3xl font-bold text-gray-900 bg-white bg-opacity-80 px-6 py-4 rounded-xl shadow text-center">
            Bienvenido Estudiante
          </h1>
        </div>
      </main>
      
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-[#81BECE]">
        {/* Sección de cámara cuando está activa */}
        {showCamera && (
          <div className="mb-6 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Monitoreo de Atención</h2>
            <CameraComponent 
              onStartMonitoring={handleStartMonitoring}
              onStopMonitoring={handleStopMonitoring}
            />
          </div>
        )}

        {/* Resumen de atención si hay resultados */}
        {attentionResults.length > 0 && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Tus Estadísticas de Atención</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {attentionResults.map((result, index) => (
                <div key={index} className="border border-gray-200 p-3 rounded-lg">
                  <h3 className="font-medium">
                    Sesión {index + 1} - {new Date(result.date).toLocaleDateString()}
                  </h3>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${result.percentage > 70 ? 'bg-green-500' : result.percentage > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                        style={{ width: `${result.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-sm mt-1 text-gray-600">
                      Atención promedio: {result.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#012E4A]">
            Tus Cursos
          </h2>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowCamera(!showCamera)}
              className={`px-4 py-2 rounded ${showCamera ? 'bg-gray-500 hover:bg-gray-600' : 'bg-[#012E4A] hover:bg-[#034168]'} text-white`}
            >
              {showCamera ? 'Ocultar Cámara' : 'Mostrar Cámara'}
            </button>
            <button 
              onClick={() => router.push('/dashboard/estudiante/unirseClaseEstudiante')}
              className="bg-[#012E4A] text-white px-4 py-2 rounded hover:bg-[#034168]"
            >
              Unirse a otro curso
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <ClassGrid 
            classes={cursos} 
            onItemClick={handleCursoClick}
            mode="estudiante"
          />
        </div>
      </section>
    </div>
  );
}