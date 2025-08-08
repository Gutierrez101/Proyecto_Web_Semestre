// components/AuthGuard.jsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthGuard({ children, requiredRole }) {
  const router = useRouter();
  
  useEffect(() => {
    // Verifica el token y el rol del usuario
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (requiredRole === 'student' && !username?.startsWith('E')) {
      router.push('/docente');
    }
    
    if (requiredRole === 'teacher' && !username?.startsWith('P')) {
      router.push('/estudiante/dashboardEstudiante');
    }
  }, []);

  return children;
}