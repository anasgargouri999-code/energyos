export const MONTHLY_DATA = {
  baseline: [84425,87454,81614,89483,105275,151480,191916,171312,120251,106225,99644,93063],
  optimized: [74294,76960,71820,78745,84220,121184,153533,137050,96201,93478,87687,81895],
  saving: [10131, 10494, 9794, 10738, 21055, 30296, 38383, 34262, 24050, 12747, 11957, 11168],
  bills: [31756213, 32201289, 30306276, 32957503, 37954195, 58471677, 75315763, 62680412, 43292035, 52680412, 43292035, 38286092],
  labels: ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'],
  totalSaving: 245075,
  savingPercent: 17.7,
};

export const DEMO_ZONES = [
  {
    id: 'z1',
    name: 'Bloc Opératoire 1',
    type: 'medical',
    status: 'active',
    mode: 'normal',
    temp: 21,
    humidity: 55,
    load_kw: 18.4,
    priority: 1,
    devices: [
      { id: 'd1', name: 'CTA Bloc Principal', protocol: 'BACnet', status: 'online', type: 'hvac', load_rating_kw: 18.4 },
      { id: 'd2', name: 'Éclairage Scialytique Bloc 1', protocol: 'Modbus', status: 'online', type: 'lighting', load_rating_kw: 2.5 },
      { id: 'd3', name: 'Moniteurs Patient Bloc 1', protocol: 'Modbus', status: 'online', type: 'safety', load_rating_kw: 1.2 },
      { id: 'd4', name: 'Traitement Air HEPA Bloc 1', protocol: 'BACnet', status: 'online', type: 'hvac', load_rating_kw: 4.5 }
    ]
  },
  {
    id: 'z2',
    name: 'Bloc Opératoire 2',
    type: 'medical',
    status: 'active',
    mode: 'normal',
    temp: 20,
    humidity: 58,
    load_kw: 16.1,
    priority: 1,
    devices: [
      { id: 'd5', name: 'CTA Bloc Secondaire', protocol: 'BACnet', status: 'online', type: 'hvac', load_rating_kw: 16.1 },
      { id: 'd6', name: 'Éclairage Scialytique Bloc 2', protocol: 'Modbus', status: 'online', type: 'lighting', load_rating_kw: 2.2 },
      { id: 'd7', name: 'Console Anesthésie Bloc 2', protocol: 'Modbus', status: 'online', type: 'safety', load_rating_kw: 1.5 }
    ]
  },
  {
    id: 'z3',
    name: 'Unité de Soins Intensifs',
    type: 'medical',
    status: 'active',
    mode: 'normal',
    temp: 22,
    humidity: 50,
    load_kw: 12.7,
    priority: 1,
    devices: [
      { id: 'd8', name: 'Chiller Principal #1', protocol: 'BACnet', status: 'online', type: 'hvac', load_rating_kw: 120.0 },
      { id: 'd9', name: 'Centrale Monitoring USI', protocol: 'BACnet', status: 'online', type: 'safety', load_rating_kw: 3.5 }
    ]
  },
  {
    id: 'z4',
    name: 'Salle de Réveil',
    type: 'medical',
    status: 'active',
    mode: 'normal',
    temp: 23,
    humidity: 52,
    load_kw: 8.2,
    priority: 2,
    devices: [
      { id: 'd10', name: 'Chiller Secours #2', protocol: 'BACnet', status: 'offline', type: 'hvac', load_rating_kw: 120.0 },
      { id: 'd11', name: 'Rampe Oxygène & Monitor', protocol: 'Modbus', status: 'online', type: 'safety', load_rating_kw: 1.8 }
    ]
  },
  {
    id: 'z5',
    name: 'Consultations Ext. — RDC',
    type: 'admin',
    status: 'active',
    mode: 'eco',
    temp: 25,
    humidity: 60,
    load_kw: 3.1,
    priority: 3,
    devices: [
      { id: 'd12', name: 'Tableau Éclairage RDC', protocol: 'Modbus', status: 'online', type: 'lighting', load_rating_kw: 8.0 },
      { id: 'd13', name: 'Ventilo-convecteur Hall RDC', protocol: 'BACnet', status: 'online', type: 'hvac', load_rating_kw: 2.8 }
    ]
  },
  {
    id: 'z6',
    name: 'Administration',
    type: 'admin',
    status: 'inactive',
    mode: 'off',
    temp: 28,
    humidity: 65,
    load_kw: 0.4,
    priority: 4,
    devices: [
      { id: 'd14', name: 'Contrôle Accès — 6 Portes', protocol: 'Wiegand/RS485', status: 'online', type: 'access', load_rating_kw: 0.8 },
      { id: 'd15', name: 'Climatiseur Split Bureau 1', protocol: 'Modbus', status: 'offline', type: 'hvac', load_rating_kw: 1.5 }
    ]
  },
  {
    id: 'z7',
    name: 'Pharmacie',
    type: 'support',
    status: 'active',
    mode: 'normal',
    temp: 20,
    humidity: 45,
    load_kw: 5.6,
    priority: 2,
    devices: [
      { id: 'd16', name: 'Détection Incendie Centrale', protocol: 'LonWorks', status: 'online', type: 'safety', load_rating_kw: 0.5 },
      { id: 'd17', name: 'Réfrigérateur Vaccins Pharmacie', protocol: 'Modbus', status: 'online', type: 'safety', load_rating_kw: 2.0 }
    ]
  },
  {
    id: 'z8',
    name: 'Laboratoire',
    type: 'support',
    status: 'active',
    mode: 'normal',
    temp: 21,
    humidity: 50,
    load_kw: 7.3,
    priority: 2,
    devices: [
      { id: 'd18', name: 'Ascenseurs Principal x4', protocol: 'Modbus', status: 'online', type: 'transport', load_rating_kw: 30.0 },
      { id: 'd19', name: 'Hotte Biosécurité Labo', protocol: 'Modbus', status: 'online', type: 'safety', load_rating_kw: 3.2 }
    ]
  },
  {
    id: 'z9',
    name: 'Hall Principal',
    type: 'common',
    status: 'active',
    mode: 'eco',
    temp: 26,
    humidity: 62,
    load_kw: 1.8,
    priority: 4,
    devices: [
      { id: 'd20', name: 'Compteur STEG Entrée', protocol: 'Modbus', status: 'online', type: 'meter', load_rating_kw: 0.1 },
      { id: 'd21', name: 'Éclairage Façade & Enseigne', protocol: 'Modbus', status: 'online', type: 'lighting', load_rating_kw: 4.5 }
    ]
  },
  {
    id: 'z10',
    name: 'Parking / Extérieur',
    type: 'external',
    status: 'active',
    mode: 'auto',
    temp: null,
    humidity: null,
    load_kw: 2.2,
    priority: 5,
    devices: [
      { id: 'd22', name: 'Projecteurs LED Parking', protocol: 'Modbus', status: 'online', type: 'lighting', load_rating_kw: 5.0 },
      { id: 'd23', name: 'Borne Recharge Véhicule Élec', protocol: 'Modbus', status: 'offline', type: 'transport', load_rating_kw: 22.0 }
    ]
  },
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
