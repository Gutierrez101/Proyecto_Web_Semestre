'use client';
import Link from 'next/link';

export default function LoginForm() {
  return (
    <div className="bg-blue-900 bg-opacity-90 text-white p-8 rounded-xl w-80 shadow-lg">
      <h2 className="text-2xl mb-4">Inicio de sesión</h2>
      <form>
        <label className="block mb-2">Email</label>
        <input type="email" className="w-full p-2 rounded mb-4 text-black" placeholder="usuario@correo.com" />
        <label className="block mb-2">Contraseña</label>
        <input type="password" className="w-full p-2 rounded mb-4 text-black" placeholder="••••••" />
        <button className="w-full py-2 bg-blue-600 rounded hover:bg-blue-700">Iniciar Sesión</button>
      </form>
      <p className="mt-4 text-center">
        ¿No tienes cuenta?{' '}
        <Link href="/register" className="underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}