import { Card } from "../ui/Card";

export default function ClassGrid({ classes }) {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      {classes.map((c, idx) => (
        <Card key={idx}>
          <h3 className="font-bold text-lg text-green-700">{c.tema}</h3>
          <ul className="text-sm text-black">
            {c.recursos.map((recurso, i) => (
              <li key={i}>{recurso}</li>
            ))}
            {c.tema === "Notas" && (
              <li>
                <a
                  href="/dashboard/dashboardEstudiante/notasEstudiante"
                  className="text-blue-600 underline"
                >
                  Ver notas
                </a>
              </li>
            )}
          </ul>
        </Card>
      ))}
    </div>
  );
}