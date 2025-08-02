'use client';

const Card = ({ children, onClick }) => (
  <div 
    className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
    onClick={onClick}
  >
    {children}
  </div>
);

export default function ClassGrid({ classes, onItemClick }) {
  
  if (!classes || classes.length === 0) {
    return <div className="text-center py-8">No tienes cursos asignados</div>;
  }
  
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {classes.map((clase, idx) => (
        <Card key={idx} onClick={() => onItemClick(clase.id)}>
          <h3 className="font-bold text-lg">{clase.tema}</h3>
          <ul className="text-sm text-gray-600">
            {clase.recursos.map((recurso, i) => (
              <li key={i}>{recurso}</li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}