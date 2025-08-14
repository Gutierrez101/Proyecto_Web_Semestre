'use client';
import { useRef, useEffect, useState } from 'react';

export default function CameraComponent({ onStartMonitoring, onStopMonitoring, videoId }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [monitoreando, setMonitoreando] = useState(false);
  const [attentionData, setAttentionData] = useState([]);
  const [intervalId, setIntervalId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);

  // 1. Función para capturar el frame
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

  // 2. Función para obtener el token de autenticación
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // 3. Función para crear sesión de atención
  const crearSesionAtencion = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No se encontró token de autenticación');
    }

    const frameBlob = await captureFrame();
    if (!frameBlob) {
      throw new Error('No se pudo capturar el frame inicial');
    }

    const formData = new FormData();
    formData.append('frame', frameBlob, 'frame.jpg');

    const response = await fetch(`http://localhost:8000/api/cursos/videos/${videoId}/verify/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al crear sesión');
    }

    const data = await response.json();
    setSessionId(data.session_id); // Set sessionId immediately after response
    return data;
  } catch (error) {
    console.error('Error en crearSesionAtencion:', error);
    setError(error.message);
    return null;
  }
};

  // 4. Función para procesar batch de atención
  const procesarBatchAtencion = async (frames) => {
  try {
    const token = getAuthToken();
    const currentSessionId = sessionId;
    
    if (!token || !currentSessionId) {
      throw new Error('Faltan credenciales de autenticación');
    }

    const response = await fetch(`http://localhost:8000/api/cursos/videos/${videoId}/process_batch/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: currentSessionId,
        frames: frames
      })
    });

    if (!response.ok) {
      throw new Error('Error en la respuesta del servidor');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en procesarBatchAtencion:', error);
    setError(error.message);
    return null;
  }
};

  // 5. Función para analizar frame
  const analizarFrame = async () => {
  if (!sessionId) {
    console.warn('Session ID not available yet');
    return null;
  }

  try {
    const frameBlob = await captureFrame();
    if (!frameBlob) return null;

    const arrayBuffer = await frameBlob.arrayBuffer();
    const frameData = Array.from(new Uint8Array(arrayBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const result = await procesarBatchAtencion([{
      frame_data: frameData,
      timestamp: new Date().toISOString(),
      width: canvasRef.current.width,
      height: canvasRef.current.height
    }]);

    if (result) {
      const newData = {
        timestamp: new Date().toISOString(),
        attention_score: result.average_attention,
        analysis: result
      };
      setAttentionData(prev => [...prev, newData]);
      return newData;
    }
  } catch (error) {
    console.error('Error en analizarFrame:', error);
    setError(error.message);
  }
  return null;
};

  // Resto del componente...
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
        setError("No se pudo acceder a la cámara. Por favor, asegúrate de haber otorgado los permisos necesarios.");
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

  const comenzarMonitoreo = async () => {
    setError(null);
    try {
      const data = await crearSesionAtencion();
      if (!data?.session_id) {
        throw new Error('No se pudo crear sesión de atención');
      }
      
      setSessionId(data.session_id);
      setMonitoreando(true);
      
      // Procesar primer frame inmediatamente
      await analizarFrame();
      
      // Configurar intervalo para procesar frames periódicamente
      const id = setInterval(analizarFrame, 5000);
      setIntervalId(id);
      
      if (onStartMonitoring) {
        onStartMonitoring();
      }
    } catch (error) {
      console.error('Error al comenzar monitoreo:', error);
      setError(error.message);
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
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}
      
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
      
      {attentionData.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">Datos de atención recientes:</h4>
          <div className="max-h-40 overflow-y-auto text-sm">
            {attentionData.slice(-3).map((item, index) => (
              <div key={index} className="mb-1 pb-1 border-b border-gray-200">
                <p>Tiempo: {new Date(item.timestamp).toLocaleTimeString()}</p>
                <p>Atención: <span className={item.attention_score > 70 ? 'text-green-600' : item.attention_score > 40 ? 'text-yellow-600' : 'text-red-600'}>
                  {item.attention_score}%
                </span></p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}