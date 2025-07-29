'use client';
import Navbar2 from "@/components/layout/NavbarDocente";
import Crearcurso from "@/components/dashboard/Docente/crearcurso"; // Asegúrate de que la ruta es correcta

export default function CrearCursoPage() {
    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar2 />
            <Crearcurso />
        </div>
    );
}