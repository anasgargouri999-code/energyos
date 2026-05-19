import { supabase } from './supabase';

/**
 * Check if Supabase is properly configured with custom credentials
 */
export function isDbConfigured() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return url && key && !url.includes('placeholder-project');
}

/**
 * Fetch all zones and their associated devices from Supabase
 */
export async function fetchZonesWithDevices() {
  try {
    if (!isDbConfigured()) {
      return { data: null, error: 'Database not configured' };
    }

    // 1. Fetch zones
    const { data: zones, error: zonesErr } = await supabase
      .from('zones')
      .select('*')
      .order('priority', { ascending: true });

    if (zonesErr) throw zonesErr;

    // 2. Fetch devices
    const { data: devices, error: devicesErr } = await supabase
      .from('devices')
      .select('*');

    if (devicesErr) throw devicesErr;

    // 3. Group devices by zone_id
    const zonesWithDevices = zones.map(zone => ({
      ...zone,
      // Map database keys to frontend keys if needed (e.g. target_temp_c -> temp, operating_mode -> mode)
      temp: zone.target_temp_c !== null ? Number(zone.target_temp_c) : 22,
      humidity: zone.target_humidity_percent !== null ? Number(zone.target_humidity_percent) : 50,
      mode: zone.operating_mode || 'normal',
      status: zone.operating_mode === 'off' ? 'inactive' : 'active',
      load_kw: devices
        .filter(d => d.zone_id === zone.id && d.status === 'online')
        .reduce((sum, d) => sum + (Number(d.load_rating_kw) || 0), 0) || 2.5,
      devices: devices.filter(d => d.zone_id === zone.id)
    }));

    return { data: zonesWithDevices, error: null };
  } catch (err) {
    console.error('Failed to fetch zones with devices from DB:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Fetch monthly savings and billing records from Supabase
 */
export async function fetchMonthlySavings() {
  try {
    if (!isDbConfigured()) {
      return { data: null, error: 'Database not configured' };
    }

    const { data, error } = await supabase
      .from('monthly_savings')
      .select('*')
      .order('month_order', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      const labels = data.map(d => d.month_name);
      const baseline = data.map(d => Number(d.baseline_kwh));
      const optimized = data.map(d => Number(d.optimized_kwh));
      const bills = data.map(d => Number(d.bill_millimes));
      
      const totalSaving = baseline.reduce((sum, v, i) => sum + (v - optimized[i]), 0);
      const totalBaseline = baseline.reduce((sum, v) => sum + v, 0);
      const savingPercent = Number(((totalSaving / totalBaseline) * 100).toFixed(1));

      return {
        data: {
          labels,
          baseline,
          optimized,
          bills,
          totalSaving,
          savingPercent
        },
        error: null
      };
    }

    return { data: null, error: 'No data found' };
  } catch (err) {
    console.error('Failed to fetch monthly savings from DB:', err);
    return { data: null, error: err.message };
  }
}
