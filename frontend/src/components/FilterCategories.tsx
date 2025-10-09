import React from 'react'
import { categories, Category } from '../types/data';


interface FilterCategoriesProps {
  selectedCategory: string;
  darkMode: boolean;
  onCategoryChange: (category: string) => void;
}

const FilterCategories: React.FC<FilterCategoriesProps> = ({ selectedCategory, darkMode, onCategoryChange }) => {

  return (
    <div className="flex flex-wrap gap-4 mb-8">
      {/* All Categories Button */}
      <button
        onClick={() => onCategoryChange('all')}
        className={`flex items-center px-4 py-2 rounded-full font-medium transition-all duration-300 ${
          selectedCategory === 'all'
            ? 'bg-gradient-to-r from-orange-500 to-green-500 text-white shadow-lg'
            : `${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} shadow-md hover:shadow-lg`
        }`}
      >
        All Tours
      </button>
      
      {categories.map((category: Category) => {
        const Icon = category.icon;

        return (
          <button title='Filter by category'
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex items-center px-4 py-2 rounded-full font-medium transition-all duration-300 ${
              selectedCategory === category.id
                ? 'bg-gradient-to-r from-orange-500 to-green-500 text-white shadow-lg'
                : `${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} shadow-md hover:shadow-lg`
            }`}
          >
            <Icon size={16} className="mr-2" />
            {category.name}
          </button>
        );
      })}
    </div>
  );
};

export default FilterCategories ;
