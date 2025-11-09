import { useState } from 'react';
import { summarizeMenu } from '../services/api';
import { MenuSummary } from '../types/menu';

interface MenuFormProps {
  onMenuLoaded: (menu: MenuSummary) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function MenuForm({ onMenuLoaded, onError, isLoading, setIsLoading }: MenuFormProps) {
  const [url, setUrl] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      onError('Prosím zadejte URL adresu');
      return;
    }

    setIsLoading(true);
    onError('');

    try {
      const menu = await summarizeMenu(url.trim(), date || undefined);
      onMenuLoaded(menu);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Nastala chyba při načítání menu';
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
          URL adresa menu restaurace
        </label>
        <input
          type="url"
          id="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.restaurace-example.cz/menu"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
          required
        />
      </div>
      
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
          Datum (volitelné, výchozí: dnes)
        </label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Načítám menu...' : 'Načíst menu'}
      </button>
    </form>
  );
}

