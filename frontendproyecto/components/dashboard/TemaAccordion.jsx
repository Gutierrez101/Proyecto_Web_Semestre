import { useState } from 'react';
import DoneButton from './DoneButton';

export default function TemaAccordion({ tema, recursos }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 bg-white rounded shadow">
      <div
        className="p-4 flex justify-between items-center cursor-pointer border-b"
        onClick={() => setOpen(!open)}
      >
        <h3 className="text-lg font-semibold">{tema}</h3>
        <DoneButton />
      </div>
      {open && (
        <div className="p-4">
          <ul className="list-disc pl-5">
            {recursos.length === 0
              ? <li className="text-gray-500">Sin contenido</li>
              : recursos.map((r, idx) => <li key={idx}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
