'use client';
import { useState } from 'react';

export default function LoginForm() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

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
        setMessage(data.message + ' Token: ' + data.token);
      } else {
        setError(data.non_field_errors?.[0] || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  return (
    <div className="bg-blue-900 bg-opacity-90 text-white p-8 rounded-xl w-80 shadow-lg">
      <h2 className="text-2xl mb-4">Inicio de sesión</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="username"
          className="w-full mb-4 p-2 rounded text-black"
          placeholder="Usuario"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          className="w-full mb-4 p-2 rounded text-black"
          placeholder="Contraseña"
          onChange={handleChange}
          required
        />
        <button type="submit" className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700">
          Iniciar Sesión
        </button>
      </form>
      {message && <p className="mt-4 text-green-300">{message}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
}
