'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
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
      const res = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
          // El username se generará automáticamente en el backend
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage(`¡Registro exitoso! Tu nombre de usuario es: ${data.username}`);
        // Redirigir después de 3 segundos
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.email || data.password || 'Error en el registro');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    }
  };

  return (
    <div className="bg-[#012E4A] bg-opacity-90 text-white p-8 rounded-xl w-80 shadow-lg">
      <h2 className="text-2xl mb-4 text-center">Registro</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-1" htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          className="w-full mb-4 p-2 rounded bg-white text-black"
          placeholder="usuario@estudiante.com o usuario@docente.com"
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
          Registrarse
        </button>
      </form>
      {message && <p className="mt-4 text-green-300">{message}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}