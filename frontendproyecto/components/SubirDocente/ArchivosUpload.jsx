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
            if (file.name.toLowerCase().endsWith('.xml')) {
                setArchivo(file);
            } else {
                setError("Solo se permite archivo XML");
            }
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
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            const formData = new FormData();
            formData.append('titulo', titulo);
            formData.append('descripcion', descripcion);
            
            // Agregar el archivo con el nombre correcto según el tipo
            if (tipo === "video") {
                formData.append('archivo', archivo);
            } else if (tipo === "prueba") {
                formData.append('archivo_xml', archivo);
            } else {
                formData.append('archivo', archivo);
            }

            let endpoint = '';
            if (tipo === "video") {
                endpoint = `http://localhost:8000/api/cursos/${cursoId}/videos/`;
            } else if (tipo === "prueba") {
                endpoint = `http://localhost:8000/api/cursos/${cursoId}/pruebas/`;
            } else {
                endpoint = `http://localhost:8000/api/cursos/${cursoId}/talleres/`;
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error al subir el archivo');
            }

            alert('Archivo subido correctamente');
            router.push(`/dashboard/docente/contenidoCursoDoc?curso=${cursoId}`);
        } catch (err) {
            console.error('Error al subir archivo:', err);
            setError(err.message || 'Error al subir el archivo');
        } finally {
            setIsSubmitting(false);
        }
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
            {/* Header */}
            <div className="bg-white shadow-sm p-6 text-center">
                <h1 className="text-2xl font-bold text-gray-800">{nombreCurso}</h1>
            </div>

            {/* Sección azul superior */}
            <div className="bg-[#81BECE] p-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-lg font-semibold text-white">{numeroTaller}</h2>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="max-w-4xl mx-auto bg-white p-6">
                <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Título:</label>
                    <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Descripción:</label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        rows="3"
                    />
                </div>

                {error && (
                    <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {/* Zona de subida de archivos */}
                <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        arrastrando 
                            ? 'border-blue-400 bg-blue-50' 
                            : 'border-gray-300 bg-gray-50'
                    }`}
                    onDrop={manejarDrop}
                    onDragOver={(e) => e.preventDefault()}
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
                                        tipo === "prueba" ? ".xml" : 
                                        ".pdf,.doc,.docx"
                                    }
                                    onChange={manejarInputFile}
                                />
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                                {tipo === "video" ? "Formato permitido: MP4" : 
                                 tipo === "prueba" ? "Formato permitido: XML" : 
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

            {/* Sección azul inferior con botones */}
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
