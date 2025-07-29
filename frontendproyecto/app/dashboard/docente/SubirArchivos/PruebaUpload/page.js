// pages/prueba/page.js (o app/prueba/page.js si usas App Router)
"use client";
import Navbar2 from '@/components/layout/NavbarDocente';
import TallerUpload from '@/components/SubirDocente/ArchivosUpload';

export default function PruebaPage() {
    return (
    <>
        <Navbar2 />
        <div>
    <TallerUpload 
        nombreCurso="Fundamentos de Programación"
        numeroTaller="Prueba N°1"
        descripcionTaller="Evaluación teórica sobre conceptos básicos de programación. Responder todas las preguntas en un documento Word o PDF. La prueba tiene una duración de 90 minutos."
        tipo="prueba"
        />
        </div>
    </>
    );
}