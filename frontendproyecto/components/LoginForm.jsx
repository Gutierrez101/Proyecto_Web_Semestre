'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    
    try {
      const res = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        localStorage.setItem('user_type', data.user_type);
        
        // Redirigir según el tipo de usuario
        if (data.user_type === 'student') {
          router.push('/dashboard/dashboardEstudiante');
        } else {
          router.push('/dashboard/docente');
        }
      } else {
        setError(data.non_field_errors?.[0] || 'Credenciales incorrectas');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div className="bg-[#012E4A] bg-opacity-90 text-white p-8 rounded-xl w-80 shadow-lg">
      <h2 className="text-2xl mb-4 text-center">Inicio de sesión</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-1" htmlFor="username">Usuario (E00# o P00#)</label>
        <input
          type="text"
          name="username"
          className="w-full mb-4 p-2 rounded bg-white text-black"
          placeholder="E123 o P456"
          onChange={handleChange}
          required
        />
        <label className="block mb-1" htmlFor="password">Contraseña</label>
        <input
          type="password"
          name="password"
          className="w-full mb-4 p-2 rounded bg-white text-black"
          placeholder="Contraseña"
          onChange={handleChange}
          required
        />
        <button type="submit" className="w-full py-2 bg-[#81BECE] rounded hover:bg-[#577f92]">
          Iniciar Sesión
        </button>
      </form>
      {message && <p className="mt-4 text-green-300">{message}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}