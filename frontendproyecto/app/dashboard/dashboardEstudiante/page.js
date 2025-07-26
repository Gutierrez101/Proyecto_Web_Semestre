// app/dashboard/dashboardEstudiante/page.js
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavbarEstudiante from '@/components/layout/NavbarEstudiante';
import Footer from '@/components/layout/Footer';
import ClassGrid from '@/components/dashboard/ClassGrid';

export default function DashboardEstudiante() {
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación y tipo de usuario
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (username && !username.startsWith('E')) {
      router.push('/docente');
    }
  }, []);

  const temas = [
    { tema: "TEMA 1", recursos: ["Video Clase Nº1", "Taller Nº1", "Prueba Nº1"] },
    { tema: "TEMA 2", recursos: [] },
    { tema: "TEMA 3", recursos: [] },
    { tema: "Notas", recursos: [] }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-sky-200">
      <NavbarEstudiante />
      
      <main className="flex-grow p-6">
        <div className="bg-white text-center font-bold py-2 rounded mb-6 text-black">
          Fundamentos de Programación
        </div>
        
        <ClassGrid classes={temas} />
      </main>
      
      <Footer />
    </div>
  );
}