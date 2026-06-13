export default function GenerationView({ onNext }) {
  return <div className="p-4"><h2 className="text-xl font-bold">Generation</h2><button onClick={onNext} className="mt-4 bg-fuchsia-600 text-white p-2 rounded">Next</button></div>;
}