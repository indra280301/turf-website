import { useState, useEffect } from "react";
import { Menu, X, LocateFixed } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function TopNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => location.pathname === path;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setIsLoggedIn(!!localStorage.getItem("token"));
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        localStorage.removeItem("userPhone");
        localStorage.removeItem("userEmail");
        setIsLoggedIn(false);
        navigate("/");
    };

    return (
        <nav
            className={`fixed top-0 w-full z-50 transition-all duration-300 border-b border-transparent ${isScrolled ? "bg-background/80 backdrop-blur-md border-border" : "bg-transparent"
                }`}
        >
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                    <img src="/images/logo.png" alt="Dhaval Plaza Logo" className="w-12 h-12 object-contain" />
                    <div className="flex flex-col">
                        <span className="font-extrabold text-xl tracking-tight leading-none text-white uppercase">Dhaval Plaza</span>
                    </div>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex gap-8 items-center bg-[#111111]/80 px-8 py-3 rounded-full backdrop-blur-md border border-border/50 shadow-xl">
                    <Link to="/" className={`text-sm font-bold transition-colors uppercase tracking-wide ${isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}>Home</Link>
                    <Link to="/about" className={`text-sm font-bold transition-colors uppercase tracking-wide ${isActive('/about') ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}>About</Link>
                    <Link to="/gallery" className={`text-sm font-bold transition-colors uppercase tracking-wide ${isActive('/gallery') ? 'text-primary' : 'text-muted-foreground hover:text-white'}`}>Gallery</Link>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <button className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors text-white mr-2">
                        <LocateFixed className="w-4 h-4" /> Chiplun
                    </button>

                    {isLoggedIn ? (
                        <>
                            <Link
                                to={localStorage.getItem("userRole") === "ADMIN" ? "/admin" : "/user/dashboard"}
                                className="text-sm font-bold hover:text-primary text-white transition-colors uppercase tracking-wide mr-2"
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-sm font-bold hover:text-red-500 text-muted-foreground transition-colors uppercase tracking-wide mr-2"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link
                            to="/login"
                            className="text-sm font-extrabold hover:text-primary text-white transition-colors uppercase tracking-wide mr-2"
                        >
                            LOGIN
                        </Link>
                    )}

                    <Link
                        to="/book"
                        className="bg-primary hover:bg-primary/90 text-black px-6 py-2 rounded-full font-bold transition-all shadow-[0_0_15px_rgba(189,227,60,0.5)]"
                    >
                        Book Now
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-foreground"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-[#111111]/95 backdrop-blur-xl border-b border-border shadow-2xl py-6 px-6 flex flex-col gap-5 animate-in slide-in-from-top-4 duration-300">
                    <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`text-lg font-black uppercase tracking-widest ${isActive('/') ? 'text-primary' : 'text-white/80 hover:text-white'}`}>Home</Link>
                    <Link to="/about" onClick={() => setMobileMenuOpen(false)} className={`text-lg font-black uppercase tracking-widest ${isActive('/about') ? 'text-primary' : 'text-white/80 hover:text-white'}`}>About</Link>
                    <Link to="/gallery" onClick={() => setMobileMenuOpen(false)} className={`text-lg font-black uppercase tracking-widest ${isActive('/gallery') ? 'text-primary' : 'text-white/80 hover:text-white'}`}>Gallery</Link>
                    <div className="h-px bg-border/50 my-1" />
                    {isLoggedIn ? (
                        <>
                            <Link to={localStorage.getItem("userRole") === "ADMIN" ? "/admin" : "/user/dashboard"} onClick={() => setMobileMenuOpen(false)} className="text-lg font-black uppercase tracking-widest text-white/80 hover:text-white">Dashboard</Link>
                            <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-left text-lg font-black uppercase tracking-widest text-red-500 hover:text-red-400">Logout</button>
                        </>
                    ) : (
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-lg font-black uppercase tracking-widest text-white/80 hover:text-white">Login</Link>
                    )}
                    <Link
                        to="/book"
                        className="bg-primary text-[#111111] text-center hover:bg-primary/95 px-6 py-4 rounded-2xl font-black text-lg tracking-widest mt-2 shadow-[0_0_30px_rgba(189,227,60,0.15)] active:scale-95 transition-all"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        BOOK NOW
                    </Link>
                </div>
            )}
        </nav>
    );
}
