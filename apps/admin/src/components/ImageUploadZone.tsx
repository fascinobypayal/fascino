import { motion } from "framer-motion";
import { Upload, Image as ImageIcon } from "lucide-react";

interface ImageUploadZoneProps {
  currentImage?: string;
  onUpload: () => void;
  label?: string;
  aspectRatio?: "square" | "landscape" | "portrait";
}

export const ImageUploadZone = ({ 
  currentImage, 
  onUpload, 
  label = "Upload Image",
  aspectRatio = "landscape"
}: ImageUploadZoneProps) => {
  const aspectClasses = {
    square: "aspect-square",
    landscape: "aspect-video",
    portrait: "aspect-[3/4]",
  };

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl ${aspectClasses[aspectRatio]} ${
        currentImage ? "" : "upload-zone"
      }`}
      whileTap={{ scale: 0.98 }}
      onClick={onUpload}
    >
      {currentImage ? (
        <>
          <img
            src={currentImage}
            alt={label}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/30 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <div className="bg-card/90 rounded-xl px-4 py-2 flex items-center gap-2">
              <Upload className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">Change Image</span>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-3">
            <ImageIcon className="w-6 h-6 text-secondary" />
          </div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs mt-1">Tap to upload</p>
        </div>
      )}
    </motion.div>
  );
};
