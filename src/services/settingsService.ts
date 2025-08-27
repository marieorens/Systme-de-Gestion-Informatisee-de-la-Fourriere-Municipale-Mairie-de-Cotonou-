import api, { endpoints } from './api';

export interface Settings {
  daily_storage_fee: number;
  release_fee: number;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  tax_rate: number;
  notification_email: string;
}

/**
 * Settings service for handling application settings
 */
const settingsService = {
  /**
   * Get all application settings
   */
  getSettings: async (): Promise<Settings> => {
    const response = await api.get(endpoints.settings);
    return response.data.data;
  },

  /**
   * Update application settings
   */
  updateSettings: async (settingsData: Partial<Settings>): Promise<Settings> => {
    const response = await api.put(endpoints.updateSettings, settingsData);
    return response.data.data;
  }
};

export default settingsService;
