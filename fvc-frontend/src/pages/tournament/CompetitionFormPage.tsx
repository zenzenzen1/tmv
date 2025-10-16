import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import {
  Box,
  Container,
  Typography,
  Button,
  Tabs,
  Tab,
  
  Card,
  CardContent,
  TextField,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useToast } from '../../components/common/ToastContext';

const CompetitionFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
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
          success('Đã cập nhật giải đấu');
        } else {
          console.error('Update failed - result is null');
          toastError('Cập nhật giải đấu thất bại');
        }
      } else {
        // Create new competition
        console.log('Creating competition with data:', formData);
        const result = await createCompetition(formData);
        console.log('Create result:', result);
        if (result) {
          console.log('Competition created successfully, navigating to /tournaments');
          navigate('/tournaments');
          success('Đã tạo giải đấu');
        } else {
          console.error('Create failed - result is null');
          toastError('Tạo giải đấu thất bại');
        }
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      toastError('Lưu giải đấu thất bại');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate('/tournaments');
  };

  // Loading state
  const isLoading = creating || updating || weightClassesLoading || fistContentLoading || musicContentLoading;

  return (
    <Box minHeight="100vh" bgcolor={(t) => t.palette.background.default}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box mb={3}>
          <Button onClick={handleCancel} startIcon={<ArrowBackIcon />} sx={{ mb: 1 }} color="inherit">
            Quay lại danh sách giải đấu
          </Button>
          <Typography variant="h4" fontWeight={700}>
            {isView ? 'Xem giải đấu' : isEdit ? 'Chỉnh sửa giải đấu' : 'Tạo giải đấu mới'}
          </Typography>
        </Box>

        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab value="general" label="Thông tin chung" />
          <Tab value="content" label="Nội dung thi đấu" />
        </Tabs>

        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <LoadingSpinner />
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {activeTab === 'general' && (
              <Stack spacing={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Thông tin cơ bản</Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
                      <Box>
                        <TextField
                          label="Tên giải đấu *"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    disabled={isView}
                    placeholder="Nhập tên giải đấu"
                          error={!!formErrors.name}
                          helperText={formErrors.name || ' '}
                          fullWidth
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="Địa điểm"
                    value={formData.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                    disabled={isView}
                    placeholder="Nhập địa điểm tổ chức"
                          fullWidth
                        />
                      </Box>
                      <Box gridColumn={{ xs: '1 / -1' }}>
                        <TextField
                          label="Mô tả"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  disabled={isView}
                          placeholder="Nhập mô tả về giải đấu"
                          fullWidth
                          multiline
                  rows={4}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Các ngày quan trọng</Typography>
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={2}>
                      <Box>
                        <TextField
                          label="Ngày bắt đầu đăng ký *"
                    type="date"
                    value={formData.registrationStartDate}
                    onChange={(e) => handleFieldChange('registrationStartDate', e.target.value)}
                    disabled={isView}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          error={!!formErrors.registrationStartDate}
                          helperText={formErrors.registrationStartDate || ' '}
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="Ngày kết thúc đăng ký *"
                    type="date"
                    value={formData.registrationEndDate}
                    onChange={(e) => handleFieldChange('registrationEndDate', e.target.value)}
                    disabled={isView}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          error={!!formErrors.registrationEndDate}
                          helperText={formErrors.registrationEndDate || ' '}
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="Ngày cân đo *"
                    type="date"
                    value={formData.weighInDate}
                    onChange={(e) => handleFieldChange('weighInDate', e.target.value)}
                    disabled={isView}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          error={!!formErrors.weighInDate}
                          helperText={formErrors.weighInDate || ' '}
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="Ngày bốc thăm"
                    type="date"
                    value={formData.drawDate}
                    onChange={(e) => handleFieldChange('drawDate', e.target.value)}
                    disabled={isView}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="Ngày bắt đầu *"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleFieldChange('startDate', e.target.value)}
                    disabled={isView}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          error={!!formErrors.startDate}
                          helperText={formErrors.startDate || ' '}
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="Ngày kết thúc *"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleFieldChange('endDate', e.target.value)}
                    disabled={isView}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          error={!!formErrors.endDate}
                          helperText={formErrors.endDate || ' '}
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="Giờ khai mạc"
                    type="time"
                    value={formData.openingCeremonyTime}
                    onChange={(e) => handleFieldChange('openingCeremonyTime', e.target.value)}
                    disabled={isView}
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Stack>
            )}

            {activeTab === 'content' && (
              <Stack spacing={3}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Cấu hình đối kháng</Typography>
                    <Box sx={{ mb: 2 }}>
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
                    </Box>
                    <TextField
                      label="Ghi chú đối kháng"
                      placeholder="Đối kháng theo luật Vovinam quốc tế 2025."
                      disabled={isView}
                      fullWidth
                      multiline
                      rows={3}
                      sx={{ mb: 2 }}
                    />

                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr 1fr' }} gap={2}>
                      <Box>
                        <TextField
                          label="Số hiệp đấu"
                          type="number"
                          value={formData.numberOfRounds}
                          onChange={(e) => handleFieldChange('numberOfRounds', parseInt(e.target.value))}
                          disabled={isView}
                          fullWidth
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="Thời gian mỗi hiệp (giây)"
                          type="number"
                          value={formData.roundDurationSeconds}
                          onChange={(e) => handleFieldChange('roundDurationSeconds', parseInt(e.target.value))}
                          disabled={isView}
                          fullWidth
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="Số giám khảo"
                          type="number"
                          value={formData.assessorCount}
                          onChange={(e) => handleFieldChange('assessorCount', parseInt(e.target.value))}
                          disabled={isView}
                          fullWidth
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="Thời gian nghỉ chấn thương (giây)"
                          type="number"
                          value={formData.injuryTimeoutSeconds}
                          onChange={(e) => handleFieldChange('injuryTimeoutSeconds', parseInt(e.target.value))}
                          disabled={isView}
                          fullWidth
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="Số hiệp phụ tối đa"
                          type="number"
                          value={formData.maxExtraRounds}
                          onChange={(e) => handleFieldChange('maxExtraRounds', parseInt(e.target.value))}
                          disabled={isView}
                          fullWidth
                        />
                      </Box>
                      <Box display="flex" alignItems="center">
                        <FormControlLabel
                          control={
                            <Checkbox
                          checked={formData.allowExtraRound}
                          onChange={(e) => handleFieldChange('allowExtraRound', e.target.checked)}
                          disabled={isView}
                            />
                          }
                          label="Cho phép hiệp phụ"
                        />
                      </Box>
                    </Box>

                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel id="tiebreak-label">Quy tắc phân định thắng thua</InputLabel>
                      <Select
                        labelId="tiebreak-label"
                        label="Quy tắc phân định thắng thua"
                        value={formData.tieBreakRule}
                        onChange={(e) => handleFieldChange('tieBreakRule', e.target.value)}
                        disabled={isView}
                      >
                        <MenuItem value="WEIGHT">Cân nặng</MenuItem>
                        <MenuItem value="AGE">Tuổi</MenuItem>
                        <MenuItem value="EXPERIENCE">Kinh nghiệm</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Quyền</Typography>
                    <Stack spacing={2}>
                    <MultiSelect
                        options={fistConfigs.map(config => ({ value: config.id, label: config.name }))}
                      selectedValues={formData.vovinamFistConfigIds}
                      onChange={(selectedIds) => {
                          const selectedItems = Object.fromEntries(selectedIds.map(configId => [configId, []]));
                        handleFistContentChange(selectedIds, selectedItems);
                      }}
                      label="Chọn nội dung quyền"
                      placeholder="Chọn nội dung quyền..."
                      disabled={isView}
                    />
                      <TextField
                        label="Ghi chú quyền"
                        placeholder="Quyền được thực hiện theo chuẩn Vovinam Việt Nam."
                        disabled={isView}
                        fullWidth
                        multiline
                        rows={3}
                      />
                    </Stack>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Võ nhạc</Typography>
                    <Stack spacing={2}>
                    <MultiSelect
                        options={(musicContentsList?.content || []).map(music => ({ value: music.id, label: music.name }))}
                      selectedValues={formData.musicPerformanceIds}
                      onChange={handleMusicContentChange}
                      label="Chọn nội dung võ nhạc"
                      placeholder="Chọn nội dung võ nhạc..."
                      disabled={isView}
                    />
                      <TextField
                        label="Ghi chú võ nhạc"
                        placeholder="Võ nhạc sáng tạo cho phép tự do biểu diễn."
                        disabled={isView}
                        fullWidth
                        multiline
                        rows={3}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            )}

            {!isView && (
              <Box display="flex" justifyContent="flex-end" gap={2} pt={3}>
                <Button type="button" onClick={handleCancel} variant="outlined" color="inherit">
                  Hủy
                </Button>
                <Button type="submit" disabled={isLoading} variant="contained">
                  {isLoading ? 'Đang lưu...' : isEdit ? 'Cập nhật giải đấu' : 'Tạo giải đấu'}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default CompetitionFormPage;
