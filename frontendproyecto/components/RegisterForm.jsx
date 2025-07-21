'use client';
import { useState } from 'react';

export default function RegisterForm() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Error en registro');
      setSuccess('Registro exitoso. Ahora puedes iniciar sesión.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="bg-blue-900 bg-opacity-90 text-white p-8 rounded-xl w-80 shadow-lg">
      <h2 className="text-2xl mb-4">Regístrate</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">Usuario</label>
        <input
          type="text"
          name="username"
          className="w-full p-2 rounded mb-4 text-black"
          placeholder="Usuario"
          onChange={handleChange}
          required
        />
        <label className="block mb-2">Correo</label>
        <input
          type="email"
          name="email"
          className="w-full p-2 rounded mb-4 text-black"
          placeholder="usuario@correo.com"
          onChange={handleChange}
          required
        />
        <label className="block mb-2">Contraseña</label>
        <input
          type="password"
          name="password"
          className="w-full p-2 rounded mb-4 text-black"
          placeholder="Contraseña"
          onChange={handleChange}
          required
        />
        <button type="submit" className="w-full py-2 bg-green-600 rounded hover:bg-green-700">
          Crear Cuenta
        </button>
      </form>
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {success && <p className="mt-4 text-green-500">{success}</p>}
    </div>
  );
}
