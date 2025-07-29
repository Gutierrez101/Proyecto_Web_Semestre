// pages/video/page.js (o app/video/page.js si usas App Router)
"use client";
import Navbar2 from '@/components/layout/NavbarDocente';
import TallerUpload from '@/components/SubirDocente/ArchivosUpload';

export default function VideoPage() {
    return (
    <>
        <Navbar2 />
        <div>
    <TallerUpload 
        nombreCurso="Fundamentos de Programación"
        numeroTaller="Video N°1"
        descripcionTaller="Grabar un video explicativo de máximo 5 minutos mostrando la resolución de un ejercicio práctico de programación. El video debe incluir explicación del código paso a paso."
        tipo="video"
        />
        </div>
    </>
    );
}