'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NavbarEstudiante from '@/components/layout/NavbarEstudiante';
import Footer from '@/components/layout/Footer';
import CameraComponent from '@/components/dashboard/CameraComponent';
import { Download, FileText, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function RealizacionTallerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [taller, setTaller] = useState(null);
  const [respuesta, setRespuesta] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [attentionResults, setAttentionResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [attentionPercentage, setAttentionPercentage] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchTaller = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`http://localhost:8000/api/talleres/${id}/`, {
          headers: {
            'Authorization': `Token ${token}`,
          }
        });

        if (!response.ok) throw new Error('Error al obtener el taller');
        
        const data = await response.json();
        // Asegurar que la URL del archivo sea completa
        data.archivo_url = data.archivo.startsWith('http') 
          ? data.archivo 
          : `http://localhost:8000${data.archivo}`;
        setTaller(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTaller();
  }, [id, router]);

  const handleStartMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setIsMonitoring(true);
    } catch (err) {
      alert('Debes permitir el acceso a la cámara para realizar este taller');
      console.error('Error al acceder a la cámara:', err);
    }
  };

  const handleStopMonitoring = (results) => {
    setIsMonitoring(false);
    if (results.length > 0) {
      setAttentionResults(results);
      // Calcular porcentaje de atención
      const totalFrames = results.length;
      const attentiveFrames = results.filter(item => item.data?.is_paying_attention).length;
      const percentage = totalFrames > 0 ? (attentiveFrames / totalFrames) * 100 : 0;
      setAttentionPercentage(percentage);
    }
  };

  const handleSubmit = async () => {
    if (!respuesta.trim()) {
      setError('Por favor escribe tu respuesta antes de enviar');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/talleres/${id}/submit/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          respuesta,
          start_time: attentionResults[0]?.timestamp || new Date().toISOString(),
          end_time: attentionResults[attentionResults.length - 1]?.timestamp || new Date().toISOString(),
          attention_percentage: attentionPercentage,
          attention_data: attentionResults
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al enviar el taller');
      }

      setSubmissionSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/estudiante/curso/${taller.curso}`);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al enviar el taller');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (taller?.archivo_url) {
      const link = document.createElement('a');
      link.href = taller.archivo_url;
      link.download = taller.archivo.split('/').pop() || 'taller.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavbarEstudiante />
        <main className="flex-grow p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando taller...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !taller) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <NavbarEstudiante />
        <main className="flex-grow p-6 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="bg-red-100 text-red-700 p-3 rounded-full inline-flex mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar el taller</h3>
            <p className="text-gray-600 mb-4">{error || 'El taller no existe o no tienes acceso'}</p>
            <button 
              onClick={() => router.push('/dashboard/estudiante')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Volver a mis cursos
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
        <div className="max-w-6xl mx-auto">
          {/* Encabezado del taller */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <button 
                  onClick={() => router.back()}
                  className="flex items-center text-blue-600 mb-4"
                >
                  <ArrowLeft className="mr-1" /> Volver
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{taller.titulo}</h1>
                <p className="text-gray-600 mb-4">{taller.descripcion}</p>
              </div>
              <button 
                onClick={handleDownload}
                className="flex items-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar Taller
              </button>
            </div>

            {/* Información del archivo */}
            <div className="mt-4 flex items-center bg-gray-50 p-3 rounded-lg">
              <FileText className="text-blue-500 mr-3 h-5 w-5" />
              <div>
                <p className="font-medium text-sm text-gray-800">Documento del taller:</p>
                <p className="text-xs text-gray-500">
                  {taller.archivo.split('/').pop()}
                </p>
              </div>
            </div>

            {taller.fecha_entrega && (
              <div className="mt-4 text-sm text-gray-600">
                <p className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Fecha de entrega: {new Date(taller.fecha_entrega).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}
          </div>
          
          {/* Sección de monitoreo */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Monitoreo de Atención</h2>
              <button 
                onClick={handleStartMonitoring}
                disabled={isMonitoring}
                className={`px-4 py-2 rounded text-white ${
                  isMonitoring 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-[#012E4A] hover:bg-[#034168]'
                } transition-colors`}
              >
                {isMonitoring ? 'Monitoreando...' : 'Iniciar Monitoreo'}
              </button>
            </div>
            
            <CameraComponent 
              onStartMonitoring={handleStartMonitoring}
              onStopMonitoring={handleStopMonitoring}
              active={isMonitoring}
            />
            
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                <strong>Estado:</strong> {isMonitoring ? 'Monitoreando atención' : 'Monitoreo no iniciado'}
              </p>
              {attentionResults.length > 0 && (
                <p className="text-blue-800 mt-1">
                  <strong>Atención:</strong> {attentionPercentage.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
          
          {/* Formulario del taller */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Tu Respuesta</h2>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Escribe tu respuesta al taller:
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={8}
                value={respuesta}
                onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Desarrolla aquí tu respuesta al taller..."
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                <AlertCircle className="inline mr-2" size={18} />
                {error}
              </div>
            )}
            
            {submissionSuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                <CheckCircle className="inline mr-2" size={18} />
                ¡Taller enviado correctamente! Redirigiendo...
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || submissionSuccess}
                className={`px-6 py-2 rounded text-white ${
                  isSubmitting || submissionSuccess
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                } transition-colors`}
              >
                {isSubmitting ? 'Enviando...' : submissionSuccess ? 'Enviado' : 'Enviar Taller'}
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}