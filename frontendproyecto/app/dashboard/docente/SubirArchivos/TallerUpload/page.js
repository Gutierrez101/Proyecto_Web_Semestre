"use client";
import { useSearchParams } from 'next/navigation';
import ArchivosUpload from '@/components/SubirDocente/ArchivosUpload';

export default function TallerPage() {
    const searchParams = useSearchParams();
    const cursoId = searchParams.get('curso');
    
    return (
        <ArchivosUpload 
            nombreCurso="Taller del Curso"
            numeroTaller="Taller N°1"
            descripcionTaller="Sube el archivo PDF o Word con las instrucciones del taller. Los estudiantes podrán descargarlo y trabajar en él."
            tipo="taller"
        />
    );
}