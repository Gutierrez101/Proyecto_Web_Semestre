'use client';
import { useRef, useEffect, useState } from 'react';

export default function CameraComponent({ onStartMonitoring, onStopMonitoring, videoId }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [monitoreando, setMonitoreando] = useState(false);
  const [attentionData, setAttentionData] = useState([]);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    const activarCamara = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user', 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCamaraActiva(true);
        }
      } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        alert("No se pudo acceder a la cámara. Por favor, asegúrate de haber otorgado los permisos necesarios.");
      }
    };

    activarCamara();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    });
  };

  const sendFrameToBackend = async () => {
    try {
      const frameBlob = await captureFrame();
      if (!frameBlob) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      const formData = new FormData();
      formData.append('frame', frameBlob, 'frame.jpg');

      // Simulamos una respuesta del backend para el ejemplo
      const mockResponse = {
        is_paying_attention: Math.random() > 0.3, // 70% de probabilidad de estar atento
        eye_aspect_ratio: 0.3 + Math.random() * 0.3,
        head_pose: {
          pitch: (Math.random() * 20) - 10,
          yaw: (Math.random() * 20) - 10,
          roll: (Math.random() * 10) - 5
        }
      };

      setAttentionData(prev => [...prev, {
        timestamp: new Date().toISOString(),
        data: mockResponse
      }]);

      return mockResponse;
    } catch (error) {
      console.error('Error al enviar frame:', error);
      return null;
    }
  };

  const comenzarMonitoreo = () => {
    setMonitoreando(true);
    // Enviar frames cada 5 segundos (ajustable)
    const id = setInterval(sendFrameToBackend, 5000);
    setIntervalId(id);
    
    if (onStartMonitoring) {
      onStartMonitoring(videoRef.current);
    }
  };

  const detenerMonitoreo = () => {
    if (intervalId) clearInterval(intervalId);
    setMonitoreando(false);
    setIntervalId(null);
    
    if (onStopMonitoring) {
      onStopMonitoring(attentionData);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex flex-col items-center">
        <video 
          ref={videoRef} 
          className="w-full max-w-md h-64 border border-gray-300 rounded mb-4"
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {camaraActiva && !monitoreando && (
          <button
            onClick={comenzarMonitoreo}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Comenzar Monitoreo
          </button>
        )}
        
        {monitoreando && (
          <div className="flex gap-2">
            <button
              onClick={detenerMonitoreo}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Detener Monitoreo
            </button>
            <div className="text-green-600 font-medium flex items-center">
              Monitoreo activo
            </div>
          </div>
        )}
      </div>
      
      {/* Mostrar datos de atención recolectados */}
      {attentionData.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">Datos de atención recientes:</h4>
          <div className="max-h-40 overflow-y-auto text-sm">
            {attentionData.slice(-3).map((item, index) => (
              <div key={index} className="mb-1 pb-1 border-b border-gray-200">
                <p>Tiempo: {new Date(item.timestamp).toLocaleTimeString()}</p>
                <p>Estado: {item.data.is_paying_attention ? (
                  <span className="text-green-600">Atento</span>
                ) : (
                  <span className="text-red-600">Distraído</span>
                )}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}