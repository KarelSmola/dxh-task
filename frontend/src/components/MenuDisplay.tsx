import { MenuSummary } from '../types/menu';

interface MenuDisplayProps {
  menu: MenuSummary;
}

export default function MenuDisplay({ menu }: MenuDisplayProps) {
  const allergensMap: Record<string, string> = {
    '1': 'Obiloviny obsahující lepek',
    '2': 'Korýši',
    '3': 'Vejce',
    '4': 'Ryby',
    '5': 'Arašídy',
    '6': 'Sójové boby',
    '7': 'Mléko',
    '8': 'Skořápkové plody',
    '9': 'Celer',
    '10': 'Hořčice',
    '11': 'Sezam',
    '12': 'Oxid siřičitý',
    '13': 'Vlčí bob',
    '14': 'Měkkýši'
  };

  const getCategoryLabel = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'polévka': 'Polévky',
      'hlavní jídlo': 'Hlavní jídla',
      'dezert': 'Dezerty',
      'nápoj': 'Nápoje'
    };
    return categoryMap[category.toLowerCase()] || category;
  };

  const groupedItems = menu.menu_items.reduce((acc, item) => {
    const category = item.category.toLowerCase();
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof menu.menu_items>);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800">{menu.restaurant_name}</h2>
        <p className="text-gray-600 mt-1">
          {menu.day_of_week}, {new Date(menu.date).toLocaleDateString('cs-CZ')}
        </p>
        {menu.daily_menu && (
          <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
            Denní menu
          </span>
        )}
      </div>

      {menu.menu_items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">Pro tento den nebylo nalezeno žádné menu.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-700 border-b-2 border-blue-200 pb-2">
                {getCategoryLabel(category)}
              </h3>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-lg">{item.name}</h4>
                        {item.description && (
                          <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {item.weight && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              {item.weight}
                            </span>
                          )}
                          {item.allergens && item.allergens.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.allergens.map((allergen) => (
                                <span
                                  key={allergen}
                                  className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
                                  title={allergensMap[allergen] || `Alergen ${allergen}`}
                                >
                                  {allergen}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className="text-xl font-bold text-blue-600">
                          {item.price} Kč
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 border-t text-sm text-gray-500">
        <p>
          Zdroj: <a href={menu.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {menu.source_url}
          </a>
        </p>
      </div>
    </div>
  );
}

