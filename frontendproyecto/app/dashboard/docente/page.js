import ClassRow from "@/components/dashboard/ClassRow";

export default async function TeacherDashboard() {
  const res = await fetch("/api/clases?role=teacher");
  const classes = await res.json();

  return (
    <section className="p-6">
      <h2 className="text-xl font-bold mb-4">Clases propias</h2>
      <table className="w-full text-sm">
        <tbody>
          {classes.map((c) => (
            <ClassRow key={c.id} studyClass={c} />
          ))}
        </tbody>
      </table>
    </section>
  );
}