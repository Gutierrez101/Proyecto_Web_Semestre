import ClassGrid from "@/components/dashboard/ClassGrid";

const mockClasses = [
  { id: 1, title: "Curso de HTML", description: "Aprende la base del desarrollo web" },
  { id: 2, title: "Curso de JavaScript", description: "Domina la lógica del frontend" },
  { id: 3, title: "Curso CSS", description: "Diseña con estilo tus sitios" },
  { id: 4, title: "Frameworks", description: "React, Vue, Angular" }
];

export default function StudentPage() {
  return (
    <section>
      <h2 className="text-2xl font-bold mb-4">Tus Clases</h2>
      <ClassGrid classes={mockClasses} />
    </section>
  );
}