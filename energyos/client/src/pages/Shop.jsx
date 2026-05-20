import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, ChevronRight, ShoppingCart, ArrowLeft, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ECO_PRODUCTS, CATEGORIES } from '../lib/products';

export default function Shop() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('Tous');

    const filteredProducts = useMemo(() => {
        return ECO_PRODUCTS.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.desc.toLowerCase().includes(search.toLowerCase());
            const matchesCat = activeCategory === 'Tous' || p.category === activeCategory;
            return matchesSearch && matchesCat;
        });
    }, [search, activeCategory]);

    /* ── REVEAL EFFECT ── */
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [filteredProducts]);

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-accent-mint/25">
            {/* ── Header ── */}
            <nav className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur-xl border-b border-white/6">
                <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <ArrowLeft className="w-4 h-4 text-text-muted group-hover:text-accent-mint transition-colors" />
                        <span className="font-display font-bold text-lg">Boutique <span className="eco-text-gradient">EnergyOS</span></span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-bg-elevated rounded-xl border border-white/5">
                            <Search className="w-3.5 h-3.5 text-text-muted" />
                            <input
                                type="text"
                                placeholder="Rechercher un produit..."
                                className="bg-transparent border-none text-xs focus:ring-0 w-48"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="p-2 rounded-xl bg-bg-elevated border border-white/5 relative">
                            <ShoppingCart className="w-4.5 h-4.5 text-text-muted" />
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-mint text-[10px] text-white flex items-center justify-center font-bold">0</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-5 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* ── Sidebar Filters ── */}
                    <aside className="w-full lg:w-64 space-y-8 reveal">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Filter className="w-4 h-4 text-accent-mint" />
                                <h2 className="font-display font-bold text-sm uppercase tracking-wider">Filtrer par</h2>
                            </div>

                            <div className="space-y-1">
                                <button
                                    onClick={() => setActiveCategory('Tous')}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${activeCategory === 'Tous' ? 'bg-accent-mint/10 text-accent-mint font-bold' : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary'}`}
                                >
                                    Tous les produits
                                </button>
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${activeCategory === cat ? 'bg-accent-mint/10 text-accent-mint font-bold' : 'text-text-muted hover:bg-bg-elevated hover:text-text-primary'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-5 eco-card bg-eco-gradient-soft border-accent-mint/20">
                            <Leaf className="w-6 h-6 text-accent-mint mb-3" />
                            <h3 className="font-bold text-sm mb-2">Conseil Éco-Expert</h3>
                            <p className="text-xs text-text-muted leading-relaxed">
                                Nos techniciens peuvent auditer votre clinique avant l'achat pour dimensionner parfaitement vos batteries.
                            </p>
                            <button className="mt-4 text-[10px] font-bold uppercase tracking-widest text-accent-mint hover:underline">Prendre RDV →</button>
                        </div>
                    </aside>

                    {/* ── Product Grid ── */}
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center justify-between reveal">
                            <p className="text-sm text-text-muted">
                                Affichage de <span className="text-text-primary font-bold">{filteredProducts.length}</span> produits
                            </p>
                            <div className="flex items-center gap-2 text-xs text-text-muted">
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                                <span>Trier par : <span className="text-text-primary font-semibold cursor-pointer border-b border-dotted border-text-muted">Populaire</span></span>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredProducts.map((product, idx) => (
                                <div
                                    key={product.id}
                                    className="group eco-card p-0 flex flex-col hover:scale-[1.02] transition-all duration-300 relative overflow-hidden reveal"
                                    style={{ transitionDelay: `${idx * 50}ms` }}
                                >
                                    {/* Image Section */}
                                    <div className="relative h-48 overflow-hidden bg-bg-elevated">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <div className={`absolute top-4 left-4 w-10 h-10 rounded-xl ${product.bg} ${product.color} backdrop-blur-md flex items-center justify-center shadow-lg`}>
                                            {React.cloneElement(product.icon, { className: 'w-5 h-5' })}
                                        </div>
                                        {product.badge && (
                                            <span className="absolute top-4 right-4 text-[9px] font-black uppercase tracking-widest bg-accent-amber/90 text-white px-2.5 py-1 rounded-lg backdrop-blur-md shadow-lg">
                                                {product.badge}
                                            </span>
                                        )}
                                    </div>

                                    {/* Info Section */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="mb-4">
                                            <p className="text-[10px] text-accent-mint font-black uppercase tracking-[0.2em] mb-1.5">{product.category}</p>
                                            <h3 className="font-display font-black text-text-primary leading-tight text-lg line-clamp-2">{product.name}</h3>
                                        </div>

                                        <p className="text-xs text-text-muted line-clamp-2 mb-6 flex-1 italic leading-relaxed">
                                            "{product.desc}"
                                        </p>

                                        <div className="flex items-center justify-between pt-5 border-t border-white/5">
                                            <span className="font-mono font-bold text-xl text-text-primary">{product.price}</span>
                                            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-eco-gradient text-white text-xs font-bold shadow-eco hover:opacity-90 active:scale-95 transition-all">
                                                Détails <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="py-20 text-center eco-card italic text-text-muted reveal">
                                Aucun produit ne correspond à votre recherche.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
