export const MONTHLY_DATA = {
  baseline: [84425,87454,81614,89483,105275,151480,191916,171312,120251,106225,99644,93063],
  optimized: [74294,76960,71820,78745,84220,121184,153533,137050,96201,93478,87687,81895],
  labels: ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'],
  totalSaving: 245075,
  savingPercent: 17.7,
};

export const DEMO_ZONES = [
  { id:'z1', name:'Bloc Opératoire 1', type:'medical', status:'active', mode:'normal', temp:21, humidity:55, load_kw:18.4, priority:1 },
  { id:'z2', name:'Bloc Opératoire 2', type:'medical', status:'active', mode:'normal', temp:20, humidity:58, load_kw:16.1, priority:1 },
  { id:'z3', name:'Unité de Soins Intensifs', type:'medical', status:'active', mode:'normal', temp:22, humidity:50, load_kw:12.7, priority:1 },
  { id:'z4', name:'Salle de Réveil', type:'medical', status:'active', mode:'normal', temp:23, humidity:52, load_kw:8.2, priority:2 },
  { id:'z5', name:'Consultations Ext. — RDC', type:'admin', status:'active', mode:'eco', temp:25, humidity:60, load_kw:3.1, priority:3 },
  { id:'z6', name:'Administration', type:'admin', status:'inactive', mode:'off', temp:28, humidity:65, load_kw:0.4, priority:4 },
  { id:'z7', name:'Pharmacie', type:'support', status:'active', mode:'normal', temp:20, humidity:45, load_kw:5.6, priority:2 },
  { id:'z8', name:'Laboratoire', type:'support', status:'active', mode:'normal', temp:21, humidity:50, load_kw:7.3, priority:2 },
  { id:'z9', name:'Hall Principal', type:'common', status:'active', mode:'eco', temp:26, humidity:62, load_kw:1.8, priority:4 },
  { id:'z10', name:'Parking / Extérieur', type:'external', status:'active', mode:'auto', temp:null, humidity:null, load_kw:2.2, priority:5 },
];

export const DEMO_ALERTS = [
  { id:'a1', severity:'warning', zone:'Consultations Ext. — RDC', message:"Facteur de puissance cos φ = 0.71 (seuil: 0.85)", time:'14:32', acknowledged:false },
  { id:'a2', severity:'info', zone:'Administration', message:"Zone inactive depuis 47 min — passage en mode Éco automatique", time:'13:55', acknowledged:true },
  { id:'a3', severity:'critical', zone:'Groupe Électrogène', message:"Puissance souscrite à 89% — délestage imminent", time:'11:20', acknowledged:false },
  { id:'a4', severity:'info', zone:'Parking / Extérieur', message:"Éclairage externe activé (luminosité < seuil)", time:'07:45', acknowledged:true },
];

export const DEMO_LIVE = {
  total_power_kw: 87.3,
  today_kwh: 412.6,
  cos_phi: 0.87,
  active_alerts: 2,
  peak_kw_today: 134.2,
  subscribed_kw: 260,
};

export const DEMO_DEVICES = [
  { id:'d1', name:'CTA Bloc Principal', protocol:'BACnet', status:'online', type:'hvac' },
  { id:'d2', name:'Compteur STEG Principal', protocol:'Modbus', status:'online', type:'meter' },
  { id:'d3', name:'Chiller #1', protocol:'BACnet', status:'online', type:'hvac' },
  { id:'d4', name:'Chiller #2', protocol:'BACnet', status:'offline', type:'hvac' },
  { id:'d5', name:'Tableau Éclairage RDC', protocol:'Modbus', status:'online', type:'lighting' },
  { id:'d6', name:'Contrôle Accès — 6 Portes', protocol:'Wiegand/RS485', status:'online', type:'access' },
  { id:'d7', name:'Détection Incendie', protocol:'LonWorks', status:'online', type:'safety' },
  { id:'d8', name:'Ascenseurs x4', protocol:'Modbus', status:'online', type:'transport' },
];
