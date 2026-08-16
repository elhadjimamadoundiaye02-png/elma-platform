import React, { useState, useEffect, useMemo } from "react";
import {
  Wrench, Wifi, ShieldCheck, Code2, Settings2, Zap, MapPin, Calendar,
  Clock, Upload, MessageCircle, FileText, QrCode, Users, LayoutGrid,
  BarChart3, LogOut, ChevronRight, CheckCircle2, AlertCircle, Search,
  Bell, Plus, X, ArrowRight, Home, Ticket as TicketIcon, UserCog,
  Radio, Trash2, ChevronLeft, Building2, MonitorSmartphone
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { AuthProvider, useAuth } from "./AuthContext";
import { api } from "./api";
import { connectSocket, getSocket } from "./socket";

/* ---------------------------------- DATA ---------------------------------- */

const SERVICES = [
  { id: "dev", name: "Développement Web", icon: Code2, desc: "Sites vitrines, e-commerce, applications sur mesure.", price: "150 000 – 800 000 FCFA" },
  { id: "maint", name: "Maintenance Informatique", icon: Settings2, desc: "Maintenance préventive, curative, mises à jour.", price: "15 000 – 40 000 FCFA" },
  { id: "depan", name: "Dépannage Informatique", icon: Wrench, desc: "Diagnostic rapide, réparation matériel/logiciel.", price: "10 000 – 35 000 FCFA" },
  { id: "reseau", name: "Réseau & Télécom", icon: Wifi, desc: "Installation LAN/WAN, Wi-Fi, routeurs, VoIP.", price: "25 000 – 120 000 FCFA" },
  { id: "cyber", name: "CyberSécurité & Audit", icon: ShieldCheck, desc: "Audit de sécurité, pare-feu, protection des données.", price: "50 000 – 250 000 FCFA" },
];

const STATUSES = ["À attribuer", "Assigné", "En cours", "Terminé"];

// Le backend utilise des valeurs d'enum techniques (a_attribuer, assigne...) ;
// l'interface affiche des libellés français. Traduction dans les deux sens.
const STATUS_LABELS = { a_attribuer: "À attribuer", assigne: "Assigné", en_cours: "En cours", termine: "Terminé" };
const STATUS_VALUES = { "À attribuer": "a_attribuer", "Assigné": "assigne", "En cours": "en_cours", "Terminé": "termine" };

// Traduit un ticket tel que renvoyé par l'API (champs techniques, enum en
// minuscules) vers la forme attendue par les composants d'affichage déjà
// construits pour le prototype (labels français, id lisible = référence).
function adaptTicket(t, usersById = {}) {
  return {
    uuid: t.id,
    id: t.reference,
    clientId: t.clientId,
    technicienId: t.technicienId,
    service: t.typeService,
    mode: t.modeIntervention === "domicile" ? "Domicile" : "Atelier",
    status: STATUS_LABELS[t.statut] || t.statut,
    tech: t.technicienId ? (usersById[t.technicienId] || "Technicien assigné") : null,
    date: t.dateRdv ? new Date(t.dateRdv).toLocaleDateString("fr-FR") : new Date(t.createdAt).toLocaleDateString("fr-FR"),
    desc: t.description,
    client: t.client ? `${t.client.prenom} ${t.client.nom}` : undefined,
  };
}

const TECHS = ["Moussa Diop", "Aïssatou Ba", "Cheikh Fall", "Rama Sy"];

const CLIENT_NAMES = ["Ibrahima Sarr", "Fatou Ndiaye", "Ousmane Kane", "Mariam Diallo", "Abdou Cissé", "Khady Faye"];

function makeTicket(i, statusIdx, service, mode) {
  return {
    id: `ELMA-${2026000 + i}`,
    client: CLIENT_NAMES[i % CLIENT_NAMES.length],
    service,
    mode,
    status: STATUSES[statusIdx],
    tech: statusIdx > 0 ? TECHS[i % TECHS.length] : null,
    date: `${8 + (i % 15)} Août 2026`,
    desc: mode === "Atelier" ? "Dépôt PC portable — ne démarre plus." : "Panne réseau bureau — coupure Wi-Fi intermittente.",
  };
}

const INITIAL_TICKETS = [
  makeTicket(1, 0, "Dépannage Informatique", "Atelier"),
  makeTicket(2, 0, "Réseau & Télécom", "Domicile"),
  makeTicket(3, 1, "CyberSécurité & Audit", "Domicile"),
  makeTicket(4, 1, "Maintenance Informatique", "Atelier"),
  makeTicket(5, 2, "Dépannage Informatique", "Domicile"),
  makeTicket(6, 2, "Développement Web", "Domicile"),
  makeTicket(7, 3, "Dépannage Informatique", "Atelier"),
  makeTicket(8, 3, "Réseau & Télécom", "Domicile"),
];

const LIVE_NAMES = ["S. Kane", "F. Diagne", "M. Sow", "A. Diouf", "R. Gueye", "T. Ndour", "B. Camara"];
const LIVE_PAGES = ["/dépannage", "/devis", "/mon-compte/tickets", "/réseau-télécom", "/accueil", "/cybersécurité"];
const LIVE_ROLES = ["Client", "Client", "Technicien", "Client"];

function randomSession(i) {
  return {
    id: i,
    name: LIVE_NAMES[Math.floor(Math.random() * LIVE_NAMES.length)],
    role: LIVE_ROLES[Math.floor(Math.random() * LIVE_ROLES.length)],
    ip: `41.82.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    page: LIVE_PAGES[Math.floor(Math.random() * LIVE_PAGES.length)],
    duration: Math.floor(Math.random() * 20) + 1,
  };
}

const STATS_PIE = [
  { name: "Dépannage", value: 60, color: "#22D3D8" },
  { name: "Réseau", value: 25, color: "#FF7A45" },
  { name: "Dév. Web", value: 15, color: "#7C9CBF" },
];

const REVENUE = [
  { mois: "Mar", v: 1.8 }, { mois: "Avr", v: 2.1 }, { mois: "Mai", v: 1.9 },
  { mois: "Juin", v: 2.6 }, { mois: "Juil", v: 2.4 }, { mois: "Août", v: 3.1 },
];

/* ---------------------------------- RESPONSIVE ---------------------------------- */

// Les mises en page ci-dessous utilisent des styles inline (contrainte de
// l'environnement de prototypage d'origine) plutôt que des classes CSS —
// impossible donc de s'appuyer sur de simples media queries. Ce hook bascule
// certains styles clés (colonnes, direction flex) sous 860px de large.
function useIsMobile(breakpoint = 860) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < breakpoint);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

/* ---------------------------------- STYLE ---------------------------------- */

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
    .elma-root { --navy-950:#0A1628; --navy-900:#0F2340; --navy-800:#16345C; --navy-700:#1E4270;
      --teal-400:#22D3D8; --teal-300:#7EE8EA; --amber-500:#FF7A45; --mist-100:#EEF3F8; --mist-50:#F7FAFC;
      --slate-500:#6B7A90; --slate-300:#B7C4D6; --white:#FFFFFF;
      font-family:'Inter',sans-serif; color:var(--navy-950); background:var(--mist-100);
    }
    .elma-root .font-display { font-family:'Space Grotesk',sans-serif; }
    .elma-root .font-mono { font-family:'JetBrains Mono',monospace; }
    .elma-pulse { animation: elmaPulse 2s ease-in-out infinite; }
    @keyframes elmaPulse { 0%,100%{ opacity:1; transform:scale(1);} 50%{ opacity:.55; transform:scale(1.4);} }
    .elma-circuit { position:absolute; inset:0; opacity:.16; pointer-events:none; }
    .elma-card { background:var(--white); border:1px solid #E1E9F1; border-radius:14px; }
    .elma-btn-primary { background:var(--teal-400); color:var(--navy-950); font-weight:600; }
    .elma-btn-primary:hover { background:var(--teal-300); }
    .elma-btn-amber { background:var(--amber-500); color:#fff; font-weight:600; }
    .elma-btn-amber:hover { background:#ff8f63; }
    .elma-scroll::-webkit-scrollbar{width:6px;} .elma-scroll::-webkit-scrollbar-thumb{background:#CBD8E6;border-radius:4px;}
    @media (max-width: 860px) {
      .elma-hero-title { font-size: 32px !important; }
      .elma-section-pad { padding: 32px 16px !important; }
      .elma-grid-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    }
    @media (max-width: 520px) {
      .elma-hero-title { font-size: 26px !important; }
    }
  `}</style>
);

function CircuitBg() {
  return (
    <svg className="elma-circuit" viewBox="0 0 800 400" preserveAspectRatio="none">
      <g stroke="#22D3D8" strokeWidth="1" fill="none">
        <path d="M0 80 H180 L210 110 H400 L430 80 H620 L650 110 H800" />
        <path d="M0 260 H140 L170 230 H360 L390 260 H580 L610 230 H800" />
        <path d="M120 0 V60 M120 60 L150 60" />
        <path d="M420 0 V50 M420 50 L450 50" />
        <path d="M680 400 V330 M680 330 L650 330" />
      </g>
      {[[210,110],[430,80],[170,230],[390,260],[120,60],[450,50],[650,330]].map(([x,y],i)=>(
        <circle key={i} cx={x} cy={y} r="4" fill="#22D3D8" className="elma-pulse" style={{animationDelay:`${i*0.3}s`}} />
      ))}
    </svg>
  );
}

const LiveDot = () => (
  <span style={{position:"relative", display:"inline-flex", width:8, height:8}}>
    <span className="elma-pulse" style={{position:"absolute", inset:0, borderRadius:9999, background:"#22D3D8"}} />
    <span style={{position:"absolute", inset:0, borderRadius:9999, background:"#22D3D8"}} />
  </span>
);

/* ---------------------------------- ROLE SWITCHER ---------------------------------- */

function RoleSwitcher({ view, setView }) {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile(700);
  const tabs = [
    { id: "public", label: "Site public", short: "Site", icon: Home },
    { id: "client", label: "Espace Client", short: "Client", icon: MonitorSmartphone },
    { id: "admin", label: "Espace Admin", short: "Admin", icon: UserCog },
  ];
  return (
    <div style={{position:"sticky", top:0, zIndex:50, background:"var(--navy-950)"}} className="elma-root">
      <div style={{maxWidth:1200, margin:"0 auto", padding: isMobile ? "8px 12px" : "8px 20px", display:"flex", flexWrap:"wrap", alignItems:"center", gap:isMobile?8:16}}>
        <div style={{display:"flex", gap:4, flexWrap:"wrap"}}>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = view === t.id;
            return (
              <button key={t.id} onClick={() => setView(t.id)}
                style={{
                  display:"flex", alignItems:"center", gap:6, padding: isMobile ? "6px 8px" : "6px 12px", borderRadius:8,
                  fontSize:isMobile?11:13, fontWeight:600, border:"none", cursor:"pointer",
                  background: active ? "var(--teal-400)" : "transparent",
                  color: active ? "var(--navy-950)" : "var(--slate-300)",
                }}>
                <Icon size={14} /> {isMobile ? t.short : t.label}
              </button>
            );
          })}
        </div>
        <div style={{marginLeft: isMobile ? 0 : "auto", display:"flex", alignItems:"center", gap:10, width: isMobile ? "100%" : "auto", justifyContent: isMobile ? "space-between" : "flex-start"}}>
          {user ? (
            <>
              <span className="font-mono" style={{color:"var(--slate-300)", fontSize:11, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth: isMobile?140:"none"}}>{user.email} · {user.role}</span>
              <button onClick={logout} style={{display:"flex", alignItems:"center", gap:4, background:"none", border:"1px solid var(--navy-700)", borderRadius:8, padding:"5px 10px", fontSize:12, color:"var(--slate-300)", cursor:"pointer", flexShrink:0}}>
                <LogOut size={13} /> {!isMobile && "Déconnexion"}
              </button>
            </>
          ) : (
            <span className="font-mono" style={{color:"var(--slate-500)", fontSize:11}}>Non connecté</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- PUBLIC SITE ---------------------------------- */

function PublicSite({ onBook }) {
  const isMobile = useIsMobile();
  return (
    <div className="elma-root">
      <header style={{background:"var(--navy-950)", position:"relative", overflow:"hidden"}}>
        <CircuitBg />
        <div style={{maxWidth:1200, margin:"0 auto", padding: isMobile ? "14px 16px" : "18px 20px", position:"relative", zIndex:1, display:"flex", flexWrap:"wrap", gap:10, justifyContent:"space-between", alignItems:"center"}}>
          <div className="font-display" style={{color:"#fff", fontWeight:700, fontSize: isMobile?17:20}}>ELMA <span style={{color:"var(--teal-400)"}}>&amp; Frères</span></div>
          <button onClick={onBook} className="elma-btn-amber" style={{border:"none", borderRadius:8, padding: isMobile ? "8px 12px" : "9px 16px", fontSize: isMobile?12:13, display:"flex", alignItems:"center", gap:6, cursor:"pointer"}}>
            <Zap size={15} /> {isMobile ? "Urgence" : "Intervention urgente"}
          </button>
        </div>
        <div className="elma-section-pad" style={{maxWidth:1200, margin:"0 auto", padding: isMobile ? "36px 16px 56px" : "70px 20px 100px", position:"relative", zIndex:1}}>
          <div className="font-mono" style={{color:"var(--teal-300)", fontSize: isMobile?10:12, letterSpacing:2, marginBottom:14}}>SERVICES NUMÉRIQUES &amp; INFORMATIQUES — DAKAR</div>
          <h1 className="font-display elma-hero-title" style={{color:"#fff", fontSize: isMobile?30:44, lineHeight:1.15, maxWidth:640, fontWeight:700}}>
            Votre partenaire technologique de confiance
          </h1>
          <p style={{color:"var(--slate-300)", fontSize: isMobile?14:16, maxWidth:520, marginTop:16}}>
            Dépannage, réseau, cybersécurité et développement web — une prise en charge suivie en temps réel, à domicile ou en atelier.
          </p>
          <div style={{display:"flex", flexDirection: isMobile?"column":"row", gap:12, marginTop:28}}>
            <button onClick={onBook} className="elma-btn-primary" style={{border:"none", borderRadius:10, padding:"12px 22px", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8}}>
              Prendre rendez-vous <ArrowRight size={16} />
            </button>
            <a href="#services" style={{color:"#fff", border:"1px solid var(--navy-700)", borderRadius:10, padding:"12px 22px", fontSize:14, textDecoration:"none", textAlign:"center"}}>
              Voir les services
            </a>
          </div>
        </div>
      </header>

      <section id="services" className="elma-section-pad" style={{maxWidth:1200, margin:"0 auto", padding: isMobile ? "36px 16px" : "56px 20px"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28}}>
          <div>
            <div className="font-mono" style={{color:"var(--slate-500)", fontSize:12, letterSpacing:1}}>NOS PÔLES DE COMPÉTENCES</div>
            <h2 className="font-display" style={{fontSize: isMobile?22:28, marginTop:6}}>5 domaines, une seule équipe</h2>
          </div>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px,1fr))", gap:16}}>
          {SERVICES.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="elma-card" style={{padding:20}}>
                <div style={{width:38, height:38, borderRadius:9, background:"var(--navy-950)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14}}>
                  <Icon size={18} color="#22D3D8" />
                </div>
                <div style={{fontWeight:600, fontSize:15, marginBottom:6}}>{s.name}</div>
                <div style={{color:"var(--slate-500)", fontSize:13, lineHeight:1.5, marginBottom:12}}>{s.desc}</div>
                <div className="font-mono" style={{fontSize:12, color:"var(--navy-800)"}}>{s.price}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="elma-section-pad" style={{background:"var(--navy-900)", padding: isMobile ? "36px 0" : "56px 0"}}>
        <div style={{maxWidth:1200, margin:"0 auto", padding: isMobile ? "0 16px" : "0 20px", display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:isMobile?24:40, alignItems:"center"}}>
          <div>
            <div className="font-mono" style={{color:"var(--teal-300)", fontSize:12, letterSpacing:1}}>ESTIMATION</div>
            <h2 className="font-display" style={{color:"#fff", fontSize: isMobile?21:26, marginTop:6, marginBottom:14}}>Une fourchette de prix en 10 secondes</h2>
            <p style={{color:"var(--slate-300)", fontSize:14, lineHeight:1.6}}>
              Sélectionnez un service dans le catalogue ci-dessus : la fourchette tarifaire indicative s'affiche immédiatement.
              Le devis précis est confirmé après diagnostic par notre équipe.
            </p>
          </div>
          <div className="elma-card" style={{padding:24}}>
            <div style={{fontWeight:600, marginBottom:12, fontSize:14}}>Simulateur rapide</div>
            {SERVICES.slice(0,3).map(s => (
              <div key={s.id} style={{display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #EEF3F8", fontSize:13, gap:8}}>
                <span>{s.name}</span>
                <span className="font-mono" style={{color:"var(--navy-800)", flexShrink:0}}>{s.price}</span>
              </div>
            ))}
            <button onClick={onBook} className="elma-btn-primary" style={{width:"100%", marginTop:16, border:"none", borderRadius:8, padding:"11px", fontSize:13, cursor:"pointer"}}>
              Obtenir un devis précis
            </button>
          </div>
        </div>
      </section>

      <footer style={{background:"var(--navy-950)", color:"var(--slate-300)", padding: isMobile ? "22px 16px" : "28px 20px", textAlign:"center", fontSize:12}}>
        ELMA &amp; Frères — +221 78 310 46 84 — elmaamadou02@gmail.com
      </footer>
    </div>
  );
}

/* ---------------------------------- AUTH FORM ---------------------------------- */

// Formulaire de connexion / inscription réutilisé dans la réservation,
// l'espace client et l'espace admin. Appelle le vrai backend via AuthContext.
function AuthForm({ onSuccess, compact }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fields, setFields] = useState({ nom: "", prenom: "", email: "", telephone: "", motDePasse: "", adresse: "" });

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(fields.email, fields.motDePasse);
      } else {
        await register(fields);
      }
      onSuccess && onSuccess();
    } catch (err) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { padding: 10, borderRadius: 8, border: "1px solid #E1E9F1", fontSize: 13, width: "100%" };

  return (
    <div style={{ padding: compact ? 0 : 4 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#F1F5F9", borderRadius: 8, padding: 3 }}>
        {["login", "register"].map((m) => (
          <button key={m} onClick={() => setMode(m)} type="button" style={{
            flex: 1, padding: "8px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
            background: mode === m ? "#fff" : "transparent", color: mode === m ? "var(--navy-950)" : "var(--slate-500)" }}>
            {m === "login" ? "Se connecter" : "Créer un compte"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {mode === "register" && (
          <>
            <div style={{ display: "flex", gap: 10 }}>
              <input required placeholder="Prénom" value={fields.prenom} onChange={set("prenom")} style={inputStyle} />
              <input required placeholder="Nom" value={fields.nom} onChange={set("nom")} style={inputStyle} />
            </div>
            <input required placeholder="Téléphone (+221...)" value={fields.telephone} onChange={set("telephone")} style={inputStyle} />
          </>
        )}
        <input required type="email" placeholder="Email" value={fields.email} onChange={set("email")} style={inputStyle} />
        <input required type="password" placeholder="Mot de passe (8 caractères min.)" value={fields.motDePasse} onChange={set("motDePasse")} style={inputStyle} />
        {error && <div style={{ fontSize: 12, color: "#C4531A" }}>{error}</div>}
        <button disabled={loading} type="submit" className="elma-btn-primary" style={{ border: "none", borderRadius: 8, padding: "11px", fontSize: 13, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1 }}>
          {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}

/* ---------------------------------- BOOKING MODAL ---------------------------------- */

function BookingModal({ onClose, onSubmit }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [mode, setMode] = useState(null);
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [desc, setDesc] = useState("");
  const [ticket, setTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canNext = (step === 1 && service) || (step === 2 && mode && ((mode==="Domicile" && address && date) || (mode==="Atelier" && slot))) || step === 3;

  const finish = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createTicket({
        typeService: service.name,
        modeIntervention: mode.toLowerCase(),
        description: desc,
        adresseIntervention: mode === "Domicile" ? address : undefined,
        dateRdv: mode === "Domicile" && date ? date : undefined,
        plageHoraire: mode === "Atelier" ? slot : undefined,
      });
      setTicket(created);
      onSubmit(created);
      setStep(4);
    } catch (err) {
      setError(err.message || "Impossible de créer la demande. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  // Créer un ticket nécessite un compte (le backend l'exige) : tant que
  // l'utilisateur n'est pas connecté, on affiche le formulaire de connexion
  // à la place des étapes de réservation, puis on enchaîne automatiquement.
  if (!user) {
    return (
      <div style={{position:"fixed", inset:0, background:"rgba(10,22,40,.55)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:16}} onClick={onClose}>
        <div className="elma-root elma-card" style={{width:420, maxWidth:"100%", padding:0, overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
          <div style={{background:"var(--navy-950)", padding:"16px 22px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <div className="font-display" style={{color:"#fff", fontWeight:600, fontSize:15}}>Connectez-vous pour continuer</div>
            <button onClick={onClose} style={{background:"none", border:"none", cursor:"pointer"}}><X size={18} color="#B7C4D6" /></button>
          </div>
          <div style={{padding:22}}>
            <p style={{fontSize:12, color:"var(--slate-500)", marginBottom:14}}>Un compte client permet de suivre votre demande en temps réel et d'accéder à vos factures.</p>
            <AuthForm compact />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{position:"fixed", inset:0, background:"rgba(10,22,40,.55)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:16}} onClick={onClose}>
      <div className="elma-root elma-card" style={{width:520, maxWidth:"100%", padding:0, overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{background:"var(--navy-950)", padding:"16px 22px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div className="font-display" style={{color:"#fff", fontWeight:600, fontSize:15}}>Demande d'intervention</div>
          <button onClick={onClose} style={{background:"none", border:"none", cursor:"pointer"}}><X size={18} color="#B7C4D6" /></button>
        </div>
        <div style={{display:"flex", gap:4, padding:"12px 22px 0"}}>
          {[1,2,3,4].map(n => (
            <div key={n} style={{flex:1, height:3, borderRadius:2, background: n <= step ? "var(--teal-400)" : "#E1E9F1"}} />
          ))}
        </div>

        <div style={{padding:22, minHeight:260}}>
          {step === 1 && (
            <>
              <div style={{fontSize:13, color:"var(--slate-500)", marginBottom:12}}>1. Choisissez un service</div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
                {SERVICES.map(s => {
                  const Icon = s.icon; const active = service?.id === s.id;
                  return (
                    <button key={s.id} onClick={()=>setService(s)} style={{
                      textAlign:"left", padding:12, borderRadius:10, cursor:"pointer",
                      border: active ? "2px solid var(--teal-400)" : "1px solid #E1E9F1",
                      background: active ? "#EFFDFD" : "#fff"}}>
                      <Icon size={16} color="#0F2340" />
                      <div style={{fontSize:13, fontWeight:600, marginTop:6}}>{s.name}</div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{fontSize:13, color:"var(--slate-500)", marginBottom:12}}>2. Mode d'intervention</div>
              <div style={{display:"flex", gap:10, marginBottom:16}}>
                {["Domicile","Atelier"].map(m => (
                  <button key={m} onClick={()=>setMode(m)} style={{
                    flex:1, padding:"12px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:600,
                    border: mode===m ? "2px solid var(--teal-400)" : "1px solid #E1E9F1",
                    background: mode===m ? "#EFFDFD" : "#fff"}}>
                    {m === "Domicile" ? "À domicile / sur site" : "En atelier"}
                  </button>
                ))}
              </div>
              {mode === "Domicile" && (
                <div style={{display:"flex", flexDirection:"column", gap:10}}>
                  <label style={{fontSize:12, color:"var(--slate-500)", display:"flex", alignItems:"center", gap:6}}><MapPin size={13}/> Adresse</label>
                  <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Ex : Sacré-Cœur 3, Dakar" style={{padding:10, borderRadius:8, border:"1px solid #E1E9F1", fontSize:13}} />
                  <label style={{fontSize:12, color:"var(--slate-500)", display:"flex", alignItems:"center", gap:6}}><Calendar size={13}/> Date souhaitée</label>
                  <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{padding:10, borderRadius:8, border:"1px solid #E1E9F1", fontSize:13}} />
                </div>
              )}
              {mode === "Atelier" && (
                <div style={{display:"flex", flexDirection:"column", gap:10}}>
                  <label style={{fontSize:12, color:"var(--slate-500)", display:"flex", alignItems:"center", gap:6}}><Clock size={13}/> Créneau de dépôt</label>
                  <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                    {["09:00 – 11:00","11:00 – 13:00","14:00 – 16:00","16:00 – 18:00"].map(s => (
                      <button key={s} onClick={()=>setSlot(s)} style={{
                        padding:"8px 12px", borderRadius:8, fontSize:12, cursor:"pointer",
                        border: slot===s ? "2px solid var(--teal-400)" : "1px solid #E1E9F1",
                        background: slot===s ? "#EFFDFD" : "#fff"}}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div style={{fontSize:13, color:"var(--slate-500)", marginBottom:12}}>3. Décrivez le problème</div>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4} placeholder="Ex : L'ordinateur ne démarre plus depuis hier..." style={{width:"100%", padding:10, borderRadius:8, border:"1px solid #E1E9F1", fontSize:13, resize:"none"}} />
              <button style={{marginTop:10, display:"flex", alignItems:"center", gap:8, fontSize:12, color:"var(--slate-500)", background:"#F7FAFC", border:"1px dashed #CBD8E6", borderRadius:8, padding:"10px 14px", cursor:"pointer"}}>
                <Upload size={14} /> Joindre une photo ou capture d'écran
              </button>
            </>
          )}

          {step === 4 && ticket && (
            <div style={{textAlign:"center", padding:"10px 0"}}>
              <CheckCircle2 size={40} color="#22D3D8" style={{marginBottom:10}} />
              <div className="font-display" style={{fontSize:17, fontWeight:600}}>Demande enregistrée</div>
              <div className="font-mono" style={{fontSize:13, color:"var(--navy-800)", marginTop:6}}>{ticket.reference}</div>
              {mode === "Atelier" && (
                <div style={{margin:"18px auto 6px", width:120, height:120}}>
                  <QrPlaceholder seed={ticket.reference} />
                </div>
              )}
              <p style={{fontSize:12, color:"var(--slate-500)", marginTop:10}}>
                Suivez l'avancement dans votre espace client. Une notification vous sera envoyée à chaque changement de statut.
              </p>
            </div>
          )}
        </div>

        {step === 3 && error && (
          <div style={{padding:"0 22px 10px", fontSize:12, color:"#C4531A"}}>{error}</div>
        )}
        {step < 4 && (
          <div style={{display:"flex", justifyContent:"space-between", padding:"14px 22px", borderTop:"1px solid #EEF3F8"}}>
            <button onClick={()=> step>1 ? setStep(step-1) : onClose()} style={{background:"none", border:"none", color:"var(--slate-500)", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:4}}>
              <ChevronLeft size={14}/> {step>1 ? "Retour" : "Annuler"}
            </button>
            <button disabled={!canNext || submitting} onClick={()=> step<3 ? setStep(step+1) : finish()}
              className="elma-btn-primary" style={{border:"none", borderRadius:8, padding:"9px 18px", fontSize:13, cursor: (canNext && !submitting)?"pointer":"not-allowed", opacity: (canNext && !submitting)?1:.5}}>
              {step<3 ? "Continuer" : submitting ? "Envoi..." : "Confirmer la demande"}
            </button>
          </div>
        )}
        {step === 4 && (
          <div style={{padding:"14px 22px", borderTop:"1px solid #EEF3F8"}}>
            <button onClick={onClose} className="elma-btn-primary" style={{width:"100%", border:"none", borderRadius:8, padding:"10px", fontSize:13, cursor:"pointer"}}>Terminer</button>
          </div>
        )}
      </div>
    </div>
  );
}

function QrPlaceholder({ seed }) {
  const cells = useMemo(() => {
    let s = 0; for (const c of seed) s += c.charCodeAt(0);
    const rnd = (i) => ((s * (i+7)) % 97) / 97;
    return Array.from({length: 49}, (_,i) => rnd(i) > 0.5);
  }, [seed]);
  return (
    <svg viewBox="0 0 70 70" style={{width:"100%", height:"100%"}}>
      <rect width="70" height="70" fill="#fff" />
      {cells.map((on, i) => on && (
        <rect key={i} x={(i%7)*10} y={Math.floor(i/7)*10} width="10" height="10" fill="#0A1628" />
      ))}
    </svg>
  );
}

/* ---------------------------------- CLIENT SPACE ---------------------------------- */

const TIMELINE = ["À attribuer", "Assigné", "En cours", "Terminé"];

function ClientSpace() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("dashboard");
  const [myTickets, setMyTickets] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadTickets = async () => {
    try {
      const raw = await api.getTickets();
      const adapted = raw.map((t) => adaptTicket(t));
      setMyTickets(adapted);
      setActive((prev) => adapted.find((t) => t.uuid === prev?.uuid) || adapted[0] || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadTickets();
    const socket = connectSocket();
    socket.emit("session:page_change", { page: "/client/" + tab });
    const onStatusChange = () => loadTickets();
    socket.on("ticket:status_changed", onStatusChange);
    return () => socket.off("ticket:status_changed", onStatusChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  if (!user) {
    return (
      <div className="elma-root" style={{ display: "flex", justifyContent: "center", padding: "60px 20px", minHeight: "70vh" }}>
        <div className="elma-card" style={{ width: 380, padding: 24 }}>
          <div className="font-display" style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Espace Client</div>
          <p style={{ fontSize: 12, color: "var(--slate-500)", marginBottom: 16 }}>Connectez-vous pour suivre vos demandes.</p>
          <AuthForm compact />
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="elma-root" style={{ padding: 40, textAlign: "center", color: "var(--slate-500)", fontSize: 13 }}>Chargement de vos tickets...</div>;
  }

  return (
    <div className="elma-root" style={{display:isMobile?"block":"flex", minHeight:"70vh"}}>
      <aside style={isMobile
        ? {background:"var(--navy-950)", padding:"14px 10px", display:"flex", gap:6, overflowX:"auto"}
        : {width:220, background:"var(--navy-950)", padding:"20px 14px", flexShrink:0}}>
        {!isMobile && <div className="font-display" style={{color:"#fff", fontWeight:700, fontSize:16, marginBottom:22, padding:"0 8px"}}>ELMA <span style={{color:"var(--teal-400)"}}>Client</span></div>}
        {[
          {id:"dashboard", label:"Tableau de bord", icon:Home},
          {id:"tickets", label:"Mes tickets", icon:TicketIcon},
          {id:"factures", label:"Factures", icon:FileText},
          {id:"chat", label:"Messagerie", icon:MessageCircle},
        ].map(n => {
          const Icon = n.icon; const on = tab===n.id;
          return (
            <button key={n.id} onClick={()=>setTab(n.id)} style={isMobile
              ? {display:"flex", alignItems:"center", gap:6, padding:"8px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, whiteSpace:"nowrap", flexShrink:0, background: on ? "var(--navy-800)" : "transparent", color: on ? "#fff" : "var(--slate-300)"}
              : {display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 10px", marginBottom:4, borderRadius:8, border:"none", cursor:"pointer", fontSize:13, textAlign:"left", background: on ? "var(--navy-800)" : "transparent", color: on ? "#fff" : "var(--slate-300)"}}>
              <Icon size={15} /> {n.label}
            </button>
          );
        })}
      </aside>

      <main style={{flex:1, padding:isMobile?16:24, background:"var(--mist-100)"}}>
        {(tab==="dashboard" || tab==="tickets") && (
          <>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18}}>
              <h2 className="font-display" style={{fontSize:isMobile?17:20}}>Bonjour {user.email.split("@")[0]} 👋</h2>
              <Bell size={18} color="#6B7A90" />
            </div>
            {myTickets.length === 0 && (
              <div className="elma-card" style={{padding:18, marginBottom:18, fontSize:13, color:"var(--slate-500)"}}>
                Vous n'avez pas encore de demande. Utilisez « Intervention urgente » sur le site public pour en créer une.
              </div>
            )}
            <div style={{display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr", gap:18}}>
              <div>
                <div style={{fontSize:13, fontWeight:600, marginBottom:10, color:"var(--slate-500)"}}>MES DEMANDES</div>
                <div style={{display:"flex", flexDirection:"column", gap:10}}>
                  {myTickets.slice(0,5).map(t => (
                    <button key={t.id} onClick={()=>setActive(t)} className="elma-card" style={{textAlign:"left", padding:14, cursor:"pointer", border: active?.id===t.id ? "2px solid #22D3D8" : "1px solid #E1E9F1"}}>
                      <div style={{display:"flex", justifyContent:"space-between"}}>
                        <span className="font-mono" style={{fontSize:12, color:"var(--navy-800)"}}>{t.id}</span>
                        <StatusPill status={t.status} />
                      </div>
                      <div style={{fontWeight:600, fontSize:14, marginTop:6}}>{t.service}</div>
                      <div style={{fontSize:12, color:"var(--slate-500)", marginTop:2}}>{t.mode} · {t.date}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{fontSize:13, fontWeight:600, marginBottom:10, color:"var(--slate-500)"}}>DÉTAIL DU TICKET</div>
                {active && (
                  <div className="elma-card" style={{padding:18}}>
                    <div className="font-mono" style={{fontSize:12, color:"var(--navy-800)"}}>{active.id}</div>
                    <div style={{fontWeight:600, fontSize:15, marginTop:4}}>{active.service}</div>
                    <p style={{fontSize:12, color:"var(--slate-500)", marginTop:8, lineHeight:1.5}}>{active.desc}</p>

                    <div style={{marginTop:18}}>
                      {TIMELINE.map((s, i) => {
                        const idx = TIMELINE.indexOf(active.status);
                        const done = i <= idx;
                        return (
                          <div key={s} style={{display:"flex", alignItems:"center", gap:10, marginBottom:8}}>
                            <div style={{width:9, height:9, borderRadius:9, background: done ? "#22D3D8" : "#DCE5EF"}} />
                            <span style={{fontSize:12, color: done ? "var(--navy-950)" : "var(--slate-500)", fontWeight: done?600:400}}>{s}</span>
                          </div>
                        );
                      })}
                    </div>

                    {active.mode === "Atelier" && (
                      <div style={{marginTop:16, paddingTop:16, borderTop:"1px solid #EEF3F8", textAlign:"center"}}>
                        <div style={{width:90, height:90, margin:"0 auto"}}><QrPlaceholder seed={active.id} /></div>
                        <div style={{fontSize:11, color:"var(--slate-500)", marginTop:6}}>Ticket de dépôt</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {tab==="factures" && <FacturesTab />}

        {tab==="chat" && (
          <>
            <h2 className="font-display" style={{fontSize:20, marginBottom:16}}>Messagerie</h2>
            {!active ? (
              <div className="elma-card" style={{padding:18, fontSize:13, color:"var(--slate-500)"}}>Sélectionnez un ticket dans « Mes tickets » pour ouvrir sa conversation.</div>
            ) : (
              <TicketChat ticketUuid={active.uuid} currentUserId={user.userId} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Conversation liée à un ticket précis : historique via GET, envoi via POST,
// et réception instantanée des nouveaux messages via l'événement Socket.io
// `message:new` diffusé dans la room `ticket:{id}` (cf. realtime.gateway.ts).
function TicketChat({ ticketUuid, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getMessages(ticketUuid).then((msgs) => { if (active) { setMessages(msgs); setLoading(false); } });

    const socket = connectSocket();
    socket.emit("ticket:join", ticketUuid);
    const onNew = (msg) => { if (msg.ticketId === ticketUuid) setMessages((prev) => [...prev, msg]); };
    socket.on("message:new", onNew);
    return () => { active = false; socket.off("message:new", onNew); };
  }, [ticketUuid]);

  const send = async () => {
    if (!text.trim()) return;
    const contenu = text;
    setText("");
    await api.postMessage(ticketUuid, contenu);
  };

  return (
    <div className="elma-card" style={{padding:18, display:"flex", flexDirection:"column", gap:12, minHeight:260}}>
      {loading ? (
        <div style={{fontSize:12, color:"var(--slate-500)"}}>Chargement...</div>
      ) : messages.length === 0 ? (
        <div style={{fontSize:12, color:"var(--slate-500)"}}>Aucun message pour l'instant — écrivez au technicien ci-dessous.</div>
      ) : (
        messages.map((m) => {
          const mine = m.auteurId === currentUserId;
          return (
            <div key={m.id} style={{
              alignSelf: mine ? "flex-end" : "flex-start",
              background: mine ? "var(--navy-950)" : "#F1F5F9",
              color: mine ? "#fff" : "inherit",
              borderRadius: mine ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
              padding: "8px 12px", fontSize: 13, maxWidth: 280 }}>
              {m.contenu}
            </div>
          );
        })
      )}
      <div style={{marginTop:"auto", display:"flex", gap:8}}>
        <input value={text} onChange={(e)=>setText(e.target.value)} onKeyDown={(e)=> e.key==="Enter" && send()} placeholder="Écrire un message..." style={{flex:1, padding:10, borderRadius:8, border:"1px solid #E1E9F1", fontSize:13}} />
        <button onClick={send} className="elma-btn-primary" style={{border:"none", borderRadius:8, padding:"0 16px", cursor:"pointer"}}>Envoyer</button>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    "À attribuer": { bg:"#FFF1E9", c:"#C4531A" },
    "Assigné": { bg:"#EAF1FF", c:"#2A56A8" },
    "En cours": { bg:"#FFF7DB", c:"#96780B" },
    "Terminé": { bg:"#E6FBF7", c:"#0E8C7D" },
  };
  const s = map[status] || map["À attribuer"];
  return <span style={{fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, background:s.bg, color:s.c}}>{status.toUpperCase()}</span>;
}

// Liste des factures/devis réels de l'utilisateur connecté (client) ou de
// tout le monde (admin) — le PDF est généré à la volée côté serveur au clic.
function FacturesTab() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    api.getFactures().then((list) => { setFactures(list); setLoading(false); });
  }, []);

  const download = async (f) => {
    setDownloadingId(f.id);
    try {
      await api.downloadFacturePdf(f.id, `${f.type}-${f.ticket.reference}.pdf`);
    } catch (e) {
      alert(e.message);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <h2 className="font-display" style={{fontSize:20, marginBottom:16}}>Factures &amp; devis</h2>
      {loading ? (
        <div style={{fontSize:12, color:"var(--slate-500)"}}>Chargement...</div>
      ) : factures.length === 0 ? (
        <div className="elma-card" style={{padding:18, fontSize:13, color:"var(--slate-500)"}}>Aucune facture ou devis pour l'instant.</div>
      ) : (
        <div className="elma-card" style={{overflow:"hidden"}}>
          {factures.map((f,i) => (
            <div key={f.id} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom: i<factures.length-1?"1px solid #EEF3F8":"none", gap:10}}>
              <div>
                <div style={{fontWeight:600, fontSize:13}}>{f.ticket.typeService} · {f.type === "devis" ? "Devis" : "Facture"}</div>
                <div className="font-mono" style={{fontSize:11, color:"var(--slate-500)"}}>{f.ticket.reference} · {Number(f.montantTotal).toLocaleString("fr-FR")} FCFA</div>
              </div>
              <button onClick={()=>download(f)} disabled={downloadingId===f.id} style={{fontSize:12, color:"var(--navy-800)", background:"none", border:"1px solid #E1E9F1", borderRadius:6, padding:"6px 10px", cursor:"pointer", flexShrink:0}}>
                {downloadingId===f.id ? "..." : "Télécharger"}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ---------------------------------- ADMIN DASHBOARD ---------------------------------- */

const REPARTITION_COLORS = ["#22D3D8", "#FF7A45", "#7C9CBF", "#F5A623", "#9B7EDE"];

function AdminDashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState("overview");
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [overview, setOverview] = useState(null);
  const [repartition, setRepartition] = useState([]);
  const [loading, setLoading] = useState(true);

  const usersById = useMemo(() => {
    const map = {};
    users.forEach((u) => { map[u.id] = `${u.prenom} ${u.nom}`; });
    return map;
  }, [users]);

  const technicians = useMemo(() => users.filter((u) => u.role === "technicien"), [users]);
  const clients = useMemo(() => users.filter((u) => u.role === "client"), [users]);

  const loadTickets = async (usersMap) => {
    const raw = await api.getTickets();
    setTickets(raw.map((t) => adaptTicket(t, usersMap || usersById)));
  };
  const loadUsers = async () => {
    const list = await api.getUsers();
    setUsers(list);
    return list;
  };
  const loadSessions = async () => setSessions(await api.getSessions());
  const loadStats = async () => {
    const [ov, rep] = await Promise.all([api.getStatsOverview(), api.getStatsRepartition()]);
    setOverview(ov);
    setRepartition(rep);
  };

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    (async () => {
      const list = await loadUsers();
      const map = {};
      list.forEach((u) => { map[u.id] = `${u.prenom} ${u.nom}`; });
      await Promise.all([loadTickets(map), loadSessions(), loadStats()]);
      setLoading(false);
    })();

    const socket = connectSocket();
    socket.emit("session:page_change", { page: "/admin/" + tab });

    const onSessionsUpdate = (list) => setSessions(list);
    const onTicketChange = () => { loadTickets(); loadStats(); };
    socket.on("admin:sessions_update", onSessionsUpdate);
    socket.on("ticket:new", onTicketChange);
    socket.on("ticket:status_changed", onTicketChange);
    return () => {
      socket.off("admin:sessions_update", onSessionsUpdate);
      socket.off("ticket:new", onTicketChange);
      socket.off("ticket:status_changed", onTicketChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  const advance = async (uuid, dir) => {
    const t = tickets.find((x) => x.uuid === uuid);
    if (!t) return;
    const idx = STATUSES.indexOf(t.status);
    const next = Math.min(STATUSES.length - 1, Math.max(0, idx + dir));
    await api.updateTicketStatus(uuid, STATUS_VALUES[STATUSES[next]]);
    loadTickets();
    loadStats();
  };

  const assign = async (uuid, technicienId) => {
    if (!technicienId) return;
    await api.assignTechnician(uuid, technicienId);
    loadTickets();
  };

  const generateFacture = async (uuid) => {
    const montant = window.prompt("Montant de la facture (FCFA) ?");
    if (!montant || isNaN(Number(montant))) return;
    await api.createFacture({ ticketId: uuid, type: "facture", montantTotal: Number(montant) });
    alert("Facture générée — le client peut la télécharger dans son espace.");
  };

  const invalidate = async (socketId) => {
    await api.invalidateSession(socketId);
    loadSessions();
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="elma-root" style={{ display: "flex", justifyContent: "center", padding: "60px 20px", minHeight: "70vh" }}>
        <div className="elma-card" style={{ width: 380, padding: 24 }}>
          <div className="font-display" style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Espace Admin</div>
          <p style={{ fontSize: 12, color: "var(--slate-500)", marginBottom: 16 }}>
            {user ? "Ce compte n'a pas les droits administrateur." : "Connectez-vous avec un compte administrateur."}
          </p>
          {!user && <AuthForm compact />}
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="elma-root" style={{ padding: 40, textAlign: "center", color: "var(--slate-500)", fontSize: 13 }}>Chargement du tableau de bord...</div>;
  }

  return (
    <div className="elma-root" style={{display:isMobile?"block":"flex", minHeight:"70vh"}}>
      <aside style={isMobile
        ? {background:"var(--navy-950)", padding:"14px 10px", display:"flex", gap:6, overflowX:"auto"}
        : {width:220, background:"var(--navy-950)", padding:"20px 14px", flexShrink:0}}>
        {!isMobile && <div className="font-display" style={{color:"#fff", fontWeight:700, fontSize:16, marginBottom:22, padding:"0 8px"}}>ELMA <span style={{color:"var(--teal-400)"}}>Admin</span></div>}
        {[
          {id:"overview", label:"Vue d'ensemble", icon:Home},
          {id:"live", label:"Sessions en direct", icon:Radio},
          {id:"kanban", label:"Tickets", icon:LayoutGrid},
          {id:"clients", label:"Clients", icon:Users},
          {id:"stats", label:"Statistiques", icon:BarChart3},
        ].map(n => {
          const Icon = n.icon; const on = tab===n.id;
          return (
            <button key={n.id} onClick={()=>setTab(n.id)} style={isMobile
              ? {display:"flex", alignItems:"center", gap:6, padding:"8px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, whiteSpace:"nowrap", flexShrink:0, background: on ? "var(--navy-800)" : "transparent", color: on ? "#fff" : "var(--slate-300)"}
              : {display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 10px", marginBottom:4, borderRadius:8, border:"none", cursor:"pointer", fontSize:13, textAlign:"left", background: on ? "var(--navy-800)" : "transparent", color: on ? "#fff" : "var(--slate-300)"}}>
              <Icon size={15} /> {n.label}
              {n.id==="live" && <span style={{marginLeft:"auto"}}><LiveDot /></span>}
            </button>
          );
        })}
      </aside>

      <main style={{flex:1, padding:isMobile?14:24, background:"var(--mist-100)", overflow:"auto"}}>
        {tab==="overview" && (
          <>
            <h2 className="font-display" style={{fontSize:isMobile?17:20, marginBottom:16}}>Vue d'ensemble</h2>
            <div style={{display:"grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap:14, marginBottom:22}}>
              <Kpi label="Tickets ouverts" value={overview?.ticketsOuverts ?? 0} />
              <Kpi label="Revenu (factures payées)" value={`${Number(overview?.revenuTotal ?? 0).toLocaleString("fr-FR")} FCFA`} />
              <Kpi label="Techniciens actifs" value={overview?.techniciensActifs ?? technicians.length} />
              <Kpi label="En ligne" value={overview?.enLigne ?? sessions.length} live />
            </div>
            <div style={{display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16}}>
              <div className="elma-card" style={{padding:18}}>
                <div style={{fontSize:13, fontWeight:600, marginBottom:10}}>Répartition par service</div>
                {repartition.length === 0 ? (
                  <div style={{fontSize:12, color:"var(--slate-500)", padding:"40px 0", textAlign:"center"}}>Pas encore de tickets.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={repartition} dataKey="total" nameKey="service" innerRadius={40} outerRadius={70}>
                        {repartition.map((e,i)=><Cell key={i} fill={REPARTITION_COLORS[i % REPARTITION_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="elma-card" style={{padding:18}}>
                <div style={{fontSize:13, fontWeight:600, marginBottom:10}}>Tickets par statut</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={STATUSES.map(s => ({ statut: s, total: tickets.filter(t => t.status === s).length }))}>
                    <XAxis dataKey="statut" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis hide allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#22D3D8" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {tab==="live" && (
          <>
            <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:16}}>
              <h2 className="font-display" style={{fontSize:20}}>Sessions en direct</h2>
              <LiveDot /><span className="font-mono" style={{fontSize:12, color:"var(--slate-500)"}}>{sessions.length} connectés</span>
            </div>
            <div className="elma-card elma-grid-scroll" style={{overflow: isMobile ? "auto" : "hidden"}}>
              <div style={{minWidth: isMobile ? 620 : "auto"}}>
              <div style={{display:"grid", gridTemplateColumns:"1.2fr 0.8fr 1fr 1.2fr 0.8fr 0.8fr", padding:"10px 16px", fontSize:11, color:"var(--slate-500)", fontWeight:700, borderBottom:"1px solid #EEF3F8"}}>
                <span>NOM</span><span>RÔLE</span><span>IP</span><span>PAGE</span><span>DURÉE</span><span></span>
              </div>
              {sessions.length === 0 && (
                <div style={{padding:16, fontSize:12, color:"var(--slate-500)"}}>Personne d'autre n'est connecté pour l'instant.</div>
              )}
              {sessions.map(s => (
                <div key={s.socketId} style={{display:"grid", gridTemplateColumns:"1.2fr 0.8fr 1fr 1.2fr 0.8fr 0.8fr", alignItems:"center", padding:"10px 16px", fontSize:12, borderBottom:"1px solid #F5F8FB"}}>
                  <span style={{fontWeight:600}}>{s.nom}</span>
                  <span><span style={{fontSize:10, padding:"2px 7px", borderRadius:20, background:"#EAF1FF", color:"#2A56A8"}}>{s.role}</span></span>
                  <span className="font-mono" style={{color:"var(--slate-500)"}}>{s.ip}</span>
                  <span className="font-mono" style={{color:"var(--navy-800)"}}>{s.page}</span>
                  <span className="font-mono">{Math.max(0, Math.floor((Date.now() - s.connecteDepuis) / 60000))} min</span>
                  <button onClick={()=>invalidate(s.socketId)} style={{background:"none", border:"none", color:"#C4531A", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", gap:3}}>
                    <Trash2 size={12}/> Invalider
                  </button>
                </div>
              ))}
              </div>
            </div>
          </>
        )}

        {tab==="kanban" && (
          <>
            <h2 className="font-display" style={{fontSize:isMobile?17:20, marginBottom:16}}>Suivi des interventions</h2>
            <div className="elma-grid-scroll" style={{display:"grid", gridTemplateColumns: isMobile ? "repeat(4,220px)" : "repeat(4,1fr)", gap:12}}>
              {STATUSES.map((st, colIdx) => (
                <div key={st}>
                  <div style={{fontSize:12, fontWeight:700, color:"var(--slate-500)", marginBottom:8}}>{st.toUpperCase()} · {tickets.filter(t=>t.status===st).length}</div>
                  <div style={{display:"flex", flexDirection:"column", gap:8}}>
                    {tickets.filter(t=>t.status===st).map(t => (
                      <div key={t.uuid} className="elma-card" style={{padding:12}}>
                        <div className="font-mono" style={{fontSize:11, color:"var(--slate-500)"}}>{t.id}</div>
                        <div style={{fontWeight:600, fontSize:12.5, marginTop:4}}>{t.service}</div>
                        <div style={{fontSize:11, color:"var(--slate-500)", marginTop:2}}>{usersById[t.clientId] || "Client"} · {t.mode}</div>
                        {t.technicienId ? (
                          <div style={{fontSize:11, color:"var(--navy-800)", marginTop:6}}>👤 {t.tech}</div>
                        ) : colIdx===0 && technicians.length > 0 ? (
                          <select onChange={(e)=>assign(t.uuid, e.target.value)} defaultValue="" style={{marginTop:6, width:"100%", fontSize:11, padding:"4px 6px", borderRadius:6, border:"1px solid #E1E9F1"}}>
                            <option value="" disabled>Assigner un technicien</option>
                            {technicians.map(tech => <option key={tech.id} value={tech.id}>{tech.prenom} {tech.nom}</option>)}
                          </select>
                        ) : null}
                        <div style={{display:"flex", justifyContent:"space-between", marginTop:10}}>
                          <button disabled={colIdx===0} onClick={()=>advance(t.uuid,-1)} style={{background:"none", border:"1px solid #E1E9F1", borderRadius:6, cursor:colIdx===0?"default":"pointer", opacity:colIdx===0?.3:1, padding:"3px 6px"}}><ChevronLeft size={12}/></button>
                          <button disabled={colIdx===3} onClick={()=>advance(t.uuid,1)} style={{background:"none", border:"1px solid #E1E9F1", borderRadius:6, cursor:colIdx===3?"default":"pointer", opacity:colIdx===3?.3:1, padding:"3px 6px"}}><ChevronRight size={12}/></button>
                        </div>
                        {colIdx===3 && (
                          <button onClick={()=>generateFacture(t.uuid)} style={{width:"100%", marginTop:8, fontSize:11, padding:"5px", borderRadius:6, border:"1px solid #E1E9F1", background:"#F7FAFC", cursor:"pointer", color:"var(--navy-800)"}}>
                            Générer facture
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab==="clients" && (
          <>
            <h2 className="font-display" style={{fontSize:isMobile?17:20, marginBottom:16}}>Fichier clients</h2>
            <div className="elma-card elma-grid-scroll" style={{overflow: isMobile ? "auto" : "hidden"}}>
              <div style={{minWidth: isMobile ? 420 : "auto"}}>
              <div style={{display:"grid", gridTemplateColumns:"1.5fr 1fr 1fr", padding:"10px 16px", fontSize:11, color:"var(--slate-500)", fontWeight:700, borderBottom:"1px solid #EEF3F8"}}>
                <span>NOM</span><span>RÔLE</span><span>TICKETS</span>
              </div>
              {clients.length === 0 && (
                <div style={{padding:16, fontSize:12, color:"var(--slate-500)"}}>Aucun client inscrit pour l'instant.</div>
              )}
              {clients.map((c) => (
                <div key={c.id} style={{display:"grid", gridTemplateColumns:"1.5fr 1fr 1fr", alignItems:"center", padding:"10px 16px", fontSize:12, borderBottom:"1px solid #F5F8FB"}}>
                  <span style={{display:"flex", alignItems:"center", gap:8}}><Building2 size={13} color="#6B7A90"/>{c.prenom} {c.nom}</span>
                  <span style={{fontSize:10, padding:"2px 7px", borderRadius:20, background:"#EAF1FF", color:"#2A56A8", width:"fit-content"}}>Client</span>
                  <span className="font-mono">{tickets.filter(t=>t.clientId===c.id).length}</span>
                </div>
              ))}
              </div>
            </div>
          </>
        )}

        {tab==="stats" && (
          <>
            <h2 className="font-display" style={{fontSize:20, marginBottom:16}}>Statistiques</h2>
            <div className="elma-card" style={{padding:18, marginBottom:16}}>
              <div style={{fontSize:13, fontWeight:600, marginBottom:10}}>Tickets par statut</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={STATUSES.map(s => ({ statut: s, total: tickets.filter(t => t.status === s).length }))}>
                  <XAxis dataKey="statut" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0F2340" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="elma-card" style={{padding:18}}>
              <div style={{fontSize:13, fontWeight:600, marginBottom:10}}>Répartition des demandes par service</div>
              {repartition.length === 0 ? (
                <div style={{fontSize:12, color:"var(--slate-500)", padding:"40px 0", textAlign:"center"}}>Pas encore de tickets.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={repartition} dataKey="total" nameKey="service" outerRadius={80} label={(e)=>`${e.service} ${e.total}`}>
                      {repartition.map((e,i)=><Cell key={i} fill={REPARTITION_COLORS[i % REPARTITION_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Kpi({ label, value, live }) {
  return (
    <div className="elma-card" style={{padding:16}}>
      <div style={{fontSize:11, color:"var(--slate-500)", fontWeight:600, display:"flex", alignItems:"center", gap:6}}>{live && <LiveDot/>} {label}</div>
      <div className="font-display" style={{fontSize:24, fontWeight:700, marginTop:6}}>{value}</div>
    </div>
  );
}

/* ---------------------------------- APP ROOT ---------------------------------- */

function AppShell() {
  const [view, setView] = useState("public");
  const [showBooking, setShowBooking] = useState(false);

  return (
    <div style={{minHeight:"100vh"}}>
      <GlobalStyle />
      <RoleSwitcher view={view} setView={setView} />
      {view === "public" && <PublicSite onBook={() => setShowBooking(true)} />}
      {view === "client" && <ClientSpace />}
      {view === "admin" && <AdminDashboard />}
      {showBooking && <BookingModal onClose={() => setShowBooking(false)} onSubmit={() => {}} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
