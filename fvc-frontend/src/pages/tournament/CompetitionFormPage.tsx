import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useCompetitionStore } from '../../stores/competition';
import { useWeightClassStore } from '../../stores/weightClass';
import { useFistContentStore } from '../../stores/fistContent';
import { useMusicContentStore } from '../../stores/musicContent';
import type { 
  CreateCompetitionRequest, 
  UpdateCompetitionRequest
} from '../../types';
import MultiSelect from '../../components/common/MultiSelect';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CompetitionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const isView = false; // You can add view mode later if needed

  const {
    creating,
    updating,
    createCompetition,
    updateCompetition,
    error,
    clearError,
    currentCompetition,
    fetchCompetitionById,
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
  const [activeTab, setActiveTab] = useState<'general' | 'content'>('general');

  // Load data on component mount
  useEffect(() => {
    fetchWeightClasses();
    fetchFistConfigs();
    fetchFistItems();
    fetchMusicContents();
  }, [fetchWeightClasses, fetchFistConfigs, fetchFistItems, fetchMusicContents]);

  // Load competition data if editing
  useEffect(() => {
    if (isEdit && id) {
      fetchCompetitionById(id);
    }
  }, [isEdit, id, fetchCompetitionById]);

  // Initialize form data when competition is loaded
  useEffect(() => {
    if (currentCompetition && isEdit) {
      setFormData({
        name: currentCompetition.name,
        description: currentCompetition.description || '',
        registrationStartDate: currentCompetition.registrationStartDate,
        registrationEndDate: currentCompetition.registrationEndDate,
        weighInDate: currentCompetition.weighInDate,
        startDate: currentCompetition.startDate,
        endDate: currentCompetition.endDate,
        openingCeremonyTime: currentCompetition.openingCeremonyTime || '',
        drawDate: currentCompetition.drawDate || '',
        location: currentCompetition.location || '',
        vovinamFistConfigIds: currentCompetition.vovinamFistConfigs.map(config => config.id),
        musicPerformanceIds: currentCompetition.musicPerformances.map(music => music.id),
        weightClassIds: currentCompetition.weightClasses.map(wc => wc.id),
        fistConfigItemSelections: Object.fromEntries(
          Object.entries(currentCompetition.fistConfigItemSelections).map(([configId, items]) => [
            configId,
            items.map(item => item.id)
          ])
        ),
        numberOfRounds: currentCompetition.numberOfRounds || 2,
        roundDurationSeconds: currentCompetition.roundDurationSeconds || 90,
        allowExtraRound: currentCompetition.allowExtraRound ?? true,
        maxExtraRounds: currentCompetition.maxExtraRounds || 1,
        tieBreakRule: currentCompetition.tieBreakRule || 'WEIGHT',
        assessorCount: currentCompetition.assessorCount || 5,
        injuryTimeoutSeconds: currentCompetition.injuryTimeoutSeconds || 60,
      });
    }
  }, [currentCompetition, isEdit]);

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
  const handleFistContentChange = (selectedFistConfigs: string[], selectedFistItems: Record<string, string[]>) => {
    handleFieldChange('vovinamFistConfigIds', selectedFistConfigs);
    handleFieldChange('fistConfigItemSelections', selectedFistItems);
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Tên giải đấu là bắt buộc';
    }

    if (!formData.registrationStartDate) {
      errors.registrationStartDate = 'Ngày bắt đầu đăng ký là bắt buộc';
    }

    if (!formData.registrationEndDate) {
      errors.registrationEndDate = 'Ngày kết thúc đăng ký là bắt buộc';
    }

    if (!formData.weighInDate) {
      errors.weighInDate = 'Ngày cân đo là bắt buộc';
    }

    if (!formData.startDate) {
      errors.startDate = 'Ngày bắt đầu là bắt buộc';
    }

    if (!formData.endDate) {
      errors.endDate = 'Ngày kết thúc là bắt buộc';
    }

    // Date validation
    if (formData.registrationStartDate && formData.registrationEndDate) {
      if (new Date(formData.registrationStartDate) >= new Date(formData.registrationEndDate)) {
        errors.registrationEndDate = 'Ngày kết thúc đăng ký phải sau ngày bắt đầu';
      }
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
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
      if (isEdit && id) {
        // Update existing competition
        const updateData: UpdateCompetitionRequest = { ...formData };
        const result = await updateCompetition(id, updateData);
        console.log('Update result:', result);
        if (result) {
          navigate('/tournaments');
        } else {
          console.error('Update failed - result is null');
        }
      } else {
        // Create new competition
        console.log('Creating competition with data:', formData);
        const result = await createCompetition(formData);
        console.log('Create result:', result);
        if (result) {
          console.log('Competition created successfully, navigating to /tournaments');
          navigate('/tournaments');
        } else {
          console.error('Create failed - result is null');
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/tournaments');
  };

  // Loading state
  const isLoading = creating || updating || weightClassesLoading || fistContentLoading || musicContentLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Quay lại danh sách giải đấu
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {isView ? 'Xem giải đấu' : isEdit ? 'Chỉnh sửa giải đấu' : 'Tạo giải đấu mới'}
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('general')}
              className={`${
                activeTab === 'general'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Thông tin chung
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`${
                activeTab === 'content'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Nội dung thi đấu
            </button>
          </nav>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {activeTab === 'general' && (
              <>
                {/* Basic Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">
                    Thông tin cơ bản
                  </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tên giải đấu *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    disabled={isView}
                    className={`input-field ${formErrors.name ? 'border-red-300' : ''}`}
                    placeholder="Nhập tên giải đấu"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Địa điểm
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    disabled={isView}
                    className="input-field"
                    placeholder="Nhập địa điểm tổ chức"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  disabled={isView}
                  rows={4}
                  className="input-field"
                  placeholder="Nhập mô tả về giải đấu"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                Các ngày quan trọng
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày bắt đầu đăng ký *
                  </label>
                  <input
                    type="date"
                    value={formData.registrationStartDate}
                    onChange={(e) => handleFieldChange('registrationStartDate', e.target.value)}
                    disabled={isView}
                    className={`input-field ${formErrors.registrationStartDate ? 'border-red-300' : ''}`}
                  />
                  {formErrors.registrationStartDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.registrationStartDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày kết thúc đăng ký *
                  </label>
                  <input
                    type="date"
                    value={formData.registrationEndDate}
                    onChange={(e) => handleFieldChange('registrationEndDate', e.target.value)}
                    disabled={isView}
                    className={`input-field ${formErrors.registrationEndDate ? 'border-red-300' : ''}`}
                  />
                  {formErrors.registrationEndDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.registrationEndDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày cân đo *
                  </label>
                  <input
                    type="date"
                    value={formData.weighInDate}
                    onChange={(e) => handleFieldChange('weighInDate', e.target.value)}
                    disabled={isView}
                    className={`input-field ${formErrors.weighInDate ? 'border-red-300' : ''}`}
                  />
                  {formErrors.weighInDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.weighInDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày bốc thăm
                  </label>
                  <input
                    type="date"
                    value={formData.drawDate}
                    onChange={(e) => handleFieldChange('drawDate', e.target.value)}
                    disabled={isView}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFieldChange('startDate', e.target.value)}
                    disabled={isView}
                    className={`input-field ${formErrors.startDate ? 'border-red-300' : ''}`}
                  />
                  {formErrors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFieldChange('endDate', e.target.value)}
                    disabled={isView}
                    className={`input-field ${formErrors.endDate ? 'border-red-300' : ''}`}
                  />
                  {formErrors.endDate && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giờ khai mạc
                  </label>
                  <input
                    type="time"
                    value={formData.openingCeremonyTime}
                    onChange={(e) => handleFieldChange('openingCeremonyTime', e.target.value)}
                    disabled={isView}
                    className="input-field"
                  />
                </div>
              </div>
            </div>
              </>
            )}

            {activeTab === 'content' && (
              <>
                {/* Đối kháng */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">
                    Cấu hình đối kháng
                  </h2>
                  
                  <div className="mb-6">
                    <MultiSelect
                      options={(weightClassesList?.content || []).map(wc => ({
                        value: wc.id,
                        label: `${wc.gender} - ${wc.minWeight}-${wc.maxWeight}kg`,
                      }))}
                      selectedValues={formData.weightClassIds}
                      onChange={handleWeightClassChange}
                      label="Chọn hạng cân"
                      placeholder="Chọn hạng cân..."
                      disabled={isView}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú đối kháng
                    </label>
                    <textarea
                      rows={3}
                      className="input-field"
                      placeholder="Đối kháng theo luật Vovinam quốc tế 2025."
                      disabled={isView}
                    />
                  </div>

                  {/* Cấu hình đấu tập */}
                  <div className="border-t pt-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số hiệp đấu
                        </label>
                        <input
                          type="number"
                          value={formData.numberOfRounds}
                          onChange={(e) => handleFieldChange('numberOfRounds', parseInt(e.target.value))}
                          disabled={isView}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thời gian mỗi hiệp (giây)
                        </label>
                        <input
                          type="number"
                          value={formData.roundDurationSeconds}
                          onChange={(e) => handleFieldChange('roundDurationSeconds', parseInt(e.target.value))}
                          disabled={isView}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số giám khảo
                        </label>
                        <input
                          type="number"
                          value={formData.assessorCount}
                          onChange={(e) => handleFieldChange('assessorCount', parseInt(e.target.value))}
                          disabled={isView}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thời gian nghỉ chấn thương (giây)
                        </label>
                        <input
                          type="number"
                          value={formData.injuryTimeoutSeconds}
                          onChange={(e) => handleFieldChange('injuryTimeoutSeconds', parseInt(e.target.value))}
                          disabled={isView}
                          className="input-field"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Số hiệp phụ tối đa
                        </label>
                        <input
                          type="number"
                          value={formData.maxExtraRounds}
                          onChange={(e) => handleFieldChange('maxExtraRounds', parseInt(e.target.value))}
                          disabled={isView}
                          className="input-field"
                        />
                      </div>

                      <div className="flex items-center pt-6">
                        <input
                          type="checkbox"
                          id="allowExtraRound"
                          checked={formData.allowExtraRound}
                          onChange={(e) => handleFieldChange('allowExtraRound', e.target.checked)}
                          disabled={isView}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="allowExtraRound" className="ml-2 block text-sm text-gray-900">
                          Cho phép hiệp phụ
                        </label>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quy tắc phân định thắng thua
                      </label>
                      <select
                        value={formData.tieBreakRule}
                        onChange={(e) => handleFieldChange('tieBreakRule', e.target.value)}
                        disabled={isView}
                        className="input-field"
                      >
                        <option value="WEIGHT">Cân nặng</option>
                        <option value="AGE">Tuổi</option>
                        <option value="EXPERIENCE">Kinh nghiệm</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Quyền */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">
                    Quyền
                  </h2>

                  <div className="space-y-6">
                    <MultiSelect
                      options={fistConfigs.map(config => ({
                        value: config.id,
                        label: config.name,
                      }))}
                      selectedValues={formData.vovinamFistConfigIds}
                      onChange={(selectedIds) => {
                        const selectedItems = Object.fromEntries(
                          selectedIds.map(configId => [configId, []])
                        );
                        handleFistContentChange(selectedIds, selectedItems);
                      }}
                      label="Chọn nội dung quyền"
                      placeholder="Chọn nội dung quyền..."
                      disabled={isView}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ghi chú quyền
                      </label>
                      <textarea
                        rows={3}
                        className="input-field"
                        placeholder="Quyền được thực hiện theo chuẩn Vovinam Việt Nam."
                        disabled={isView}
                      />
                    </div>
                  </div>
                </div>

                {/* Võ nhạc */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">
                    Võ nhạc
                  </h2>

                  <div className="space-y-6">
                    <MultiSelect
                      options={(musicContentsList?.content || []).map(music => ({
                        value: music.id,
                        label: music.name,
                      }))}
                      selectedValues={formData.musicPerformanceIds}
                      onChange={handleMusicContentChange}
                      label="Chọn nội dung võ nhạc"
                      placeholder="Chọn nội dung võ nhạc..."
                      disabled={isView}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ghi chú võ nhạc
                      </label>
                      <textarea
                        rows={3}
                        className="input-field"
                        placeholder="Võ nhạc sáng tạo cho phép tự do biểu diễn."
                        disabled={isView}
                      />
                    </div>
                  </div>
                </div>

              </>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            {!isView && (
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3"
                >
                  {isLoading ? 'Đang lưu...' : isEdit ? 'Cập nhật giải đấu' : 'Tạo giải đấu'}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default CompetitionFormPage;
