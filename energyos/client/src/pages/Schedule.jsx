import React, { useEffect, useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import { useStore } from '../store';
import { getApiBaseUrl } from '../lib/api';
import { Clock, Plus, Trash2, X, Sliders, Brain, Sparkles, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { autoConfigFromDevices } from '../lib/groq';
import { MONTHLY_DATA } from '../lib/demoData';
import toast from 'react-hot-toast';

export default function Schedule() {
  const {
    zones,
    schedules,
    addSchedule,
    toggleSchedule,
    deleteSchedule,
    setZones
  } = useStore();

  const [showAddModal, setShowAddModal] = useState(false);

  // AI suggestion states
  const [aiLoading, setAiLoading] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestedSchedules, setSuggestedSchedules] = useState([]);
  const [aiSummary, setAiSummary] = useState('');

  // Form fields state
  const [scheduleMode, setScheduleMode] = useState('recurring'); // 'recurring' | 'event'
  const [targetType, setTargetType] = useState('device');
  const [targetName, setTargetName] = useState('CTA Bloc Principal');
  const [cycleAction, setCycleAction] = useState('on'); // 'on' | 'off' | 'dim_30' | 'dim_50' | 'dim_70' | 'eco' | 'comfort'
  const [cycleTime, setCycleTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']);
  const [targetDate, setTargetDate] = useState('');
  const [eventName, setEventName] = useState('');

  // Fetch baseline zones if empty
  useEffect(() => {
    const gtbUrl = localStorage.getItem('energyos_gtb_url');
    if (gtbUrl && zones.length === 0) {
      const baseUrl = getApiBaseUrl();
      fetch(`${baseUrl}/api/gtb/zones?url=${encodeURIComponent(gtbUrl)}`)
        .then(res => res.ok && res.json())
        .then(data => {
          if (data && data.length > 0) setZones(data);
        })
        .catch(err => console.error(err));
    }
  }, [zones.length, setZones]);

  const mapConfigToSchedules = (ecoSchedules) => {
    if (!ecoSchedules || !Array.isArray(ecoSchedules)) return [];
    const list = [];
    ecoSchedules.forEach((sch, idx) => {
      list.push({
        id: `gtb-eco-${idx}-off`,
        target: sch.zone,
        type: 'zone',
        scheduleMode: 'recurring',
        action: 'off',
        time: sch.eco_start || '18:00',
        days: sch.days || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
        active: true
      });
      list.push({
        id: `gtb-eco-${idx}-on`,
        target: sch.zone,
        type: 'zone',
        scheduleMode: 'recurring',
        action: 'on',
        time: sch.eco_end || '07:00',
        days: sch.days || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
        active: true
      });
    });
    return list;
  };

  const syncSchedulesToGTB = async (currentSchedules) => {
    const gtbUrl = localStorage.getItem('energyos_gtb_url') || '';
    try {
      const baseUrl = getApiBaseUrl();
      const zonesGrouped = {};
      
      currentSchedules.forEach((sch) => {
        if (sch.type !== 'zone') return;
        if (!zonesGrouped[sch.target]) {
          zonesGrouped[sch.target] = {
            zone: sch.target,
            eco_start: '18:00',
            eco_end: '07:00',
            days: sch.days || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven']
          };
        }
        if (sch.action === 'off' || sch.action === 'eco') {
          zonesGrouped[sch.target].eco_start = sch.time;
        } else if (sch.action === 'on' || sch.action === 'comfort') {
          zonesGrouped[sch.target].eco_end = sch.time;
        }
      });

      const ecoSchedules = Object.values(zonesGrouped);

      await fetch(`${baseUrl}/api/gtb/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: gtbUrl,
          config: {
            eco_schedules: ecoSchedules
          }
        })
      });
    } catch (err) {
      console.error('Failed to sync schedules to GTB:', err);
    }
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      const allDevices = zones.flatMap(z => (z.devices || []).map(d => ({ ...d, zoneName: z.name, zoneType: z.type })));
      const config = await autoConfigFromDevices(allDevices, MONTHLY_DATA.baseline);

      const ACTION_MAP = { off: 'off', eco: 'eco', dim_30: 'dim_30' };

      const suggestions = (config.eco_schedules || []).map((s, i) => ({
        id: `ai_${Date.now()}_${i}`,
        target: s.zone,
        type: 'zone',
        scheduleMode: 'recurring',
        action: ACTION_MAP[s.action] || 'dim_30',
        time: s.eco_start || '22:00',
        days: s.days || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        active: true,
        aiGenerated: true,
      }));

      setSuggestedSchedules(suggestions);
      setAiSummary(config.summary || '');
      setShowSuggestionModal(true);
    } catch (err) {
      console.error(err);
      toast.error('Impossible de générer les suggestions IA. Vérifiez la clé API Groq.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirmSuggestions = () => {
    suggestedSchedules.forEach(s => addSchedule(s));
    const updated = [...schedules, ...suggestedSchedules];
    syncSchedulesToGTB(updated);
    setShowSuggestionModal(false);
    useStore.getState().addActivity('ai', `${suggestedSchedules.length} cycles IA ajoutés à la planification`);
    toast.success(`${suggestedSchedules.length} cycles d'optimisation IA appliqués`);
  };

  const handleToggleSchedule = (id) => {
    toggleSchedule(id);
    setTimeout(() => {
      const updated = useStore.getState().schedules;
      syncSchedulesToGTB(updated);
    }, 50);
  };

  const handleDeleteSchedule = (id) => {
    deleteSchedule(id);
    setTimeout(() => {
      const updated = useStore.getState().schedules;
      syncSchedulesToGTB(updated);
    }, 50);
  };

  const handleAddScheduleSubmit = (e) => {
    e.preventDefault();
    if (!targetName) return;
    if (scheduleMode === 'event' && !targetDate) {
      toast.error('Veuillez sélectionner une date spécifique.');
      return;
    }

    const newSch = {
      id: 'sch_' + Date.now(),
      target: targetName,
      type: targetType,
      scheduleMode: scheduleMode,
      action: cycleAction,
      time: cycleTime,
      days: scheduleMode === 'recurring' ? selectedDays : [],
      date: scheduleMode === 'event' ? targetDate : null,
      eventName: scheduleMode === 'event' ? (eventName || 'Événement Spécial') : null,
      active: true,
    };

    addSchedule(newSch);
    
    // Sync to GTB simulator
    const updatedSchedules = [...schedules, newSch];
    syncSchedulesToGTB(updatedSchedules);

    toast.success(`Planification enregistrée pour ${targetName} !`);
    setShowAddModal(false);
    
    // Reset form target
    setTargetName(targetType === 'device' ? (zones[0]?.devices?.[0]?.name || '') : (zones[0]?.name || ''));
    setEventName('');
    setTargetDate('');
  };

  const toggleDay = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'on': return 'Allumage (100%)';
      case 'off': return 'Extinction';
      case 'dim_30': return 'Tamiser à 30%';
      case 'dim_50': return 'Tamiser à 50%';
      case 'dim_70': return 'Tamiser à 70%';
      case 'eco': return 'Mode Éco (Veille)';
      case 'comfort': return 'Mode Confort';
      default: return 'Action standard';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'on':
      case 'comfort':
        return 'bg-accent-green/5 text-accent-green border-accent-green/10';
      case 'off':
        return 'bg-accent-red/5 text-accent-red border-accent-red/10';
      case 'eco':
      case 'dim_30':
      case 'dim_50':
      case 'dim_70':
        return 'bg-accent-amber/5 text-accent-amber border-accent-amber/10';
      default:
        return 'bg-accent-cyan/5 text-accent-cyan border-accent-cyan/10';
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title="Planification" />
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div>
                <h2 className="text-xl text-text-primary font-display font-semibold">
                  Planification des Équipements
                </h2>
                <p className="text-xs text-text-muted mt-1 max-w-lg">
                  Configurez des cycles récurrents, variations d'éclairage ou fermetures événementielles. L'IA peut suggérer des cycles d'optimisation nocturne basés sur vos équipements.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* AI suggest button */}
                <button
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                  className="flex items-center gap-2 bg-bg-surface border border-accent-cyan/25 text-accent-cyan font-semibold px-4 py-2 rounded-xl hover:bg-accent-cyan/10 transition text-sm cursor-pointer disabled:opacity-50 font-display"
                >
                  {aiLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4" />
                  )}
                  Suggérer (IA)
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 bg-accent-cyan text-bg-primary font-semibold px-4 py-2 rounded-xl hover:brightness-110 transition text-sm cursor-pointer shadow-lg shadow-accent-cyan/15 font-display"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un Cycle
                </button>
              </div>
            </div>

            {/* Schedules grid list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schedules.map((sch) => (
                <div key={sch.id} className="bg-bg-surface border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-white/10 transition duration-200">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                          sch.type === 'device' 
                            ? 'bg-accent-cyan/5 text-accent-cyan border-accent-cyan/10' 
                            : 'bg-accent-green/5 text-accent-green border-accent-green/10'
                        }`}>
                          {sch.type === 'device' ? 'Équipement' : 'Zone'}
                        </span>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                          sch.scheduleMode === 'event'
                            ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/20'
                            : 'bg-white/5 text-text-muted border-white/5'
                        }`}>
                          {sch.scheduleMode === 'event' ? 'Événement' : 'Récurrent'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-text-primary font-display text-base mt-2">
                        {sch.target}
                      </h3>
                      {sch.scheduleMode === 'event' && sch.eventName && (
                        <p className="text-xs text-accent-cyan font-medium">
                          Motif: {sch.eventName}
                        </p>
                      )}
                    </div>
                    
                    {/* Toggle switch */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleSchedule(sch.id)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          sch.active ? 'bg-accent-green' : 'bg-white/10'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-bg-primary transition-transform ${
                          sch.active ? 'translate-x-5' : ''
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Schedule Info */}
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-1.5 text-text-primary">
                        <Clock className="w-4 h-4 text-accent-cyan" />
                        <span className="font-mono font-bold text-sm">{sch.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${getActionColor(sch.action)}`}>
                          {getActionLabel(sch.action)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-text-muted font-medium">
                        {sch.scheduleMode === 'event' ? sch.date : sch.days.join(', ')}
                      </span>
                      <button
                        onClick={() => {
                          handleDeleteSchedule(sch.id);
                          toast.success('Planification supprimée !');
                        }}
                        className="text-text-muted hover:text-accent-red transition-colors p-1.5 hover:bg-white/5 rounded-lg cursor-pointer"
                        title="Supprimer la planification"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Suggestion Confirmation Modal */}
          {showSuggestionModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-bg-surface border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in scale-in duration-200">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/6 bg-accent-cyan/5">
                  <div className="p-2 rounded-lg bg-accent-cyan/15">
                    <Brain className="w-5 h-5 text-accent-cyan" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-text-primary">
                      Suggestion d'Optimisation IA
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">
                      {suggestedSchedules.length} cycle{suggestedSchedules.length !== 1 ? 's' : ''} proposé{suggestedSchedules.length !== 1 ? 's' : ''} — confirmez pour les appliquer
                    </p>
                  </div>
                  <button onClick={() => setShowSuggestionModal(false)} className="ml-auto text-text-muted hover:text-text-primary p-1 cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Summary */}
                {aiSummary && (
                  <div className="px-6 py-3 bg-bg-elevated/50 border-b border-white/5">
                    <p className="text-xs text-text-muted italic leading-relaxed">{aiSummary}</p>
                  </div>
                )}

                {/* Suggested schedules list */}
                <div className="max-h-64 overflow-y-auto px-6 py-4 space-y-2">
                  {suggestedSchedules.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-bg-elevated border border-white/5">
                      <ChevronRight className="w-3.5 h-3.5 text-accent-cyan flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary truncate">{s.target}</p>
                        <p className="text-[11px] text-text-muted">
                          {getActionLabel(s.action)} · {s.time} · {s.days.slice(0, 3).join(', ')}{s.days.length > 3 ? '…' : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getActionColor(s.action)}`}>
                        {getActionLabel(s.action)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 py-4 border-t border-white/6">
                  <button
                    onClick={() => setShowSuggestionModal(false)}
                    className="flex-1 py-2.5 border border-white/10 text-text-primary text-sm font-semibold rounded-xl hover:bg-bg-elevated transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmSuggestions}
                    className="flex-1 py-2.5 bg-accent-cyan text-bg-primary text-sm font-bold rounded-xl hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Appliquer les cycles
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Cycle Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-bg-surface border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-in scale-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                  <h3 className="font-display font-bold text-lg text-text-primary">
                    Nouveau Cycle Automatique
                  </h3>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddScheduleSubmit} className="space-y-4">
                  {/* Schedule Mode Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                      Type d'Occasion
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setScheduleMode('recurring')}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                          scheduleMode === 'recurring'
                            ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20'
                            : 'bg-white/5 text-text-muted border-white/5 hover:bg-white/10'
                        }`}
                      >
                        Hebdomadaire Récurrent
                      </button>
                      <button
                        type="button"
                        onClick={() => setScheduleMode('event')}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                          scheduleMode === 'event'
                            ? 'bg-accent-amber/10 text-accent-amber border-accent-amber/20'
                            : 'bg-white/5 text-text-muted border-white/5 hover:bg-white/10'
                        }`}
                      >
                        Événement Unique / Date
                      </button>
                    </div>
                  </div>

                  {/* Target Type Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                      Type de Cible
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTargetType('device');
                          setTargetName(zones[0]?.devices?.[0]?.name || '');
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                          targetType === 'device'
                            ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20'
                            : 'bg-white/5 text-text-muted border-white/5 hover:bg-white/10'
                        }`}
                      >
                        Équipement GTB
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetType('zone');
                          setTargetName(zones[0]?.name || 'Bloc Opératoire 1');
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition cursor-pointer ${
                          targetType === 'zone'
                            ? 'bg-accent-green/10 text-accent-green border-accent-green/20'
                            : 'bg-white/5 text-text-muted border-white/5 hover:bg-white/10'
                        }`}
                      >
                        Zone de Consommation
                      </button>
                    </div>
                  </div>

                  {/* Nom de la Cible */}
                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                      Nom de la Cible
                    </label>
                    <select
                      value={targetName}
                      onChange={(e) => setTargetName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-cyan transition-colors"
                    >
                      {targetType === 'device' ? (
                        zones.flatMap(z => z.devices || []).map(d => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))
                      ) : (
                        zones.map((z) => (
                          <option key={z.id} value={z.name}>{z.name}</option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Advanced Action selector list */}
                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                      Action Spécifique
                    </label>
                    <select
                      value={cycleAction}
                      onChange={(e) => setCycleAction(e.target.value)}
                      className="w-full px-4 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-cyan transition-colors font-semibold"
                    >
                      <option value="on">🟢 Allumage / Actif Complet (100%)</option>
                      <option value="off">🔴 Extinction Complète (0%)</option>
                      <option value="dim_30">🟡 Tamiser Éclairage à 30%</option>
                      <option value="dim_50">🟡 Tamiser Éclairage à 50%</option>
                      <option value="dim_70">🟡 Tamiser Éclairage à 70%</option>
                      <option value="eco">🍂 Mode Économique (Consigne Éco)</option>
                      <option value="comfort">🔥 Mode Confort (Consigne Régulée)</option>
                    </select>
                  </div>

                  {/* Time selector */}
                  <div>
                    <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                      Heure d'Exécution
                    </label>
                    <input
                      type="time"
                      value={cycleTime}
                      onChange={(e) => setCycleTime(e.target.value)}
                      className="w-full px-4 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-text-primary font-mono text-sm focus:outline-none focus:border-accent-cyan transition-colors"
                    />
                  </div>

                  {/* Conditional inputs depending on scheduleMode */}
                  {scheduleMode === 'event' ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                          Nom de l'Événement (ex: Fête de l'Indépendance)
                        </label>
                        <input
                          type="text"
                          placeholder="Fermeture Annuelle / Jour Férié"
                          value={eventName}
                          onChange={(e) => setEventName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-text-primary text-sm focus:outline-none focus:border-accent-cyan transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                          Date de l'Événement
                        </label>
                        <input
                          type="date"
                          value={targetDate}
                          onChange={(e) => setTargetDate(e.target.value)}
                          className="w-full px-4 py-2.5 bg-bg-elevated border border-white/10 rounded-xl text-text-primary font-mono text-sm focus:outline-none focus:border-accent-cyan transition-colors"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
                        Jours Applicables
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => {
                          const isSelected = selectedDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDay(day)}
                              className={`w-9 h-9 text-xs font-semibold rounded-lg border flex items-center justify-center transition cursor-pointer ${
                                isSelected
                                  ? 'bg-accent-cyan text-bg-primary border-accent-cyan'
                                  : 'bg-white/5 text-text-muted border-white/5 hover:bg-white/10'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Submit buttons */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-2.5 border border-white/10 text-text-primary text-sm font-semibold rounded-xl hover:bg-bg-elevated transition cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-accent-cyan text-bg-primary text-sm font-bold rounded-xl hover:brightness-110 transition cursor-pointer"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
