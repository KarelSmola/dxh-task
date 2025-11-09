import { useState } from 'react';
import MenuForm from './components/MenuForm';
import MenuDisplay from './components/MenuDisplay';
import { MenuSummary } from './types/menu';

function App() {
  const [menu, setMenu] = useState<MenuSummary | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMenuLoaded = (loadedMenu: MenuSummary) => {
    setMenu(loadedMenu);
    setError('');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setMenu(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🍽️ Restaurant Menu Summarizer
          </h1>
          <p className="text-gray-600">
            Získejte strukturované menu z libovolné restaurace
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <MenuForm
            onMenuLoaded={handleMenuLoaded}
            onError={handleError}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
            <p className="font-semibold">Chyba:</p>
            <p>{error}</p>
          </div>
        )}

        {menu && <MenuDisplay menu={menu} />}

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Načítám menu...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

