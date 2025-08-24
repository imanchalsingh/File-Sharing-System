import React, { useEffect, useState } from "react";
import {
  FaWhatsapp,
  FaLinkedin,
  FaInstagram,
  FaTwitter,
  FaFacebookF,
  FaTelegramPlane,
  FaEnvelope,
  FaTrash,
} from "react-icons/fa";
import axios from "axios";

const MyFiles: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Load saved images on component mount
  useEffect(() => {
    const stored = localStorage.getItem("uploadedImages");
    if (stored) {
      setImages(JSON.parse(stored));
    }
  }, []);

  // Handle multiple image upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await axios.post("http://localhost:5000/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const newUrl = res.data.url;

        setImages((prev) => {
          const updated = [...prev, newUrl];
          localStorage.setItem("uploadedImages", JSON.stringify(updated));
          return updated;
        });
      } catch (err) {
        console.error("Upload failed", err);
      }
    }
  };

  // Delete image by index
  const handleDelete = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    localStorage.setItem("uploadedImages", JSON.stringify(updated));
  };

  // Social media share URLs
  const socialPlatforms = (url: string) => [
    {
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`,
      icon: <FaWhatsapp className="text-green-600 text-xl sm:text-2xl" />,
    },
    {
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        url
      )}`,
      icon: <FaLinkedin className="text-blue-700 text-xl sm:text-2xl" />,
    },
    {
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
      icon: <FaTwitter className="text-blue-400 text-xl sm:text-2xl" />,
    },
    {
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`,
      icon: <FaFacebookF className="text-blue-600 text-xl sm:text-2xl" />,
    },
    {
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}`,
      icon: <FaTelegramPlane className="text-blue-500 text-xl sm:text-2xl" />,
    },
    {
      href: `mailto:?subject=Check this image&body=${encodeURIComponent(url)}`,
      icon: <FaEnvelope className="text-gray-700 text-xl sm:text-2xl" />,
    },
    {
      href: "https://www.instagram.com/",
      icon: <FaInstagram className="text-pink-500 text-xl sm:text-2xl" />,
    },
  ];

  return (
    <div className="px-4 sm:px-8">
      {/* Upload input */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <input
          className="w-full sm:w-80 text-left px-4 py-2 rounded-lg text-white bg-[#3158cdc9] hover:bg-white/80 hover:text-[#133aaf]  transition-all duration-300 shadow-sm cursor-pointer"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
        />
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative group rounded-lg overflow-hidden shadow-md"
          >
            <img
              src={img}
              alt={`uploaded-${idx}`}
              className="w-full h-40 sm:h-48 object-cover cursor-pointer hover:scale-105 transition"
              onClick={() => setActiveImage(img)}
            />
            {/* Delete Button */}
            <button
              onClick={() => handleDelete(idx)}
              className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
            >
              <FaTrash className="text-sm sm:text-base" />
            </button>
          </div>
        ))}
      </div>

      {/* Fullscreen modal */}
      {activeImage && (
        <div>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
            onClick={() => setActiveImage(null)}
          >
            <img
              src={activeImage}
              alt="full preview"
              className="max-w-[90%] max-h-[90%] rounded-lg shadow-xl"
            />
          </div>

          {/* Share Options */}
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex flex-wrap justify-center gap-3 bg-white shadow-md p-3 rounded-full">
            {socialPlatforms(activeImage).map((platform, index) => (
              <a
                key={index}
                href={platform.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {platform.icon}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFiles;
