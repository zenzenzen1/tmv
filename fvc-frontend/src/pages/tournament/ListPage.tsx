import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useCompetitionStore } from '../../stores/competition';
import { TournamentStatus, type CompetitionResponse } from '../../types';
import CommonTable from '../../components/common/CommonTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const TournamentListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    competitions,
    loading,
    error,
    filters,
    fetchCompetitions,
    setFilters,
    clearError,
  } = useCompetitionStore();

  // Load competitions on component mount
  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setFilters({ search: searchTerm, page: 0 });
    fetchCompetitions({ search: searchTerm, page: 0 });
  };

  // Handle status filter
  const handleStatusFilter = (status: TournamentStatus | '') => {
    setFilters({ status: status || undefined, page: 0 });
    fetchCompetitions({ status: status || undefined, page: 0 });
  };

  // Handle year filter
  const handleYearFilter = (year: string) => {
    setFilters({ year: year || undefined, page: 0 });
    fetchCompetitions({ year: year || undefined, page: 0 });
  };

  // Handle location filter
  const handleLocationFilter = (location: string) => {
    setFilters({ location: location || undefined, page: 0 });
    fetchCompetitions({ location: location || undefined, page: 0 });
  };


  // Handle create competition
  const handleCreateCompetition = () => {
    navigate('/manage/tournaments/create');
  };

  // Handle edit competition
  const handleEditCompetition = (competition: CompetitionResponse) => {
    navigate(`/tournaments/edit/${competition.id}`);
  };

  // Handle view competition
  const handleViewCompetition = (competition: CompetitionResponse) => {
    navigate(`/tournaments/view/${competition.id}`);
  };


  // Table columns
  const columns = [
    {
      key: 'name' as keyof CompetitionResponse,
      title: 'Tên giải đấu',
      sortable: true,
      render: (record: CompetitionResponse) => (
        <div>
          <div className="font-medium text-gray-900">{record.name}</div>
          {record?.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status' as keyof CompetitionResponse,
      title: 'Trạng thái',
      sortable: true,
      render: (record: CompetitionResponse) => <StatusBadge status={record.status} />,
    },
    {
      key: 'startDate' as keyof CompetitionResponse,
      title: 'Ngày bắt đầu',
      sortable: true,
      render: (record: CompetitionResponse) => record.startDate ? new Date(record.startDate).toLocaleDateString('vi-VN') : '-',
    },
    {
      key: 'endDate' as keyof CompetitionResponse,
      title: 'Ngày kết thúc',
      sortable: true,
      render: (record: CompetitionResponse) => record.endDate ? new Date(record.endDate).toLocaleDateString('vi-VN') : '-',
    },
    {
      key: 'location' as keyof CompetitionResponse,
      title: 'Địa điểm',
      sortable: false,
      render: (record: CompetitionResponse) => record.location || '-',
    },
    {
      key: 'numberOfParticipants' as keyof CompetitionResponse,
      title: 'Số VĐV',
      sortable: false,
      render: (record: CompetitionResponse) => record.numberOfParticipants || '-',
    },
    {
      key: 'actions' as keyof CompetitionResponse,
      title: 'Thao tác',
      sortable: false,
      render: (record: CompetitionResponse) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => record && handleViewCompetition(record)}
            className="text-gray-400 hover:text-gray-600"
            title="Xem"
          >
            <EyeIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => record && handleEditCompetition(record)}
            className="text-gray-400 hover:text-blue-600"
            title="Sửa"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (record && window.confirm('Bạn có chắc chắn muốn xóa giải đấu này?')) {
                // Handle delete - you might want to add this to the store
                console.log('Delete competition:', record.id);
              }
            }}
            className="text-gray-400 hover:text-red-600"
            title="Xóa"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // Status filter options
  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: TournamentStatus.DRAFT, label: 'Nháp' },
    { value: TournamentStatus.OPEN_REGISTRATION, label: 'Mở đăng ký' },
    { value: TournamentStatus.IN_PROGRESS, label: 'Đang diễn ra' },
    { value: TournamentStatus.FINISHED, label: 'Hoàn thành' },
    { value: TournamentStatus.CANCELLED, label: 'Đã hủy' },
  ];

  if (loading && competitions.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorMessage 
        error={error} 
        onRetry={() => {
          clearError();
          fetchCompetitions();
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý giải đấu</h1>
          <p className="text-gray-600">Quản lý các giải đấ</p>
        </div>
        <button
          onClick={handleCreateCompetition}
          className="btn-primary flex items-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Tạo giải đấu</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <input
              type="text"
              placeholder="Tìm kiếm giải đấu..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleStatusFilter(e.target.value as TournamentStatus)}
              className="input-field"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Năm
            </label>
            <input
              type="number"
              placeholder="Năm"
              value={filters.year || ''}
              onChange={(e) => handleYearFilter(e.target.value)}
              className="input-field"
            />
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa điểm
            </label>
            <input
              type="text"
              placeholder="Địa điểm"
              value={filters.location || ''}
              onChange={(e) => handleLocationFilter(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <CommonTable
          data={competitions as any || []}
          columns={columns as any}
        />
      </div>

    </div>
  );
};

export default TournamentListPage;
