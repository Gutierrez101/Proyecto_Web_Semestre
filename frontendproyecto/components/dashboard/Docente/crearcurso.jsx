'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Crearcurso() {
    const [courseData, setCourseData] = useState({
        name: '',
        description: '',
        code: 'COMP-123'
    });
    const router = useRouter();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCourseData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Datos del curso:', courseData);
        alert(`Curso ${courseData.name} creado con éxito!`);
    };

    return (
        <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#81BECE" }}>
            <div className="max-w-4xl w-full p-8 min-h-[400px] bg-[#012E4A] rounded-lg shadow-md flex flex-col justify-center">
                <h1 className="text-2xl font-bold text-center text-white mb-6">Crear un Curso</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="name" className="block font-medium text-white">Nombre del curso:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={courseData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-md bg-[#81BECE] text-black placeholder:text-gray-700"
                            required
                            placeholder="Ejemplo: Matemáticas"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="description" className="block font-medium text-white">Descripción del curso:</label>
                        <textarea
                            id="description"
                            name="description"
                            value={courseData.description}
                            onChange={handleChange}
                            className="w-full px-3 py-4 rounded-md bg-[#81BECE] text-black min-h-[100px] placeholder:text-gray-700"
                            rows={4}
                            placeholder="Describe el curso..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="code" className="block font-medium text-white">Código del curso:</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            value={courseData.code}
                            onChange={handleChange}
                            className="w-full px-3 py-2 rounded-md bg-[#81BECE] text-black placeholder:text-gray-700"
                            required
                            placeholder="Ejemplo: COMP-123"
                        />
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.push('/dashboard/docente/contenidoCursoDoc')}
                            className="w-1/2 bg-gray-400 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            Volver
                        </button>
                        <button
                            type="submit"
                            className="w-1/2 bg-[#81BECE] hover:bg-[#6DA7B8] text-white font-medium py-2 px-4 rounded-md transition-colors"
                        >
                            Generar Curso
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}