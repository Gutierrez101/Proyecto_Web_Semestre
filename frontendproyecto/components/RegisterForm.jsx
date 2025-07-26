'use client';
import { useState } from 'react';

export default function RegisterForm() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const validateUsername = (username) => {
    const pattern = /^(E|P)\d{2}\d*$/;
    return pattern.test(username);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    
    // Validación del username
    if (!validateUsername(formData.username)) {
      setError('El nombre de usuario debe comenzar con E (Estudiante) o P (Profesor) seguido de números (Ej: E001 o P001)');
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
      } else {
        const err = Object.values(data)[0];
        setError(Array.isArray(err) ? err[0] : err);
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  return (
    <div className="bg-[#012E4A] bg-opacity-90 text-[#ffffff] p-8 rounded-xl w-80 shadow-lg">
      <h2 className="text-2xl mb-4 text-center">Regístrate</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-1" htmlFor="username">Usuario</label>
        <input
          type="text"
          id="username"
          name="username"
          className="w-full mb-4 p-2 rounded bg-white text-black"
          placeholder="Usuario"
          onChange={handleChange}
          required
        />
        <label className="block mb-1" htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          className="w-full mb-4 p-2 rounded bg-white text-black"
          placeholder="usuario@correo.com"
          onChange={handleChange}
          required
        />
        <label className="block mb-1" htmlFor="password">Contraseña</label>
        <input
          type="password"
          id="password"
          name="password"
          className="w-full mb-4 p-2 rounded bg-white text-black"
          placeholder="Contraseña"
          onChange={handleChange}
          required
        />
        <button type="submit" className="w-full py-2 bg-[#81BECE] rounded hover:bg-[#577f92]">
          Crear Cuenta
        </button>
      </form>
      {message && <p className="mt-4 text-green-300">{message}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}