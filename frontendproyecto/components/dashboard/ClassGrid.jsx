import { Card } from "../ui/Card";

export default function ClassGrid({ classes = [] }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {classes.map((c, idx) => (
        <Card key={idx}>
          <h3 className="font-bold text-lg text-green-700">{c.tema}</h3>
          {c.recursos && c.recursos.length > 0 ? (
            <ul className="text-sm text-black">
              {c.recursos.map((recurso, i) => (
                <li key={i}>{recurso}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No hay recursos disponibles</p>
          )}
        </Card>
      ))}
    </div>
  );
}