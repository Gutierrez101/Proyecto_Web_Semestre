import './globals.css';
import Footerr from '../components/layout/Footer';

export const metadata = {
    title: 'Mindflow Dashboard',
    description: 'Plataforma educativa MINDFLOW', 
};

export default function RootLayout({ children }) {
    return (
        <html lang="es">
        <body className="flex flex-col min-h-screen">
            <main className="flex-grow bg-cover bg-center" style={{ backgroundImage: "url('/campus.jpg')" }}>
            {children}
            </main>
            <Footerr />
        </body>
        </html>
    );
}