// Ejemplo para VideoPage.js
"use client";
import Navbar2 from '@/components/layout/NavbarDocente';
import ArchivosUpload from '@/components/SubirDocente/ArchivosUpload';
import { useSearchParams } from 'next/navigation';

export default function VideoPage() {
    const searchParams = useSearchParams();
    const cursoId = searchParams.get('curso');
    
    return (
        <>
            <Navbar2 />
            <ArchivosUpload 
                nombreCurso="Fundamentos de Programación"
                numeroTaller="Video N°1"
                descripcionTaller="Grabar un video explicativo de máximo 5 minutos mostrando la resolución de un ejercicio práctico de programación. El video debe incluir explicación del código paso a paso."
                tipo="video"
            />
        </>
    );
}