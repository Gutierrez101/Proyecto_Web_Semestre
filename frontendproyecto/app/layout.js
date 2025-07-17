import './globals.css';

export const metadata = { title: 'Mindflow Dashboard' };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="flex flex-col min-h-screen">
        <header className="bg-blue-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src="/mindflow-logo.svg" alt="Logo" className="h-8" />
            <span className="ml-2 text-xl font-semibold">Dashboard Estudiante</span>
          </div>
        </header>

        <main className="flex-grow bg-cover bg-center" style={{ backgroundImage: "url('/campus.jpg')" }}>
          {children}
        </main>

        <footer className="bg-blue-800 text-white p-6">
          <div className="container mx-auto flex justify-around">
            <div>
              <h2 className="font-bold mb-2">Explorar</h2>
              <ul><li>Mis cursos</li></ul>
            </div>
            <div>
              <h2 className="font-bold mb-2">Recursos</h2>
              <ul><li>Soporte</li></ul>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}