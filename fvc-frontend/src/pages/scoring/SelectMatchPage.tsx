import { useNavigate } from "react-router-dom";

export default function SelectMatchPage() {
  const navigate = useNavigate();
  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-md p-6 max-w-2xl">
        <div className="font-bold text-lg mb-2">Chấm điểm</div>
        <p className="text-sm text-gray-600 mb-4">
          Vui lòng chọn một trận đấu để bắt đầu chấm điểm.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}




