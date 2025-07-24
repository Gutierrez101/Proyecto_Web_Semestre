<<<<<<< HEAD
export default function Footer() {
  return (
    <footer className="bg-[#002D62] text-white p-6 flex flex-col sm:flex-row justify-between items-center mt-10">
      <div className="flex items-center space-x-2 mb-4 sm:mb-0">
        <img src="/logo.png" alt="MindFlow" className="h-12" />
        <span className="font-bold">MINDFLOW</span>
      </div>
      <div className="text-sm text-center sm:text-left">
        <p><strong>Explorar</strong>: Mis cursos</p>
        <p><strong>Recursos</strong>: Soporte</p>
      </div>
    </footer>
  );
}
=======
'use client';

export default function Footer() {
  return (
  <footer className="bg-[#012E4A] text-white py-6 px-4">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center">
        {/* Sección izquierda - Logo y nombre */}
        <div className="mb-4 md:mb-0">
          <h2 className="text-2xl font-bold">MINDFLOW</h2>
        </div>

        {/* Sección central - Enlaces */}
        <nav className="flex flex-wrap justify-center gap-6 mb-4 md:mb-0">
          <a href="#" className="hover:text-[#81BECE] transition-colors">Editorial</a>
          <a href="#" className="hover:text-[#81BECE] transition-colors">Mis cursos</a>
          <a href="#" className="hover:text-[#81BECE] transition-colors">Recursos</a>
          <a href="#" className="hover:text-[#81BECE] transition-colors">Soporte</a>
        </nav>

        {/* Línea divisoria en móvil */}
        <div className="w-full h-px bg-gray-400 my-2 md:hidden"></div>

        {/* Sección derecha - Copyright */}
        <div className="text-sm text-gray-300">
          © 2025 MINDFLOW. Todos los derechos reservados.
        </div>
      </div>
    </div>
  </footer>
);
}
>>>>>>> origin/frontend2
