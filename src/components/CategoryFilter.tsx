import React from 'react';
import type { Category } from '@/types/domain';
import { CATEGORIES } from '@/types/domain';

interface CategoryFilterProps {
  selectedCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
}

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <select
      value={selectedCategory}
      onChange={(e) => onCategoryChange(e.target.value as Category | 'all')}
      className="px-3 py-2 border border-gray-300 rounded-md"
    >
      <option value="all">All Categories</option>
      {Object.values(CATEGORIES).map((category) => (
        <option key={category.id} value={category.id}>
          {category.label}
        </option>
      ))}
    </select>
  );
}