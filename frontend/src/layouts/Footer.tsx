import { useState, useEffect } from "react";
import { Facebook, Instagram, MapPin, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

export function Footer() {
    const [socialLinks, setSocialLinks] = useState({ facebook: "", instagram: "" });

    useEffect(() => {
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5005/api'}/public/settings`)
            .then(res => {
                const settings = res.data;
                const fb = settings.find((s: any) => s.key === "facebook_url")?.value || "https://facebook.com/dhavalmartturf";
                const insta = settings.find((s: any) => s.key === "instagram_url")?.value || "https://instagram.com/dhavalmartturf";
                setSocialLinks({ facebook: fb, instagram: insta });
            }).catch(console.error);
    }, []);
    return (
        <footer className="bg-secondary/20 border-t border-border mt-20 pt-16 pb-8">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <img src="/images/logo.png" alt="Dhaval Plaza Logo" className="w-10 h-10 object-contain" />
                        <span className="font-bold text-lg tracking-tight">Dhaval Plaza</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Premium sports facility in Chiplun offering top-quality artificial grass for football and cricket enthusiasts.
                    </p>
                    <div className="flex gap-4 pt-2">
                        <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                            <Instagram className="w-5 h-5" />
                        </a>
                        <a href={socialLinks.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                            <Facebook className="w-5 h-5" />
                        </a>
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                        <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
                        <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                        <li><Link to="/gallery" className="hover:text-primary transition-colors">Gallery</Link></li>
                        <li><Link to="/terms-and-conditions" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-4">Contact Info</h3>
                    <ul className="space-y-4 text-muted-foreground text-sm">
                        <li className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary shrink-0" />
                            <span>Dhawal Plaza, Khend, Chiplun, Maharashtra 415605</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-primary shrink-0" />
                            <span>+91 9876543210</span>
                        </li>
                        <li className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-primary shrink-0" />
                            <span>info@dhavalmartturf.com</span>
                        </li>
                    </ul>
                </div>

                <div>
                    <h3 className="font-semibold text-lg mb-4">Location Map</h3>
                    <div className="h-32 w-full rounded-lg overflow-hidden border border-border bg-secondary flex items-center justify-center">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d121734.90822601716!2d73.4542698745582!3d17.545801373505697!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc20bd355555555%3A0x1d5f2bf29a28dcf9!2sDhawal%20Plaza!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={false}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                    <a href="https://maps.app.goo.gl/PSMyCpVYCbqWYmTQ7" target="_blank" rel="noreferrer" className="mt-4 block text-center text-sm text-primary hover:underline">
                        Get Directions
                    </a>
                </div>
            </div>
            <div className="container mx-auto px-4 mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} Dhaval Mart Turf. All rights reserved.
            </div>
        </footer>
    );
}
