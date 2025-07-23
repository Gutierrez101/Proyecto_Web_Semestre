import Header from '/components/layout/Header';
import Footer from '../components/layout/Footer';
import TemaAccordion from '../components/dashboard/TemaAccordion';
import ClassGrid from "@/components/dashboard/ClassGrid";
import DoneButton from '@/components/dashboard/DoneButton'; 

export default function DashboardEstudiante() {
  const temas = [
    { tema: "TEMA 1", recursos: ["Video Clase Nº1", "Taller Nº1", "Prueba Nº1"] },
    { tema: "TEMA 2", recursos: [] },
    { tema: "TEMA 3", recursos: [] },
    { tema: "Notas", recursos: [] }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-sky-200">
      <Header />
      <main className="flex-grow p-6">
        <div className="bg-white text-center font-bold py-2 rounded mb-6">
          Fundamentos de Programación
        </div>
        <div className="max-w-3xl mx-auto">
          {temas.map((t, idx) => (
            <TemaAccordion key={idx} tema={t.tema} recursos={t.recursos} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
