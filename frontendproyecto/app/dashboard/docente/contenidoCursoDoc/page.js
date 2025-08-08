
'use client';
import CursoDetalle from "@/components/dashboard/CursoDetalle";
import NavbarDocente from "@/components/layout/NavbarDocente"; 
import { useRouter, useSearchParams } from 'next/navigation';

export default function ContenidoDashDocente() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cursoId = searchParams.get('curso');

  if (!cursoId) {
    router.push('/dashboard/docente');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <NavbarDocente />
      <main className="container mx-auto px-4 py-6">
        <div 
          className="flex justify-center items-center bg-cover bg-top rounded-lg mb-6"
          style={{
            backgroundImage: "url('/ImagenCurso.jpg')",
            minHeight: "300px"
          }}
        ></div>
      </main>
      <CursoDetalle cursoId={cursoId} />
    </div>
  );
}
