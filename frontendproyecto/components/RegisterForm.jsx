'use client';
import Link from 'next/link';

export default function RegisterForm() {
  return (
    <div className="bg-blue-900 bg-opacity-90 text-white p-8 rounded-xl w-80 shadow-lg">
      <h2 className="text-2xl mb-4">Regístrate</h2>
      <form>
        <label className="block mb-2">Email</label>
        <input type="email" className="w-full p-2 rounded mb-4 text-black" placeholder="usuario@correo.com" />
        <label className="block mb-2">Contraseña</label>
        <input type="password" className="w-full p-2 rounded mb-4 text-black" placeholder="••••••" />
        <fieldset className="mb-4">
          <legend className="mb-2">Rol</legend>
          <label className="inline-flex items-center mr-4">
            <input type="radio" name="role" value="estudiante" className="mr-2" /> Estudiante
          </label>
          <label className="inline-flex items-center">
            <input type="radio" name="role" value="docente" className="mr-2" /> Docente
          </label>
        </fieldset>
        <button className="w-full py-2 bg-green-600 rounded hover:bg-green-700">Crear Cuenta</button>
      </form>
      <p className="mt-4 text-center">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="underline">
          Iniciar Sesión
        </Link>
      </p>
    </div>
  );
}