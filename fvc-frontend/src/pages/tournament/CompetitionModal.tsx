import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCompetitionStore } from '../../stores/competition';
import { useWeightClassStore } from '../../stores/weightClass';
import { useFistContentStore } from '../../stores/fistContent';
import { useMusicContentStore } from '../../stores/musicContent';
import type { 
  CompetitionResponse, 
  CreateCompetitionRequest, 
  UpdateCompetitionRequest,
  TournamentStatus 
} from '../../types';
import MultiSelect from '../../components/common/MultiSelect';
import FistContentSelector from '../../components/common/FistContentSelector';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface CompetitionModalProps {
  competition?: CompetitionResponse | null;
  viewMode?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CompetitionModal: React.FC<CompetitionModalProps> = ({
  competition,
  viewMode = false,
  onClose,
  onSuccess,
}) => {
  const {
    creating,
    updating,
    createCompetition,
    updateCompetition,
    error,
    clearError,
  } = useCompetitionStore();

  const {
    list: weightClassesList,
    isLoading: weightClassesLoading,
    fetch: fetchWeightClasses,
  } = useWeightClassStore();

  const {
    fistConfigs,
    fistItems,
    loading: fistContentLoading,
    fetchFistConfigs,
    fetchFistItems,
  } = useFistContentStore();

  const {
    list: musicContentsList,
    isLoading: musicContentLoading,
    fetch: fetchMusicContents,
  } = useMusicContentStore();

  // Form state
  const [formData, setFormData] = useState<CreateCompetitionRequest>({
    name: '',
    description: '',
    registrationStartDate: '',
    registrationEndDate: '',
    weighInDate: '',
    startDate: '',
    endDate: '',
    openingCeremonyTime: '',
    drawDate: '',
    location: '',
    vovinamFistConfigIds: [],
    musicPerformanceIds: [],
    weightClassIds: [],
    fistConfigItemSelections: {},
    numberOfRounds: 2,
    roundDurationSeconds: 90,
    allowExtraRound: true,
    maxExtraRounds: 1,
    tieBreakRule: 'WEIGHT',
    assessorCount: 5,
    injuryTimeoutSeconds: 60,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load data on component mount
  useEffect(() => {
    fetchWeightClasses();
    fetchFistConfigs();
    fetchFistItems();
    fetchMusicContents();
  }, [fetchWeightClasses, fetchFistConfigs, fetchFistItems, fetchMusicContents]);

  // Initialize form data when competition is provided
  useEffect(() => {
    if (competition) {
      setFormData({
        name: competition.name,
        description: competition.description || '',
        registrationStartDate: competition.registrationStartDate,
        registrationEndDate: competition.registrationEndDate,
        weighInDate: competition.weighInDate,
        startDate: competition.startDate,
        endDate: competition.endDate,
        openingCeremonyTime: competition.openingCeremonyTime || '',
        drawDate: competition.drawDate || '',
        location: competition.location || '',
        vovinamFistConfigIds: competition.vovinamFistConfigs.map(config => config.id),
        musicPerformanceIds: competition.musicPerformances.map(music => music.id),
        weightClassIds: competition.weightClasses.map(wc => wc.id),
        fistConfigItemSelections: Object.fromEntries(
          Object.entries(competition.fistConfigItemSelections).map(([configId, items]) => [
            configId,
            items.map(item => item.id)
          ])
        ),
        numberOfRounds: competition.numberOfRounds || 2,
        roundDurationSeconds: competition.roundDurationSeconds || 90,
        allowExtraRound: competition.allowExtraRound ?? true,
        maxExtraRounds: competition.maxExtraRounds || 1,
        tieBreakRule: competition.tieBreakRule || 'WEIGHT',
        assessorCount: competition.assessorCount || 5,
        injuryTimeoutSeconds: competition.injuryTimeoutSeconds || 60,
      });
    }
  }, [competition]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle weight class selection
  const handleWeightClassChange = (selectedIds: string[]) => {
    handleFieldChange('weightClassIds', selectedIds);
  };

  // Handle music content selection
  const handleMusicContentChange = (selectedIds: string[]) => {
    handleFieldChange('musicPerformanceIds', selectedIds);
  };

  // Handle fist content selection
  const handleFistContentChange = (selections: Record<string, string[]>) => {
    handleFieldChange('fistConfigItemSelections', selections);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.registrationStartDate) {
      errors.registrationStartDate = 'Registration start date is required';
    }

    if (!formData.registrationEndDate) {
      errors.registrationEndDate = 'Registration end date is required';
    }

    if (!formData.weighInDate) {
      errors.weighInDate = 'Weigh-in date is required';
    }

    if (!formData.startDate) {
      errors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    // Date validation
    if (formData.registrationStartDate && formData.registrationEndDate) {
      if (new Date(formData.registrationStartDate) >= new Date(formData.registrationEndDate)) {
        errors.registrationEndDate = 'Registration end date must be after start date';
      }
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        errors.endDate = 'End date must be after start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    clearError();

    try {
      if (competition) {
        // Update existing competition
        const updateData: UpdateCompetitionRequest = { ...formData };
        const result = await updateCompetition(competition.id, updateData);
        if (result) {
          onSuccess();
        }
      } else {
        // Create new competition
        const result = await createCompetition(formData);
        if (result) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  // Loading state
  const isLoading = creating || updating || weightClassesLoading || fistContentLoading || musicContentLoading;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {viewMode ? 'View Tournament' : competition ? 'Edit Tournament' : 'Create Tournament'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                Basic Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    disabled={viewMode}
                    className={`input-field ${formErrors.name ? 'border-red-300' : ''}`}
                    placeholder="Tournament name"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    disabled={viewMode}
                    className="input-field"
                    placeholder="Tournament location"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  disabled={viewMode}
                  rows={3}
                  className="input-field"
                  placeholder="Tournament description"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                Important Dates
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.registrationStartDate}
                    onChange={(e) => handleFieldChange('registrationStartDate', e.target.value)}
                    disabled={viewMode}
                    className={`input-field ${formErrors.registrationStartDate ? 'border-red-300' : ''}`}
                  />
                  {formErrors.registrationStartDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.registrationStartDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.registrationEndDate}
                    onChange={(e) => handleFieldChange('registrationEndDate', e.target.value)}
                    disabled={viewMode}
                    className={`input-field ${formErrors.registrationEndDate ? 'border-red-300' : ''}`}
                  />
                  {formErrors.registrationEndDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.registrationEndDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weigh-in Date *
                  </label>
                  <input
                    type="date"
                    value={formData.weighInDate}
                    onChange={(e) => handleFieldChange('weighInDate', e.target.value)}
                    disabled={viewMode}
                    className={`input-field ${formErrors.weighInDate ? 'border-red-300' : ''}`}
                  />
                  {formErrors.weighInDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.weighInDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Draw Date
                  </label>
                  <input
                    type="date"
                    value={formData.drawDate}
                    onChange={(e) => handleFieldChange('drawDate', e.target.value)}
                    disabled={viewMode}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFieldChange('startDate', e.target.value)}
                    disabled={viewMode}
                    className={`input-field ${formErrors.startDate ? 'border-red-300' : ''}`}
                  />
                  {formErrors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFieldChange('endDate', e.target.value)}
                    disabled={viewMode}
                    className={`input-field ${formErrors.endDate ? 'border-red-300' : ''}`}
                  />
                  {formErrors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opening Ceremony Time
                  </label>
                  <input
                    type="time"
                    value={formData.openingCeremonyTime}
                    onChange={(e) => handleFieldChange('openingCeremonyTime', e.target.value)}
                    disabled={viewMode}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Content Selection */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                Content Selection
              </h4>

              {/* Weight Classes */}
              <MultiSelect
                options={(weightClassesList?.content || []).map(wc => ({
                  value: wc.id,
                  label: `${wc.gender} - ${wc.minWeight}-${wc.maxWeight}kg`,
                }))}
                selectedValues={formData.weightClassIds}
                onChange={handleWeightClassChange}
                label="Weight Classes"
                placeholder="Select weight classes..."
                disabled={viewMode}
              />

              {/* Music Content */}
              <MultiSelect
                options={(musicContentsList?.content || []).map(music => ({
                  value: music.id,
                  label: music.name,
                }))}
                selectedValues={formData.musicPerformanceIds}
                onChange={handleMusicContentChange}
                label="Music Content"
                placeholder="Select music content..."
                disabled={viewMode}
              />

              {/* Fist Content */}
              <FistContentSelector
                fistConfigs={fistConfigs}
                fistItems={fistItems}
                selectedSelections={formData.fistConfigItemSelections}
                onChange={handleFistContentChange}
                label="Fist Content"
                disabled={viewMode}
              />
            </div>

            {/* Sparring Configuration */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                Sparring Configuration
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Rounds
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.numberOfRounds}
                    onChange={(e) => handleFieldChange('numberOfRounds', parseInt(e.target.value))}
                    disabled={viewMode}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Round Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={formData.roundDurationSeconds}
                    onChange={(e) => handleFieldChange('roundDurationSeconds', parseInt(e.target.value))}
                    disabled={viewMode}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assessor Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.assessorCount}
                    onChange={(e) => handleFieldChange('assessorCount', parseInt(e.target.value))}
                    disabled={viewMode}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Extra Rounds
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={formData.maxExtraRounds}
                    onChange={(e) => handleFieldChange('maxExtraRounds', parseInt(e.target.value))}
                    disabled={viewMode}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Injury Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="300"
                    value={formData.injuryTimeoutSeconds}
                    onChange={(e) => handleFieldChange('injuryTimeoutSeconds', parseInt(e.target.value))}
                    disabled={viewMode}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tie Break Rule
                  </label>
                  <select
                    value={formData.tieBreakRule}
                    onChange={(e) => handleFieldChange('tieBreakRule', e.target.value)}
                    disabled={viewMode}
                    className="input-field"
                  >
                    <option value="WEIGHT">Weight</option>
                    <option value="AGE">Age</option>
                    <option value="EXPERIENCE">Experience</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowExtraRound"
                    checked={formData.allowExtraRound}
                    onChange={(e) => handleFieldChange('allowExtraRound', e.target.checked)}
                    disabled={viewMode}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allowExtraRound" className="ml-2 block text-sm text-gray-900">
                    Allow Extra Round
                  </label>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            {!viewMode && (
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : competition ? 'Update Tournament' : 'Create Tournament'}
                </button>
              </div>
            )}

            {viewMode && (
              <div className="flex justify-end pt-6 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-primary"
                >
                  Close
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default CompetitionModal;
