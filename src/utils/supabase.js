/**
 * Supabase Client Configuration
 * Handles connection to Supabase for rate sheet storage
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Using localStorage fallback.');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Rate Sheet Storage API
 */
export const RateSheetAPI = {
  /**
   * Fetch all published rate sheets
   */
  async getPublishedRateSheets() {
    if (!supabase) {
      console.warn('Supabase not configured, using localStorage');
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('rate_sheets')
      .select('*')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    return { data, error };
  },

  /**
   * Fetch all rate sheets (for admin)
   */
  async getAllRateSheets() {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('rate_sheets')
      .select('*')
      .order('updated_at', { ascending: false });

    return { data, error };
  },

  /**
   * Get a single rate sheet by ID
   */
  async getRateSheet(id) {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('rate_sheets')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  /**
   * Save/update a rate sheet
   */
  async saveRateSheet(rateSheet) {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const now = new Date().toISOString();
    const record = {
      ...rateSheet,
      updated_at: now,
      created_at: rateSheet.created_at || now,
    };

    const { data, error } = await supabase
      .from('rate_sheets')
      .upsert(record, { onConflict: 'id' })
      .select()
      .single();

    return { data, error };
  },

  /**
   * Publish a rate sheet (make it live for all users)
   */
  async publishRateSheet(id) {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('rate_sheets')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Unpublish a rate sheet
   */
  async unpublishRateSheet(id) {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { data, error } = await supabase
      .from('rate_sheets')
      .update({
        is_published: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Delete a rate sheet
   */
  async deleteRateSheet(id) {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const { error } = await supabase
      .from('rate_sheets')
      .delete()
      .eq('id', id);

    return { error };
  },

  /**
   * Publish all rate sheets at once (bulk publish)
   */
  async publishAllRateSheets(rateSheets) {
    if (!supabase) {
      return { data: null, error: 'Supabase not configured' };
    }

    const now = new Date().toISOString();
    const records = rateSheets.map(sheet => ({
      ...sheet,
      is_published: true,
      published_at: now,
      updated_at: now,
      created_at: sheet.created_at || now,
    }));

    const { data, error } = await supabase
      .from('rate_sheets')
      .upsert(records, { onConflict: 'id' })
      .select();

    return { data, error };
  },

  /**
   * Check connection to Supabase
   */
  async checkConnection() {
    if (!supabase) {
      return { connected: false, error: 'Supabase not configured' };
    }

    try {
      const { error } = await supabase
        .from('rate_sheets')
        .select('id')
        .limit(1);

      if (error) {
        return { connected: false, error: error.message };
      }
      return { connected: true, error: null };
    } catch (err) {
      return { connected: false, error: err.message };
    }
  }
};

export default supabase;
