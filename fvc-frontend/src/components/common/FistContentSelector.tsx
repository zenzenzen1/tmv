import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { FistConfigResponse, FistItemResponse } from '../../types';

export interface FistContentSelectorProps {
  fistConfigs: FistConfigResponse[];
  fistItems: FistItemResponse[];
  selectedSelections: Record<string, string[]>; // configId -> itemIds[]
  onChange: (selections: Record<string, string[]>) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const FistContentSelector: React.FC<FistContentSelectorProps> = ({
  fistConfigs,
  fistItems,
  selectedSelections,
  onChange,
  label = 'Fist Content Selection',
  error,
  disabled = false,
  className = '',
}) => {
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Group fist items by config
  const itemsByConfig = fistItems.reduce((acc, item) => {
    const configId = item.parentId || 'root'; // Assuming parentId refers to config
    if (!acc[configId]) {
      acc[configId] = [];
    }
    acc[configId].push(item);
    return acc;
  }, {} as Record<string, FistItemResponse[]>);

  // Filter configs and items based on search term
  const filteredConfigs = fistConfigs.filter(config =>
    config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    config.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredItemsByConfig = Object.entries(itemsByConfig).reduce((acc, [configId, items]) => {
    const filteredItems = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filteredItems.length > 0) {
      acc[configId] = filteredItems;
    }
    return acc;
  }, {} as Record<string, FistItemResponse[]>);

  // Toggle config expansion
  const toggleConfig = (configId: string) => {
    if (disabled) return;
    
    const newExpanded = new Set(expandedConfigs);
    if (newExpanded.has(configId)) {
      newExpanded.delete(configId);
    } else {
      newExpanded.add(configId);
    }
    setExpandedConfigs(newExpanded);
  };

  // Handle config selection (select/deselect all items in config)
  const handleConfigSelection = (configId: string) => {
    if (disabled) return;

    const currentSelections = { ...selectedSelections };
    const configItems = itemsByConfig[configId] || [];
    
    if (currentSelections[configId]?.length === configItems.length) {
      // Deselect all items in this config
      delete currentSelections[configId];
    } else {
      // Select all items in this config
      currentSelections[configId] = configItems.map(item => item.id);
    }
    
    onChange(currentSelections);
  };

  // Handle individual item selection
  const handleItemSelection = (configId: string, itemId: string) => {
    if (disabled) return;

    const currentSelections = { ...selectedSelections };
    const configSelections = currentSelections[configId] || [];
    
    if (configSelections.includes(itemId)) {
      // Remove item
      const newSelections = configSelections.filter(id => id !== itemId);
      if (newSelections.length === 0) {
        delete currentSelections[configId];
      } else {
        currentSelections[configId] = newSelections;
      }
    } else {
      // Add item
      currentSelections[configId] = [...configSelections, itemId];
    }
    
    onChange(currentSelections);
  };

  // Check if config is fully selected
  const isConfigFullySelected = (configId: string) => {
    const configItems = itemsByConfig[configId] || [];
    const selectedItems = selectedSelections[configId] || [];
    return configItems.length > 0 && selectedItems.length === configItems.length;
  };

  // Check if config is partially selected
  const isConfigPartiallySelected = (configId: string) => {
    const configItems = itemsByConfig[configId] || [];
    const selectedItems = selectedSelections[configId] || [];
    return selectedItems.length > 0 && selectedItems.length < configItems.length;
  };

  // Check if item is selected
  const isItemSelected = (configId: string, itemId: string) => {
    return selectedSelections[configId]?.includes(itemId) || false;
  };

  // Get total selected count
  const getTotalSelectedCount = () => {
    return Object.values(selectedSelections).reduce((total, items) => total + items.length, 0);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search fist content..."
          disabled={disabled}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
      </div>

      {/* Selection Summary */}
      {getTotalSelectedCount() > 0 && (
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
          {getTotalSelectedCount()} item(s) selected across {Object.keys(selectedSelections).length} config(s)
        </div>
      )}

      {/* Configs and Items */}
      <div className="border border-gray-200 rounded-md max-h-96 overflow-auto">
        {filteredConfigs.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500">
            {searchTerm ? 'No fist content found' : 'No fist content available'}
          </div>
        ) : (
          filteredConfigs.map((config) => {
            const configId = config.id;
            const configItems = filteredItemsByConfig[configId] || [];
            const isExpanded = expandedConfigs.has(configId);
            const isFullySelected = isConfigFullySelected(configId);
            const isPartiallySelected = isConfigPartiallySelected(configId);

            return (
              <div key={configId} className="border-b border-gray-100 last:border-b-0">
                {/* Config Header */}
                <div
                  className={`
                    flex items-center justify-between px-3 py-2 cursor-pointer
                    ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}
                  `}
                  onClick={() => !disabled && toggleConfig(configId)}
                >
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    {configItems.length > 0 ? (
                      isExpanded ? (
                        <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )
                    ) : (
                      <div className="w-4 h-4 flex-shrink-0" />
                    )}
                    
                    <input
                      type="checkbox"
                      checked={isFullySelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isPartiallySelected;
                      }}
                      onChange={() => !disabled && handleConfigSelection(configId)}
                      disabled={disabled}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {config.name}
                      </div>
                      {config.description && (
                        <div className="text-xs text-gray-500 truncate">
                          {config.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {configItems.length > 0 && (
                    <div className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {configItems.length} item(s)
                    </div>
                  )}
                </div>

                {/* Config Items */}
                {isExpanded && configItems.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-100">
                    {configItems.map((item) => {
                      const isSelected = isItemSelected(configId, item.id);
                      
                      return (
                        <div
                          key={item.id}
                          className={`
                            flex items-center space-x-2 px-6 py-2 cursor-pointer
                            ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100'}
                          `}
                          onClick={() => !disabled && handleItemSelection(configId, item.id)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => !disabled && handleItemSelection(configId, item.id)}
                            disabled={disabled}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900 truncate">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="text-xs text-gray-500 truncate">
                                {item.description}
                              </div>
                            )}
                          </div>
                          
                          {isSelected && (
                            <CheckIcon className="h-4 w-4 text-primary-600 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default FistContentSelector;
