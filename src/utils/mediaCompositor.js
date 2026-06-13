export const burnBrandingIntoImage = async (baseImageUrl, logoUrl, mainText, subText) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const baseImage = new Image();
    baseImage.crossOrigin = "anonymous";
    baseImage.src = baseImageUrl;

    baseImage.onload = () => {
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;
      ctx.drawImage(baseImage, 0, 0);

      const gradient = ctx.createLinearGradient(0, canvas.height - 200, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.8)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, canvas.height - 200, canvas.width, 200);

      ctx.fillStyle = "white";
      ctx.textAlign = "left";
      
      ctx.font = "bold 48px Arial";
      ctx.fillText(mainText, 40, canvas.height - 80);
      
      ctx.font = "24px Arial";
      ctx.fillText(subText, 40, canvas.height - 40);

      if (logoUrl) {
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.src = logoUrl;
        logo.onload = () => {
          const logoSize = 100;
          ctx.drawImage(logo, canvas.width - logoSize - 40, canvas.height - logoSize - 40, logoSize, logoSize);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        logo.onerror = () => resolve(canvas.toDataURL('image/jpeg', 0.9));
      } else {
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      }
    };
    
    baseImage.onerror = (err) => reject(err);
  });
};
