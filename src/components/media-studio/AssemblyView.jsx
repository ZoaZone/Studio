export default function AssemblyView({ onBack, onNext }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">Assembly</h2>
      <button onClick={onBack} className="mt-4 mr-2 border p-2 rounded">Back</button>
      <button onClick={onNext} className="mt-4 bg-fuchsia-600 text-white p-2 rounded">Next</button>
    </div>
  );
}