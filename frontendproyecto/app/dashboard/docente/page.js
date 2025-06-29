import ClassRow from "@/components/dashboard/ClassRow";

const mockTeacherClasses = [
  { id: 1, title: "Documentación", description: "Info de la clase" },
  { id: 2, title: "Tareas", description: "Lista de actividades" },
  { id: 3, title: "Evaluaciones", description: "Exámenes y resultados" },
  { id: 4, title: "Estadísticas", description: "Rendimiento de estudiantes" }
];

export default function TeacherPage() {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Panel de Clase</h2>
      <table className="w-full text-sm">
        <tbody>
          {mockTeacherClasses.map((c) => (
            <ClassRow key={c.id} studyClass={c} />
          ))}
        </tbody>
      </table>
    </section>
  );
}