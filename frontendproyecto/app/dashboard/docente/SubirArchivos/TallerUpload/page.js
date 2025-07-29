"use client";
import Navbar2 from '@/components/layout/NavbarDocente';
import TallerUpload from '@/components/SubirDocente/ArchivosUpload';

export default function TallerPage() {
  return (
    <>
      <Navbar2 />
        <TallerUpload 
          nombreCurso="Fundamentos de Programación"
          numeroTaller="Taller N°1"
          descripcionTaller="Crear un programa básico que implemente variables, condicionales y bucles. Debe incluir comentarios explicativos y seguir las buenas prácticas de programación."
          tipo="taller"
        />
    </>
  );
}