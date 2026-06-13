import { useState } from "react";
import BriefView from "../components/BriefView";
import AssemblyView from "../components/AssemblyView";
import GenerationView from "../components/GenerationView";
import DeployView from "../components/DeployView";
export default function MediaStudio() {
  const [step, setStep] = useState(1); // 1: Brief, 2: Assets, 3: Generation, 4: Deployment
  
  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Modern Progress Bar */}
      <div className="flex justify-between mb-12">
        {['The Brief', 'Assembly', 'Generation', 'Review & Deploy'].map((s, i) => (
          <div key={s} className={`flex flex-col items-center ${step > i ? 'text-fuchsia-500' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step > i ? 'border-fuchsia-500 bg-fuchsia-50' : 'border-gray-300'}`}>
              {i + 1}
            </div>
            <span className="text-xs mt-2 font-medium">{s}</span>
          </div>
        ))}
      </div>

      {/* Dynamic Content Area */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        {step === 1 && <BriefView onNext={() => setStep(2)} />}
        {step === 2 && <AssemblyView onBack={() => setStep(1)} onNext={() => setStep(3)} />}
        {step === 3 && <GenerationView onNext={() => setStep(4)} />}
        {step === 4 && <DeployView onBack={() => setStep(3)} />}
      </div>
    </div>
  );
}