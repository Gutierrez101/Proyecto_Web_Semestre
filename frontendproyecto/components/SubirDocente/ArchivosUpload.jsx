"use client";
import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ArchivosUpload({ 
    nombreCurso = "Nombre del curso",
    numeroTaller = "Taller N°1", 
    descripcionTaller = "Descripción del taller a realizar",
    tipo = "taller" // "taller", "prueba", "video"
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const cursoId = searchParams.get('curso');
    const [archivo, setArchivo] = useState(null);
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [fechaEntrega, setFechaEntrega] = useState('');
    const [arrastrando, setArrastrando] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const manejarArchivoSeleccionado = (file) => {
        setError('');
        if (tipo === "video") {
            if (file.type === "video/mp4") {
                setArchivo(file);
            } else {
                setError("Solo se permite archivo MP4");
            }
        } else if (tipo === "prueba") {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                const jsonContent = JSON.parse(e.target.result);
                console.log("JSON parseado:", jsonContent); 
                // Validar que todas las preguntas tengan "texto"
                if (!jsonContent.questions || !jsonContent.questions[0].texto) {
                    setError("El JSON debe tener 'questions' y cada pregunta debe incluir 'texto'");
                    return;
                  }

                setArchivo(file);
            } catch (err) {
                setError("El JSON no es válido"+ err.message);
            }
            };
            reader.readAsText(file);
        } else {
            const tiposPermitidos = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];
            if (tiposPermitidos.includes(file.type) || file.name.toLowerCase().endsWith('.pdf')) {
                setArchivo(file);
            } else {
                setError('Solo se permiten archivos PDF o Word (.doc, .docx)');
            }
        }
    };

    const manejarDrop = (e) => {
        e.preventDefault();
        setArrastrando(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            manejarArchivoSeleccionado(files[0]);
        }
    };

    const manejarInputFile = (e) => {
        const file = e.target.files[0];
        if (file) {
            manejarArchivoSeleccionado(file);
        }
    };

    const eliminarArchivo = () => {
        setArchivo(null);
        setError('');
    };

   const manejarEnviar = async () => {
    // Validaciones iniciales
    if (!titulo) {
        setError('El título es requerido');
        return;
    }
    
    if (!archivo) {
        setError('Por favor selecciona un archivo antes de enviar');
        return;
    }

    setIsSubmitting(true);
    setError('');

    try {
        // Verificar autenticación
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Configurar FormData básico
        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('descripcion', descripcion || '');
        formData.append('curso', cursoId); // Campo crítico que soluciona el NOT NULL constraint
        
        if (fechaEntrega) {
            formData.append('fecha_entrega', fechaEntrega);
        }

        // Determinar endpoint y campos específicos
        let endpoint = '';
        
        if (tipo === "video") {
            endpoint = `http://localhost:8000/api/cursos/${cursoId}/videos/`;
            formData.append('archivo', archivo);
        } 
        else if (tipo === "prueba") {
            endpoint = `http://localhost:8000/api/cursos/${cursoId}/pruebas/`;
            
            // 1. Leer y validar el archivo JSON
            const jsonContent = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const content = JSON.parse(e.target.result);
                        
                        // Validación estricta del formato
                        if (!content.questions || !Array.isArray(content.questions)) {
                            throw new Error("El JSON debe contener un array 'questions'");
                        }

                        // Transformación al formato que espera Django
                        const transformed = {
                            questions: content.questions.map((q, index) => {
                                // Validar campos requeridos
                                const questionText = q.question_text || q.pregunta || q.texto;
                                if (!questionText) {
                                    throw new Error(`Pregunta ${index + 1} no tiene texto`);
                                }

                                const options = q.options || q.opciones || [];
                                if (!Array.isArray(options) || options.length < 2) {
                                    throw new Error(`Pregunta ${index + 1} debe tener al menos 2 opciones`);
                                }

                                const correctAnswer = q.correct_answer || q.respuesta_correcta || q.correctAnswer;
                                if (!correctAnswer) {
                                    throw new Error(`Pregunta ${index + 1} no tiene respuesta correcta`);
                                }

                                return {
                                    question_text: questionText,
                                    options: options,
                                    correct_answer: correctAnswer
                                };
                            })
                        };

                        if (transformed.questions.length === 0) {
                            throw new Error("El JSON no contiene preguntas válidas");
                        }

                        resolve(transformed);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = () => reject(new Error("Error al leer el archivo"));
                reader.readAsText(archivo);
            });

            // 2. Agregar ambos componentes al FormData
            formData.append('archivo_json', archivo);
            formData.append('json_content', JSON.stringify(jsonContent));
            formData.append('plantilla_calificacion', 'Plantilla estándar');
        } 
        else {
            // Para talleres
            endpoint = `http://localhost:8000/api/cursos/${cursoId}/talleres/`;
            formData.append('archivo', archivo);
            formData.append('formato_permitido', 'PDF, Word, Excel');
        }

        // Depuración: Mostrar contenido del FormData
        console.log("Datos a enviar:");
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        // Enviar al backend
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${token}`
            },
            body: formData
        });

        // Manejo de errores detallado
        if (!response.ok) {
            let errorData = {};
            try {
                errorData = await response.json();
                console.error("Error detallado del backend:", errorData);
            } catch (e) {
                console.error("El backend no devolvió JSON en el error");
            }
            
            throw new Error(
                errorData.detail || 
                errorData.error || 
                `Error al subir el ${tipo} (${response.status})`
            );
        }

        // Éxito
        const responseData = await response.json();
        console.log("Respuesta exitosa:", responseData);
        alert(`${getTipoTexto()} subido correctamente`);
        router.push(`/dashboard/docente/contenidoCursoDoc?curso=${cursoId}`);
        
    } catch (err) {
        console.error(`Error completo al subir ${tipo}:`, err);
        setError(
            err.message || 
            `Error al subir el ${tipo}. Por favor verifica el formato e intenta nuevamente.`
        );
    } finally {
        setIsSubmitting(false);
    }
};

// Función auxiliar para parsear el JSON (opcional)
const parsearArchivoJSON = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = JSON.parse(e.target.result);
                if (!content.questions) throw new Error("El JSON debe contener 'questions'");
                resolve(content);
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsText(file);
    });
};

    const manejarVolver = () => {
        router.push(`/dashboard/docente/contenidoCursoDoc?curso=${cursoId}`);
    };

    const getTipoTexto = () => {
        switch(tipo) {
            case 'prueba': return 'Prueba';
            case 'video': return 'Video';
            default: return 'Taller';
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <div className="bg-white shadow-sm p-6 text-center">
                <h1 className="text-2xl font-bold text-gray-800">{nombreCurso}</h1>
            </div>

            <div className="bg-[#81BECE] p-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-lg font-semibold text-white">{numeroTaller}</h2>
                </div>
            </div>

            <div className="max-w-4xl mx-auto bg-white p-6">
                <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Título:</label>
                    <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-black"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Descripción:</label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded text-black"
                        rows="3"
                    />
                </div>

                {tipo !== "video" && (
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">Fecha de entrega:</label>
                        <input
                            type="datetime-local"
                            value={fechaEntrega}
                            onChange={(e) => setFechaEntrega(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-black"
                        />
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        arrastrando 
                            ? 'border-blue-400 bg-blue-50' 
                            : 'border-gray-300 bg-gray-50'
                    }`}
                    onDrop={manejarDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={() => setArrastrando(true)}
                    onDragLeave={() => setArrastrando(false)}
                >
                    {!archivo ? (
                        <div>
                            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-600 mb-2">
                                Arrastra y suelta tu archivo aquí, o
                            </p>
                            <label className="inline-block bg-[#81BECE] text-white px-4 py-2 rounded cursor-pointer hover:bg-[#406068]">
                                Seleccionar archivo
                                <input
                                    type="file"
                                    className="hidden"
                                    accept={
                                        tipo === "video" ? ".mp4" : 
                                        tipo === "prueba" ? ".json" : 
                                        ".pdf,.doc,.docx"
                                    }
                                    onChange={manejarInputFile}
                                />
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                                {tipo === "video" ? "Formato permitido: MP4" : 
                                 tipo === "prueba" ? "Formato permitido: JSON" : 
                                 "Formatos permitidos: PDF, Word"}
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center space-x-4">
                            <FileText className="h-8 w-8 text-blue-500" />
                            <div className="flex-1 text-left">
                                <p className="font-medium text-gray-800">{archivo.name}</p>
                                <p className="text-sm text-gray-500">
                                    {(archivo.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <button
                                onClick={eliminarArchivo}
                                className="p-1 hover:bg-gray-200 rounded"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-[#81BECE] p-10 mt-auto">
                <div className="max-w-4xl mx-auto flex justify-center space-x-4">
                    <button
                        onClick={manejarVolver}
                        className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
                        disabled={isSubmitting}
                    >
                        Volver
                    </button>
                    <button
                        onClick={manejarEnviar}
                        className="bg-[#012E4A] text-white px-6 py-2 rounded hover:bg-[#034168] transition-colors"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Enviando...' : `Enviar ${getTipoTexto()}`}
                    </button>
                </div>
            </div>
        </div>
    );
}