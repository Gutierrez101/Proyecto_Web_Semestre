'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function HeaderRegisterLogin() {
    return (
        <header className="bg-[#012E4A] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
            {/* Logo a la izquierda */}
            <div className="flex-shrink-0 flex items-center">
                <Image
                src="/logo.png" // Asegúrate de que la ruta sea correcta
                alt="Mindflow Logo"
                width={50}
                height={50}
                className="h-14 w-auto" // Ajusta según necesites
                />

            </div>

            {/* Botones a la derecha */}
            <div className="flex space-x-4">
                <Link href="/login" legacyBehavior>
                <a className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#81BECE] hover:bg-[#577f92] transition-colors">
                    Login
                </a>
                </Link>
                <Link href="/register" legacyBehavior>
                <a className="px-4 py-2 border border-[#81BECE] text-sm font-medium rounded-md text-[#81BECE] hover:bg-[#012E4A] hover:text-white transition-colors">
                    Register
                </a>
                </Link>
            </div>
            </div>
        </div>
        </header>
    );
};