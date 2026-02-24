import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Star, UserCircle2, MessageSquareText, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";

export default function HomePage() {
    const [turfInfo, setTurfInfo] = useState({ minPrice: 1500, openTime: "6:00 AM", closeTime: "12:00 AM" });
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem("token"));

        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/public/info`)
            .then(res => setTurfInfo(res.data))
            .catch(err => console.error("Could not fetch turf info", err));

        fetchReviews();
    }, []);

    const fetchReviews = () => {
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/reviews`)
            .then(res => setReviews(res.data))
            .catch(err => console.error("Could not fetch reviews", err));
    };

    const submitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingReview(true);
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/reviews`, newReview, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            setNewReview({ rating: 5, comment: "" });
            fetchReviews();
        } catch (err) {
            console.error("Failed to submit review", err);
            alert("Failed to submit review. Try again later.");
        } finally {
            setSubmittingReview(false);
        }
    };
    return (
        <div className="w-full bg-[#111111] text-foreground font-sans min-h-screen pb-20">
            {/* Hero Section */}
            <section className="relative h-[85vh] flex flex-col justify-end pb-24 overflow-hidden rounded-b-[40px] border-b border-border/20 shadow-[-10px_20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 z-0 bg-black">
                    <img
                        src="/images/IMG_6744.jpg"
                        alt="Dhaval Plaza Architecture"
                        className="w-full h-full object-cover opacity-50 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/70 to-[#111111]/20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#111111] via-transparent to-transparent" />
                </div>

                <div className="container mx-auto px-4 z-10 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="max-w-3xl space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 bg-black/40 border border-primary/20 px-5 py-2.5 rounded-full backdrop-blur-xl">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_var(--color-primary)]" />
                            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white">
                                Open {turfInfo.openTime} - {turfInfo.closeTime} • Chiplun
                            </span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-[1.05] uppercase">
                            Train. Play. <br />
                            <span className="text-primary drop-shadow-[0_0_30px_var(--color-primary)]">Grow.</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mb-8 leading-snug">
                            Real passion, and real growth for every young, aspiring athlete. Find your turf, book instantly, and own the game.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 pt-6">
                            <Link
                                to="/book"
                                className="bg-primary hover:bg-primary/90 text-[#111111] px-10 py-5 rounded-full font-black text-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.03] shadow-[0_0_30px_rgba(189,227,60,0.2)] active:scale-95"
                            >
                                BOOK YOUR SLOT NOW <ArrowRight className="w-6 h-6" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <section className="py-20 border-t border-border/30">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-3xl font-bold tracking-tight text-white">Dhaval Plaza Pricing & Features</h2>
                    </div>
                    <div className="grid lg:grid-cols-2 gap-8 items-center">
                        {/* Interactive Hero Image Card (Fixed Unsplash Error) */}
                        <div className="relative h-[28rem] rounded-[32px] overflow-hidden group shadow-2xl border border-border/50 bg-[#151515]">
                            <img src="/images/IMG_6744.jpg" alt="Premium Turf" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/40 to-transparent" />
                            <div className="absolute bottom-8 left-8 right-8">
                                <h3 className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-md mb-2">Dhaval Plaza Arena</h3>
                                <p className="font-medium text-primary flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 bg-black/40 rounded-full" /> The Ultimate Box Cricket & Football Turf
                                </p>
                            </div>
                        </div>

                        {/* Pricing & Booking Action */}
                        <div className="flex flex-col gap-6 h-full">
                            <div className="bg-[#1a1b1a] rounded-[32px] p-10 border border-border/50 hover:border-primary/50 transition-all group relative overflow-hidden flex-1 flex flex-col justify-center">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all pointer-events-none" />
                                <div className="relative z-10 space-y-8">
                                    <div>
                                        <h4 className="text-5xl font-black text-white tracking-tighter">
                                            <span className="text-xl text-primary block mb-1 tracking-widest uppercase">Starts from</span>
                                            ₹{turfInfo.minPrice.toLocaleString()} <span className="text-2xl text-muted-foreground font-medium tracking-normal">/ hour</span>
                                        </h4>
                                        <p className="text-muted-foreground text-sm mt-4 max-w-sm leading-relaxed">
                                            One premium turf. Whether it's a 6v6 football match or high-intensity box cricket, you get full access to FIFA-approved grass and floodlights.
                                        </p>
                                    </div>

                                    <div className="space-y-4 pt-6 border-t border-white/5">
                                        <div className="flex items-center gap-3 text-white font-bold">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                            </div>
                                            High-Intensity LED Floodlights
                                        </div>
                                        <div className="flex items-center gap-3 text-white font-bold">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                            </div>
                                            Nets, Stumps & Basic Gear Included
                                        </div>
                                    </div>

                                    <Link to="/book" className="mt-8 relative overflow-hidden w-full bg-[#111111] border border-primary text-primary py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all hover:bg-primary hover:text-black group">
                                        RESERVE TURF NOW <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Reviews Section */}
            <section className="py-24 border-t border-border/30 relative overflow-hidden">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6 shadow-[0_0_20px_rgba(189,227,60,0.15)]">
                            <MessageSquareText className="w-8 h-8" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase">Player Feedback</h2>
                        <p className="text-muted-foreground mt-4 font-medium text-lg">Hear what the athletes have to say about the Dhaval Plaza experience.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                        {reviews.length > 0 ? reviews.map((review) => (
                            <div key={review.id} className="bg-[#1a1b1a] p-8 rounded-3xl border border-border/50 hover:border-primary/30 transition-all group shadow-lg flex flex-col h-full">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-lg">
                                        <UserCircle2 className="w-8 h-8 opacity-50" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white leading-none mb-1">{review.user?.name || "Player"}</h4>
                                        <div className="flex gap-1 text-primary">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-primary" : "text-muted opacity-30"}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-muted-foreground leading-relaxed italic flex-1">"{review.comment}"</p>
                            </div>
                        )) : (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                No reviews yet. Be the first to leave one!
                            </div>
                        )}
                    </div>

                    {/* Review Form */}
                    <div className="max-w-2xl mx-auto bg-[#1a1b1a] p-8 md:p-10 rounded-3xl border border-primary/20 shadow-[0_0_30px_rgba(189,227,60,0.05)]">
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6 text-center">Share Your Experience</h3>

                        {isLoggedIn ? (
                            <form onSubmit={submitReview} className="space-y-6">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-3">Rate your experience</label>
                                    <div className="flex gap-2 justify-center py-2 bg-[#111] rounded-xl border border-border/50">
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                type="button"
                                                key={star}
                                                onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <Star className={`w-8 h-8 ${star <= newReview.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block mb-3">Your Review</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={newReview.comment}
                                        onChange={e => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                        placeholder="Tell us about the turf, lighting, and overall vibe..."
                                        className="w-full bg-[#111111] border border-border/50 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-all font-medium resize-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="w-full bg-primary hover:bg-primary/90 text-[#111111] py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {submittingReview ? "SUBMITTING..." : "POST REVIEW"} <Send className="w-5 h-5" />
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-8 bg-[#111] rounded-xl border border-border/50">
                                <p className="text-muted-foreground font-medium mb-4">Want to leave a review? Join the squad first.</p>
                                <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold transition-all hover:bg-gray-200">
                                    Login to Post Review <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
