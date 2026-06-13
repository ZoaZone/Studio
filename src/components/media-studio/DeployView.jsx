import { useState } from "react";
import { burnBrandingIntoImage } from "../../utils/mediaCompositor";

export default function DeployView({ onBack, aiImageUrl = "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1000&auto=format&fit=crop" }) {
  const [finalImage, setFinalImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const campaignText = "Expert Care for Your Pet";
  const subText = "Vet N Pet Hospital | Book Today";
  const logoPath = "/assets/logo.png";

  const handleProcessImage = async () => {
    setIsProcessing(true);
    try {
      const burnedImageUrl = await burnBrandingIntoImage(aiImageUrl, logoPath, campaignText, subText);
      setFinalImage(burnedImageUrl);
    } catch (error) {
      console.error("Error compositing image:", error);
    }
    setIsProcessing(false);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Deploy Campaign</h2>
      
      {!finalImage ? (
        <div className="space-y-4">
          <p>AI Base Image Generated. Ready to apply Vet N Pet branding.</p>
          {aiImageUrl && <img src={aiImageUrl} alt="AI Base" className="w-full max-w-md rounded border" />}
          <div className="flex gap-2">
            <button onClick={onBack} className="border p-2 rounded">Back</button>
            <button onClick={handleProcessImage} disabled={isProcessing} className="bg-fuchsia-600 text-white p-2 rounded">
              {isProcessing ? "Applying Branding..." : "Generate Final Ad"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-green-600 font-bold">Final Ad Ready!</p>
          <img src={finalImage} alt="Final Ad" className="w-full max-w-md rounded border shadow-lg" />
          
          <div className="flex gap-2">
            <a href={finalImage} download="VetNPet_Campaign.jpg" className="bg-blue-600 text-white p-2 rounded block text-center flex-1">
              Download Final Ad
            </a>
            <button onClick={() => setFinalImage(null)} className="border p-2 rounded">Restart</button>
          </div>
        </div>
      )}
    </div>
  );
}
