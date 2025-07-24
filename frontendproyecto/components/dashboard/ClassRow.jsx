export default function ClassRow({ studyClass }) {
  return (
    <tr className="border-b">
      <td className="p-2">{studyClass.title}</td>
      <td className="p-2">{studyClass.description}</td>
      <td className="p-2">
        <button className="bg-green-600 text-white px-2 py-1 rounded mr-2">Ver</button>
        <button className="bg-gray-600 text-white px-2 py-1 rounded">Editar</button>
      </td>
    </tr>
  );
}