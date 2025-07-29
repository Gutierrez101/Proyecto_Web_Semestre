'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Crearcurso() {
    const [courseData, setCourseData] = useState({
        nombre: '',
        descripcion: '',
        codigo: 'COMP-'+ Math.floor(100 + Math.random() * 900)
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCourseData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validación de campos
        if (!courseData.nombre.trim() || !courseData.descripcion.trim()) {
            setError('Todos los campos son obligatorios');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No se encontró token de autenticación');
            }

            const response = await fetch('http://localhost:8000/api/cursos/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    nombre: courseData.nombre.trim(),
                    descripcion: courseData.descripcion.trim(),
                    codigo: courseData.codigo.toUpperCase()
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Error al crear el curso');
            }

            // Redirige al dashboard forzando recarga completa
            window.location.href = '/dashboard/docente';
            
        } catch (err) {
            setError(`Error: ${err.message}`);
            console.error("Error al crear curso:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#81BECE" }}>
            <div className="max-w-4xl w-full p-8 min-h-[400px] bg-[#012E4A] rounded-lg shadow-md flex flex-col justify-center">
                <h1 className="text-2xl font-bold text-center text-white mb-6">Crear un Curso</h1>
                {error && (
                    <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="nombre" className="block font-medium text-white">
                            Nombre del curso:
                        </label>
                        <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={courseData.nombre}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-md bg-[#81BECE] text-black placeholder:text-gray-700"
                            required
                            placeholder="Ejemplo: Matemáticas"
                            maxLength={100}
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="descripcion" className="block font-medium text-white">
                            Descripción del curso:
                        </label>
                        <textarea
                            id="descripcion"
                            name="descripcion"
                            value={courseData.descripcion}
                            onChange={handleChange}
                            className="w-full px-3 py-4 rounded-md bg-[#81BECE] text-black min-h-[100px] placeholder:text-gray-700"
                            rows={4}
                            required
                            placeholder="Describe el curso..."
                            maxLength={500}
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="codigo" className="block font-medium text-white">
                            Código del curso:
                        </label>
                        <input
                            type="text"
                            id="codigo"
                            name="codigo"
                            value={courseData.codigo}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-md bg-[#81BECE] text-black placeholder:text-gray-700"
                            required
                            readOnly
                        />
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard/docente')}
                            className="w-1/2 bg-gray-400 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                            disabled={loading}
                        >
                            Volver
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-1/2 bg-[#81BECE] hover:bg-[#6DA7B8] text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creando...
                                </span>
                            ) : 'Crear Curso'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}