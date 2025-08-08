'use client';
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';

export default function NavbarEstudiante() {
  const router = useRouter();
  const [nombre, setNombre] = useState('Estudiante');

  useEffect(() => {
    const username = localStorage.getItem('username');
    if (username) {
      setNombre(username);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/login');
  }
  
  return (
    <header className="bg-[#012E4A] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo a la izquierda */}
          <div className="flex-shrink-0 flex items-center">
            <Image
              src="/logo.png"
              alt="Mindflow Logo"
              width={50}
              height={50}
              className="h-14 w-auto"
            />
          </div>

          {/* Botones a la derecha */}
          <div className="flex items-center gap-6">
            <span className="font-semibold text-white">{nombre}</span>
            <Link 
              href="/dashboard/estudiante" 
              className="text-white hover:underline"
            >
              Mis Cursos
            </Link>
            <button
              className="px-4 py-2 rounded border border-[#81BECE] text-[#81BECE] hover:bg-[#012E4A] hover:text-white transition-colors text-sm font-medium"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}