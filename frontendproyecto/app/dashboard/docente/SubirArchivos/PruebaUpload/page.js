"use client";
import { useSearchParams } from 'next/navigation';
import ArchivosUpload from '@/components/SubirDocente/ArchivosUpload';

export default function PruebaPage() {
    const searchParams = useSearchParams();
    const cursoId = searchParams.get('curso');
    
    return (
        <ArchivosUpload 
            nombreCurso="Prueba del Curso"
            numeroTaller="Prueba N°1"
            descripcionTaller="Sube el archivo XML con la estructura de la prueba. El sistema usará este formato para evaluar automáticamente a los estudiantes."
            tipo="prueba"
        />
    );
}