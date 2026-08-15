import React, { useState, useEffect, useMemo } from "react";
import {
  Wrench, Wifi, ShieldCheck, Code2, Settings2, Zap, MapPin, Calendar,
  Clock, Upload, MessageCircle, FileText, QrCode, Users, LayoutGrid,
  BarChart3, LogOut, ChevronRight, CheckCircle2, AlertCircle, Search,
  Bell, Plus, X, ArrowRight, Home, Ticket as TicketIcon, UserCog,
  Radio, Trash2, ChevronLeft, Building2, MonitorSmartphone
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

/* ---------------------------------- DATA ---------------------------------- */

const SERVICES = [
  { id: "dev", name: "Développement Web", icon: Code2, desc: "Sites vitrines, e-commerce, applications sur mesure.", price: "150 000 – 800 000 FCFA" },
  { id: "maint", name: "Maintenance Informatique", icon: Settings2, desc: "Maintenance préventive, curative, mises à jour.", price: "15 000 – 40 000 FCFA" },
  { id: "depan", name: "Dépannage Informatique", icon: Wrench, desc: "Diagnostic rapide, réparation matériel/logiciel.", price: "10 000 – 35 000 FCFA" },
  { id: "reseau", name: "Réseau & Télécom", icon: Wifi, desc: "Installation LAN/WAN, Wi-Fi, routeurs, VoIP.", price: "25 000 – 120 000 FCFA" },
  { id: "cyber", name: "CyberSécurité & Audit", icon: ShieldCheck, desc: "Audit de sécurité, pare-feu, protection des données.", price: "50 000 – 250 000 FCFA" },
];

const STATUSES = ["À attribuer", "Assigné", "En cours", "Terminé"];

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
  const tabs = [
    { id: "public", label: "Site public", icon: Home },
    { id: "client", label: "Espace Client", icon: MonitorSmartphone },
    { id: "admin", label: "Espace Admin", icon: UserCog },
  ];
  return (
    <div style={{position:"sticky", top:0, zIndex:50, background:"var(--navy-950)"}} className="elma-root">
      <div style={{maxWidth:1200, margin:"0 auto", padding:"8px 20px", display:"flex", alignItems:"center", gap:16}}>
        <span className="font-mono" style={{color:"var(--slate-300)", fontSize:11, letterSpacing:1}}>PROTOTYPE —</span>
        <div style={{display:"flex", gap:4}}>
          {tabs.map(t => {
            const Icon = t.icon;
            const active = view === t.id;
            return (
              <button key={t.id} onClick={() => setView(t.id)}
                style={{
                  display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8,
                  fontSize:13, fontWeight:600, border:"none", cursor:"pointer",
                  background: active ? "var(--teal-400)" : "transparent",
                  color: active ? "var(--navy-950)" : "var(--slate-300)",
                }}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- PUBLIC SITE ---------------------------------- */

function PublicSite({ onBook }) {
  return (
    <div className="elma-root">
      <header style={{background:"var(--navy-950)", position:"relative", overflow:"hidden"}}>
        <CircuitBg />
        <div style={{maxWidth:1200, margin:"0 auto", padding:"18px 20px", position:"relative", zIndex:1, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div className="font-display" style={{color:"#fff", fontWeight:700, fontSize:20}}>ELMA <span style={{color:"var(--teal-400)"}}>&amp; Frères</span></div>
          <button onClick={onBook} className="elma-btn-amber" style={{border:"none", borderRadius:8, padding:"9px 16px", fontSize:13, display:"flex", alignItems:"center", gap:6, cursor:"pointer"}}>
            <Zap size={15} /> Intervention urgente
          </button>
        </div>
        <div style={{maxWidth:1200, margin:"0 auto", padding:"70px 20px 100px", position:"relative", zIndex:1}}>
          <div className="font-mono" style={{color:"var(--teal-300)", fontSize:12, letterSpacing:2, marginBottom:14}}>SERVICES NUMÉRIQUES &amp; INFORMATIQUES — DAKAR</div>
          <h1 className="font-display" style={{color:"#fff", fontSize:44, lineHeight:1.1, maxWidth:640, fontWeight:700}}>
            Votre partenaire technologique de confiance
          </h1>
          <p style={{color:"var(--slate-300)", fontSize:16, maxWidth:520, marginTop:16}}>
            Dépannage, réseau, cybersécurité et développement web — une prise en charge suivie en temps réel, à domicile ou en atelier.
          </p>
          <div style={{display:"flex", gap:12, marginTop:28}}>
            <button onClick={onBook} className="elma-btn-primary" style={{border:"none", borderRadius:10, padding:"12px 22px", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:8}}>
              Prendre rendez-vous <ArrowRight size={16} />
            </button>
            <a href="#services" style={{color:"#fff", border:"1px solid var(--navy-700)", borderRadius:10, padding:"12px 22px", fontSize:14, textDecoration:"none"}}>
              Voir les services
            </a>
          </div>
        </div>
      </header>

      <section id="services" style={{maxWidth:1200, margin:"0 auto", padding:"56px 20px"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28}}>
          <div>
            <div className="font-mono" style={{color:"var(--slate-500)", fontSize:12, letterSpacing:1}}>NOS PÔLES DE COMPÉTENCES</div>
            <h2 className="font-display" style={{fontSize:28, marginTop:6}}>5 domaines, une seule équipe</h2>
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

      <section style={{background:"var(--navy-900)", padding:"56px 0"}}>
        <div style={{maxWidth:1200, margin:"0 auto", padding:"0 20px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:40, alignItems:"center"}}>
          <div>
            <div className="font-mono" style={{color:"var(--teal-300)", fontSize:12, letterSpacing:1}}>ESTIMATION</div>
            <h2 className="font-display" style={{color:"#fff", fontSize:26, marginTop:6, marginBottom:14}}>Une fourchette de prix en 10 secondes</h2>
            <p style={{color:"var(--slate-300)", fontSize:14, lineHeight:1.6}}>
              Sélectionnez un service dans le catalogue ci-dessus : la fourchette tarifaire indicative s'affiche immédiatement.
              Le devis précis est confirmé après diagnostic par notre équipe.
            </p>
          </div>
          <div className="elma-card" style={{padding:24}}>
            <div style={{fontWeight:600, marginBottom:12, fontSize:14}}>Simulateur rapide</div>
            {SERVICES.slice(0,3).map(s => (
              <div key={s.id} style={{display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #EEF3F8", fontSize:13}}>
                <span>{s.name}</span>
                <span className="font-mono" style={{color:"var(--navy-800)"}}>{s.price}</span>
              </div>
            ))}
            <button onClick={onBook} className="elma-btn-primary" style={{width:"100%", marginTop:16, border:"none", borderRadius:8, padding:"11px", fontSize:13, cursor:"pointer"}}>
              Obtenir un devis précis
            </button>
          </div>
        </div>
      </section>

      <footer style={{background:"var(--navy-950)", color:"var(--slate-300)", padding:"28px 20px", textAlign:"center", fontSize:12}}>
        ELMA &amp; Frères — +221 78 310 46 84 — elmaamadou02@gmail.com
      </footer>
    </div>
  );
}

/* ---------------------------------- BOOKING MODAL ---------------------------------- */

function BookingModal({ onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [mode, setMode] = useState(null);
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [desc, setDesc] = useState("");
  const [ticket, setTicket] = useState(null);

  const canNext = (step === 1 && service) || (step === 2 && mode && ((mode==="Domicile" && address && date) || (mode==="Atelier" && slot))) || step === 3;

  const finish = () => {
    const t = { id: `ELMA-${Math.floor(2026000 + Math.random()*900)}`, client: "Vous", service: service.name, mode, status: "À attribuer", tech: null, date: date || "Aujourd'hui", desc };
    setTicket(t);
    onSubmit(t);
    setStep(4);
  };

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
              <div className="font-mono" style={{fontSize:13, color:"var(--navy-800)", marginTop:6}}>{ticket.id}</div>
              {mode === "Atelier" && (
                <div style={{margin:"18px auto 6px", width:120, height:120}}>
                  <QrPlaceholder seed={ticket.id} />
                </div>
              )}
              <p style={{fontSize:12, color:"var(--slate-500)", marginTop:10}}>
                Suivez l'avancement dans votre espace client. Une notification vous sera envoyée à chaque changement de statut.
              </p>
            </div>
          )}
        </div>

        {step < 4 && (
          <div style={{display:"flex", justifyContent:"space-between", padding:"14px 22px", borderTop:"1px solid #EEF3F8"}}>
            <button onClick={()=> step>1 ? setStep(step-1) : onClose()} style={{background:"none", border:"none", color:"var(--slate-500)", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:4}}>
              <ChevronLeft size={14}/> {step>1 ? "Retour" : "Annuler"}
            </button>
            <button disabled={!canNext} onClick={()=> step<3 ? setStep(step+1) : finish()}
              className="elma-btn-primary" style={{border:"none", borderRadius:8, padding:"9px 18px", fontSize:13, cursor: canNext?"pointer":"not-allowed", opacity: canNext?1:.5}}>
              {step<3 ? "Continuer" : "Confirmer la demande"}
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

function ClientSpace({ tickets }) {
  const [tab, setTab] = useState("dashboard");
  const myTickets = tickets;
  const [active, setActive] = useState(myTickets[0]);

  return (
    <div className="elma-root" style={{display:"flex", minHeight:"70vh"}}>
      <aside style={{width:220, background:"var(--navy-950)", padding:"20px 14px", flexShrink:0}}>
        <div className="font-display" style={{color:"#fff", fontWeight:700, fontSize:16, marginBottom:22, padding:"0 8px"}}>ELMA <span style={{color:"var(--teal-400)"}}>Client</span></div>
        {[
          {id:"dashboard", label:"Tableau de bord", icon:Home},
          {id:"tickets", label:"Mes tickets", icon:TicketIcon},
          {id:"factures", label:"Factures", icon:FileText},
          {id:"chat", label:"Messagerie", icon:MessageCircle},
        ].map(n => {
          const Icon = n.icon; const on = tab===n.id;
          return (
            <button key={n.id} onClick={()=>setTab(n.id)} style={{
              display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 10px", marginBottom:4,
              borderRadius:8, border:"none", cursor:"pointer", fontSize:13, textAlign:"left",
              background: on ? "var(--navy-800)" : "transparent", color: on ? "#fff" : "var(--slate-300)"}}>
              <Icon size={15} /> {n.label}
            </button>
          );
        })}
      </aside>

      <main style={{flex:1, padding:24, background:"var(--mist-100)"}}>
        {(tab==="dashboard" || tab==="tickets") && (
          <>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18}}>
              <h2 className="font-display" style={{fontSize:20}}>Bonjour Ibrahima 👋</h2>
              <Bell size={18} color="#6B7A90" />
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1.1fr 0.9fr", gap:18}}>
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

        {tab==="factures" && (
          <>
            <h2 className="font-display" style={{fontSize:20, marginBottom:16}}>Factures &amp; devis</h2>
            <div className="elma-card" style={{overflow:"hidden"}}>
              {myTickets.slice(0,5).map((t,i) => (
                <div key={t.id} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom: i<4?"1px solid #EEF3F8":"none"}}>
                  <div>
                    <div style={{fontWeight:600, fontSize:13}}>{t.service}</div>
                    <div className="font-mono" style={{fontSize:11, color:"var(--slate-500)"}}>{t.id}.pdf</div>
                  </div>
                  <button style={{fontSize:12, color:"var(--navy-800)", background:"none", border:"1px solid #E1E9F1", borderRadius:6, padding:"6px 10px", cursor:"pointer"}}>Télécharger</button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab==="chat" && (
          <>
            <h2 className="font-display" style={{fontSize:20, marginBottom:16}}>Messagerie</h2>
            <div className="elma-card" style={{padding:18, display:"flex", flexDirection:"column", gap:12, minHeight:260}}>
              <div style={{alignSelf:"flex-start", background:"#F1F5F9", borderRadius:"10px 10px 10px 2px", padding:"8px 12px", fontSize:13, maxWidth:280}}>
                Bonjour, votre technicien Moussa Diop est en route pour l'intervention.
              </div>
              <div style={{alignSelf:"flex-end", background:"var(--navy-950)", color:"#fff", borderRadius:"10px 10px 2px 10px", padding:"8px 12px", fontSize:13, maxWidth:280}}>
                Merci, je suis disponible dès 14h.
              </div>
              <div style={{marginTop:"auto", display:"flex", gap:8}}>
                <input placeholder="Écrire un message..." style={{flex:1, padding:10, borderRadius:8, border:"1px solid #E1E9F1", fontSize:13}} />
                <button className="elma-btn-primary" style={{border:"none", borderRadius:8, padding:"0 16px", cursor:"pointer"}}>Envoyer</button>
              </div>
            </div>
          </>
        )}
      </main>
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

/* ---------------------------------- ADMIN DASHBOARD ---------------------------------- */

function AdminDashboard({ tickets, setTickets, sessions }) {
  const [tab, setTab] = useState("overview");

  const advance = (id, dir) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t;
      const idx = STATUSES.indexOf(t.status);
      const next = Math.min(STATUSES.length-1, Math.max(0, idx + dir));
      return { ...t, status: STATUSES[next], tech: next>0 ? (t.tech||TECHS[0]) : t.tech };
    }));
  };

  return (
    <div className="elma-root" style={{display:"flex", minHeight:"70vh"}}>
      <aside style={{width:220, background:"var(--navy-950)", padding:"20px 14px", flexShrink:0}}>
        <div className="font-display" style={{color:"#fff", fontWeight:700, fontSize:16, marginBottom:22, padding:"0 8px"}}>ELMA <span style={{color:"var(--teal-400)"}}>Admin</span></div>
        {[
          {id:"overview", label:"Vue d'ensemble", icon:Home},
          {id:"live", label:"Sessions en direct", icon:Radio},
          {id:"kanban", label:"Tickets", icon:LayoutGrid},
          {id:"clients", label:"Clients", icon:Users},
          {id:"stats", label:"Statistiques", icon:BarChart3},
        ].map(n => {
          const Icon = n.icon; const on = tab===n.id;
          return (
            <button key={n.id} onClick={()=>setTab(n.id)} style={{
              display:"flex", alignItems:"center", gap:10, width:"100%", padding:"10px 10px", marginBottom:4,
              borderRadius:8, border:"none", cursor:"pointer", fontSize:13, textAlign:"left",
              background: on ? "var(--navy-800)" : "transparent", color: on ? "#fff" : "var(--slate-300)"}}>
              <Icon size={15} /> {n.label}
              {n.id==="live" && <span style={{marginLeft:"auto"}}><LiveDot /></span>}
            </button>
          );
        })}
      </aside>

      <main style={{flex:1, padding:24, background:"var(--mist-100)", overflow:"auto"}}>
        {tab==="overview" && (
          <>
            <h2 className="font-display" style={{fontSize:20, marginBottom:16}}>Vue d'ensemble</h2>
            <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22}}>
              <Kpi label="Tickets ouverts" value={tickets.filter(t=>t.status!=="Terminé").length} />
              <Kpi label="Revenu du mois" value="3,1M FCFA" />
              <Kpi label="Techniciens actifs" value={TECHS.length} />
              <Kpi label="En ligne" value={sessions.length} live />
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
              <div className="elma-card" style={{padding:18}}>
                <div style={{fontSize:13, fontWeight:600, marginBottom:10}}>Répartition par service</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={STATS_PIE} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                      {STATS_PIE.map((e,i)=><Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="elma-card" style={{padding:18}}>
                <div style={{fontSize:13, fontWeight:600, marginBottom:10}}>Revenu mensuel (M FCFA)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={REVENUE}>
                    <XAxis dataKey="mois" fontSize={11} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="v" fill="#22D3D8" radius={[4,4,0,0]} />
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
            <div className="elma-card" style={{overflow:"hidden"}}>
              <div style={{display:"grid", gridTemplateColumns:"1.2fr 0.8fr 1fr 1.2fr 0.8fr 0.8fr", padding:"10px 16px", fontSize:11, color:"var(--slate-500)", fontWeight:700, borderBottom:"1px solid #EEF3F8"}}>
                <span>NOM</span><span>RÔLE</span><span>IP</span><span>PAGE</span><span>DURÉE</span><span></span>
              </div>
              {sessions.map(s => (
                <div key={s.id} style={{display:"grid", gridTemplateColumns:"1.2fr 0.8fr 1fr 1.2fr 0.8fr 0.8fr", alignItems:"center", padding:"10px 16px", fontSize:12, borderBottom:"1px solid #F5F8FB"}}>
                  <span style={{fontWeight:600}}>{s.name}</span>
                  <span><span style={{fontSize:10, padding:"2px 7px", borderRadius:20, background:"#EAF1FF", color:"#2A56A8"}}>{s.role}</span></span>
                  <span className="font-mono" style={{color:"var(--slate-500)"}}>{s.ip}</span>
                  <span className="font-mono" style={{color:"var(--navy-800)"}}>{s.page}</span>
                  <span className="font-mono">{s.duration} min</span>
                  <button style={{background:"none", border:"none", color:"#C4531A", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", gap:3}}>
                    <Trash2 size={12}/> Invalider
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab==="kanban" && (
          <>
            <h2 className="font-display" style={{fontSize:20, marginBottom:16}}>Suivi des interventions</h2>
            <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12}}>
              {STATUSES.map((st, colIdx) => (
                <div key={st}>
                  <div style={{fontSize:12, fontWeight:700, color:"var(--slate-500)", marginBottom:8}}>{st.toUpperCase()} · {tickets.filter(t=>t.status===st).length}</div>
                  <div style={{display:"flex", flexDirection:"column", gap:8}}>
                    {tickets.filter(t=>t.status===st).map(t => (
                      <div key={t.id} className="elma-card" style={{padding:12}}>
                        <div className="font-mono" style={{fontSize:11, color:"var(--slate-500)"}}>{t.id}</div>
                        <div style={{fontWeight:600, fontSize:12.5, marginTop:4}}>{t.service}</div>
                        <div style={{fontSize:11, color:"var(--slate-500)", marginTop:2}}>{t.client} · {t.mode}</div>
                        {t.tech && <div style={{fontSize:11, color:"var(--navy-800)", marginTop:6}}>👤 {t.tech}</div>}
                        <div style={{display:"flex", justifyContent:"space-between", marginTop:10}}>
                          <button disabled={colIdx===0} onClick={()=>advance(t.id,-1)} style={{background:"none", border:"1px solid #E1E9F1", borderRadius:6, cursor:colIdx===0?"default":"pointer", opacity:colIdx===0?.3:1, padding:"3px 6px"}}><ChevronLeft size={12}/></button>
                          <button disabled={colIdx===3} onClick={()=>advance(t.id,1)} style={{background:"none", border:"1px solid #E1E9F1", borderRadius:6, cursor:colIdx===3?"default":"pointer", opacity:colIdx===3?.3:1, padding:"3px 6px"}}><ChevronRight size={12}/></button>
                        </div>
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
            <h2 className="font-display" style={{fontSize:20, marginBottom:16}}>Fichier clients</h2>
            <div className="elma-card" style={{overflow:"hidden"}}>
              <div style={{display:"grid", gridTemplateColumns:"1.5fr 1fr 1fr", padding:"10px 16px", fontSize:11, color:"var(--slate-500)", fontWeight:700, borderBottom:"1px solid #EEF3F8"}}>
                <span>NOM</span><span>RÔLE</span><span>TICKETS</span>
              </div>
              {CLIENT_NAMES.map((n,i) => (
                <div key={n} style={{display:"grid", gridTemplateColumns:"1.5fr 1fr 1fr", alignItems:"center", padding:"10px 16px", fontSize:12, borderBottom:"1px solid #F5F8FB"}}>
                  <span style={{display:"flex", alignItems:"center", gap:8}}><Building2 size={13} color="#6B7A90"/>{n}</span>
                  <span style={{fontSize:10, padding:"2px 7px", borderRadius:20, background:"#EAF1FF", color:"#2A56A8", width:"fit-content"}}>Client</span>
                  <span className="font-mono">{tickets.filter(t=>t.client===n).length}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab==="stats" && (
          <>
            <h2 className="font-display" style={{fontSize:20, marginBottom:16}}>Statistiques</h2>
            <div className="elma-card" style={{padding:18, marginBottom:16}}>
              <div style={{fontSize:13, fontWeight:600, marginBottom:10}}>Revenu mensuel (M FCFA)</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={REVENUE}>
                  <XAxis dataKey="mois" fontSize={11} axisLine={false} tickLine={false} />
                  <YAxis fontSize={11} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="v" fill="#0F2340" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="elma-card" style={{padding:18}}>
              <div style={{fontSize:13, fontWeight:600, marginBottom:10}}>Répartition des demandes</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={STATS_PIE} dataKey="value" nameKey="name" outerRadius={80} label={(e)=>`${e.name} ${e.value}%`}>
                    {STATS_PIE.map((e,i)=><Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
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

export default function App() {
  const [view, setView] = useState("public");
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [showBooking, setShowBooking] = useState(false);
  const [sessions, setSessions] = useState(Array.from({length:4}, (_,i)=>randomSession(i)));

  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(prev => {
        const copy = prev.map(s => ({...s, duration: s.duration + (Math.random()>0.5?1:0)}));
        if (Math.random() > 0.6 && copy.length < 7) copy.push(randomSession(Date.now()));
        if (Math.random() > 0.8 && copy.length > 3) copy.shift();
        return copy;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{minHeight:"100vh"}}>
      <GlobalStyle />
      <RoleSwitcher view={view} setView={setView} />
      {view === "public" && <PublicSite onBook={() => setShowBooking(true)} />}
      {view === "client" && <ClientSpace tickets={tickets} />}
      {view === "admin" && <AdminDashboard tickets={tickets} setTickets={setTickets} sessions={sessions} />}
      {showBooking && (
        <BookingModal
          onClose={() => setShowBooking(false)}
          onSubmit={(t) => setTickets(prev => [t, ...prev])}
        />
      )}
    </div>
  );
}
