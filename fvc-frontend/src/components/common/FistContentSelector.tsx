import React, { useState } from 'react';
import type { FistConfigResponse, FistItemResponse } from '../../types';
import { Box, TextField, Typography, Checkbox, Accordion, AccordionSummary, AccordionDetails, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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

  // Toggle handled by Accordion onChange; helper to check expanded state
  const isExpanded = (configId: string) => expandedConfigs.has(configId);

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
    <Box className={className} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {label && (
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      )}

      <TextField
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search fist content..."
        disabled={disabled}
      />

      {getTotalSelectedCount() > 0 && (
        <Box sx={{ bgcolor: 'grey.50', px: 1.5, py: 1, borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {getTotalSelectedCount()} item(s) selected across {Object.keys(selectedSelections).length} config(s)
          </Typography>
        </Box>
      )}

      <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, maxHeight: 384, overflow: 'auto' }}>
        {filteredConfigs.length === 0 ? (
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'No fist content found' : 'No fist content available'}
            </Typography>
          </Box>
        ) : (
          filteredConfigs.map((config) => {
            const configId = config.id;
            const configItems = filteredItemsByConfig[configId] || [];
            const fullySelected = isConfigFullySelected(configId);
            const partiallySelected = isConfigPartiallySelected(configId);

            return (
              <Accordion
                key={configId}
                disableGutters
                expanded={isExpanded(configId)}
                onChange={() => {
                  if (disabled) return;
                  const next = new Set(expandedConfigs);
                  if (next.has(configId)) next.delete(configId); else next.add(configId);
                  setExpandedConfigs(next);
                }}
                sx={{
                  '&:before': { display: 'none' },
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 1.5, py: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
                    <Checkbox
                      size="small"
                      checked={fullySelected}
                      indeterminate={partiallySelected}
                      onChange={() => !disabled && handleConfigSelection(configId)}
                      disabled={disabled}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap>{config.name}</Typography>
                      {config.description && (
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {config.description}
                        </Typography>
                      )}
                    </Box>
                    {configItems.length > 0 && (
                      <Typography variant="caption" color="text.disabled">{configItems.length} item(s)</Typography>
                    )}
                  </Box>
                </AccordionSummary>
                {configItems.length > 0 && (
                  <AccordionDetails sx={{ p: 0 }}>
                    <Divider />
                    {configItems.map((item) => {
                      const selected = isItemSelected(configId, item.id);
                      return (
                        <Box
                          key={item.id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 3,
                            py: 1,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            '&:hover': { bgcolor: disabled ? 'transparent' : 'action.hover' },
                          }}
                          onClick={() => !disabled && handleItemSelection(configId, item.id)}
                        >
                          <Checkbox
                            size="small"
                            checked={selected}
                            onChange={() => !disabled && handleItemSelection(configId, item.id)}
                            disabled={disabled}
                          />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap>{item.name}</Typography>
                            {item.description && (
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {item.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </AccordionDetails>
                )}
              </Accordion>
            );
          })
        )}
      </Box>

      {error && (
        <Typography variant="caption" color="error">{error}</Typography>
      )}
    </Box>
  );
};

export default FistContentSelector;
