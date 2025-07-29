"use client";
import { useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ArchivosUpload({ 
    nombreCurso = "Nombre del curso",
    numeroTaller = "Taller N°1", 
    descripcionTaller = "Descripción del taller a realizar",
  tipo = "taller" // "taller", "prueba", "video"
}) {
    const router = useRouter();
    const [archivo, setArchivo] = useState(null);
    const [arrastrando, setArrastrando] = useState(false);

    const manejarArchivoSeleccionado = (file) => {
        if (tipo === "video") {
        if (file.type === "video/mp4") {
            setArchivo(file);
        } else {
            alert("Solo se permite archivo MP4");
        }
        } else {
        const tiposPermitidos = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        if (tiposPermitidos.includes(file.type)) {
            setArchivo(file);
        } else {
            alert('Solo se permiten archivos PDF, Word (.doc, .docx) y Excel (.xls, .xlsx)');
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

    const manejarDragOver = (e) => {
    e.preventDefault();
    setArrastrando(true);
    };

    const manejarDragLeave = (e) => {
    e.preventDefault();
    setArrastrando(false);
    };

    const manejarInputFile = (e) => {
    const file = e.target.files[0];
    if (file) {
        manejarArchivoSeleccionado(file);
    }
    };

    const eliminarArchivo = () => {
    setArchivo(null);
    };

    const manejarEnviar = () => {
    if (!archivo) {
        alert('Por favor selecciona un archivo antes de enviar');
        return;
    }
    // Aquí iría la lógica para enviar el archivo
    console.log('Enviando archivo:', archivo.name);
    alert('Archivo enviado correctamente');
    };

    const manejarVolver = () => {
        router.push('/dashboard/docente/contenidoCursoDoc');
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
        <p className="text-gray-700 mb-6">{descripcionTaller}</p>

        {/* Zona de subida de archivos */}
        <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            arrastrando 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 bg-gray-50'
            }`}
            onDrop={manejarDrop}
            onDragOver={manejarDragOver}
            onDragLeave={manejarDragLeave}
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
                    accept={tipo === "video" ? ".mp4" : ".pdf,.doc,.docx,.xls,.xlsx"}
                    onChange={manejarInputFile}
                />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                    {tipo === "video"
                    ? "Formato permitido: MP4"
                    : "Formatos permitidos: PDF, Word, Excel"}
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
            >
            Volver
            </button>
            <button
            onClick={manejarEnviar}
            className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
            >
            Enviar {getTipoTexto()}
            </button>
            <button
                onClick={() => router.push(`/dashboard/docente/SubirArchivos/TallerUpload?id=${cursoId}`)}
                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors"
            >
                Ver
            </button>
        </div>
        </div>
    </div>
    );
}