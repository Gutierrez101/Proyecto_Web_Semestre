'use client';
import LoginForm from '../../components/LoginForm';
import HeaderRegisterLogin from '../../components/layout/HeaderRegisterLogin';

export default function LoginPage() {
  return (
    <>
      <HeaderRegisterLogin />
      <main
        className="flex justify-center items-center min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/fondo.jpg')" }} // Cambia 'tu-imagen.jpg' por el nombre de tu imagen en /public
      >
        <LoginForm />
      </main>
    </>
  );
}