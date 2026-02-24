import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5005/api";

export default function GalleryPage() {
    const [activeTab, setActiveTab] = useState("All");
    const [selectedImage, setSelectedImage] = useState<{ url: string, title?: string } | null>(null);
    const [categories, setCategories] = useState<string[]>(["All"]);
    const [images, setImages] = useState<any[]>([]);

    useEffect(() => {
        const fetchGallery = async () => {
            try {
                const res = await axios.get(`${API}/public/gallery`);
                const flatGalleries = res.data;

                const uniqueCats = Array.from(new Set(flatGalleries.map((g: any) => g.category)));
                const allCats = ["All", ...uniqueCats];
                setCategories(allCats as string[]);

                const BASE_URL = API.replace('/api', '');

                let allImgs = flatGalleries.map((g: any) => ({
                    id: g.id,
                    url: g.url.startsWith('http') ? g.url : `${BASE_URL}${g.url}`,
                    title: g.category, category: g.category
                }));

                // Keep some fallback placeholder images if the DB is completely empty just so the page isn't totally blank initially
                if (allImgs.length === 0) {
                    allImgs = [
                        { id: 1001, url: "/images/IMG_6232.png", title: "Football Action", category: "Football Matches" },
                        { id: 1002, url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=500&fit=crop", title: "Arena", category: "Football Matches" }
                    ];
                    setCategories(["All", "Football Matches"]);
                }

                setImages(allImgs);
            } catch (err) {
                console.error("Failed to fetch gallery", err);
            }
        };
        fetchGallery();
    }, []);

    const filteredImages = activeTab === "All"
        ? images
        : images.filter(img => img.category === activeTab);

    return (
        <div className="w-full pt-28 pb-20 container mx-auto px-4 min-h-screen animate-in fade-in duration-700">
            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Our Gallery</h1>
                <p className="text-muted-foreground">Relive the best moments captured at Dhaval Mart Turf.</p>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${activeTab === cat
                            ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(22,163,74,0.4)]"
                            : "bg-secondary text-foreground hover:bg-secondary/80"
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Masonry Grid */}
            <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
                <AnimatePresence>
                    {filteredImages.map((img) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            key={img.id}
                            className="relative group cursor-pointer overflow-hidden rounded-2xl auto-rows-auto mb-6 shadow-lg border border-border/30 hover:shadow-primary/20 hover:border-primary/50 transition-all"
                            onClick={() => setSelectedImage({ url: img.url, title: img.title })}
                        >
                            <img
                                src={img.url}
                                alt={img.title}
                                className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                                <h3 className="text-white font-semibold text-lg">{img.title}</h3>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] grid place-items-center bg-black/95 backdrop-blur-md p-4"
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 right-6 text-white hover:text-primary transition-colors bg-[#1a1b1a] border border-border rounded-full p-3 shadow-xl hover:scale-110 transform"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            src={selectedImage.url}
                            alt={selectedImage.title || "Expanded view"}
                            className="max-w-full max-h-[85vh] rounded-xl shadow-[0_0_40px_rgba(189,227,60,0.15)] ring-1 ring-border"
                        />
                        {selectedImage.title && (
                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-white mt-6 font-bold text-xl tracking-widest uppercase text-primary"
                            >
                                {selectedImage.title}
                            </motion.h3>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
