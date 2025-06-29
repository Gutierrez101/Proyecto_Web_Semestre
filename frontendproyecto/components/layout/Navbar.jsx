import Link from "next/link";
import { Avatar } from "../ui/Avatar";

export const Navbar = () => (
  <header className="flex items-center justify-between px-6 py-3 bg-gray-900 text-white">
    <h1 className="text-lg font-semibold">Dashboard</h1>
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/dashboard/estudiante">Estudiante</Link>
      <Link href="/dashboard/docente">Docente</Link>
      <Avatar src="/api/user/avatar" size="sm" />
    </nav>
  </header>
);