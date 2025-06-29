import ClassGrid from "@/components/dashboard/ClassGrid";

export default async function StudentDashboard() {
  const res = await fetch("/api/clases?role=student");
  const classes = await res.json();

  return (
    <section className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">MiStudyClass</h2>
      <ClassGrid classes={classes} />
    </section>
  );
}