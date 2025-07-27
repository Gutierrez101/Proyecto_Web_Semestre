'use client';

export default function ClassGrid({ classes = [] }) {
  if (!classes.length) {
    return (
      <div className="text-center text-gray-600">
        No hay clases disponibles.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {classes.map((cl) => (
        <div
          key={cl.id}
          className="bg-white p-4 rounded shadow cursor-pointer hover:bg-gray-100"
        >
          <h3 className="text-lg font-semibold">{cl.title}</h3>
          {/* Aquí puedes agregar más información de la clase */}
        </div>
      ))}
    </div>
  );
}
