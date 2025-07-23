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
