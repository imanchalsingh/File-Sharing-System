import React, { useState } from "react";
import { FaWhatsapp, FaLinkedin, FaInstagram } from "react-icons/fa";


const MyFiles: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Handle multiple image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div>
      {/* Upload input */}
      <input
        className="w-80 text-left px-4 py-2 rounded-lg text-white bg-red-300 hover:bg-white/80 hover:text-red-500 transition-all duration-300 shadow-sm cursor-pointer mb-6"
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageChange}
        placeholder="Upload images"
      />

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`uploaded-${idx}`}
            className=" h-50 w-50 object-cover rounded-lg cursor-pointer shadow-md hover:scale-105 transition"
            onClick={() => setActiveImage(img)}
          />
        ))}
      </div>

      {/* Fullscreen modal */}
      {activeImage && (
        <div>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-gradient-to-b from-red-300 to-pink-50 bg-opacity-50 flex justify-center items-center z-50"
            onClick={() => setActiveImage(null)}
          >
            <img
              src={activeImage}
              alt="full preview"
              className="max-w-[90%] max-h-[90%] rounded-lg shadow-xl"
            />
          </div>

          {/* Share Options */}
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex gap-4 bg-white shadow-md p-3 rounded-full">
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                activeImage
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="text-green-600 text-2xl">
                <FaWhatsapp />
              </i>
            </a>

            {/* LinkedIn */}
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                activeImage
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="text-blue-700 text-2xl">
                <FaLinkedin />
              </i>
            </a>

            {/* Instagram (note: no direct share, using profile as placeholder) */}
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="text-pink-500 text-2xl">
                <FaInstagram />
              </i>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFiles;
