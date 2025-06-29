import Link from "next/link";

export const Navbar = () => (
  <header className="bg-gray-800 text-white p-4 flex justify-between">
    <h1 className="font-bold">MiStudyClass</h1>
    <nav className="flex gap-4">
      <Link href="/dashboard/estudiante">Estudiante</Link>
      <Link href="/dashboard/docente">Docente</Link>
    </nav>
  </header>
);