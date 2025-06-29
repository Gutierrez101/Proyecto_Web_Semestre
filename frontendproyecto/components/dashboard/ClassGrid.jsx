import { Card } from "../ui/Card";

export default function ClassGrid({ classes }) {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      {classes.map((c) => (
        <Card key={c.id}>
          <h3 className="font-bold text-lg text-green-700">{c.title}</h3>
          <p className="text-sm text-black">{c.description}</p>
        </Card>
      ))}
    </div>
  );
}