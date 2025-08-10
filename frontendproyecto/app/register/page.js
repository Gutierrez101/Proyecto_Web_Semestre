'use client';
import RegisterForm from '../../components/RegisterForm';
import HeaderRegisterLogin from '../../components/layout/HeaderRegisterLogin';

export default function RegisterPage() {
  return (
    <>
      <HeaderRegisterLogin />
      <main
        className="flex justify-center items-center min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/fondo.jpg')" }} // Cambia 'tu-imagen.jpg' por el nombre de tu imagen en /public
      >
        <RegisterForm />
      </main>
    </>
  );
}