import React from "react";

const projectionMock = {
  event: "FPTU Vovinam Club FALL 2025 - QUYỀN",
  format: "Quyền – Đồng đội",
  content: "Song luyện đồng đội",
  roundTime: "02:00",
  team: [
    { name: "Nguyễn Văn A", unit: "SBT #1", code: 1 },
    { name: "Trần Minh B", unit: "SBT #2", code: 2 },
    { name: "Trần Minh B", unit: "SBT #2", code: 2 },
    { name: "Lê Hoài C", unit: "SBT #3", code: 3 },
    { name: "Võ Thanh E", unit: "SBT #5", code: 5 },
    { name: "Võ Thanh E", unit: "SBT #5", code: 5 },
    { name: "Phạm Duy D", unit: "SBT #4", code: 4 },
  ],
  judges: [89, 91, 88, 92, 90],
  total: 90,
  judgeScores: [
    { score: 88, time: "00:45", judge: 3 },
    { score: 89, time: "00:33", judge: 1 },
    { score: 92, time: "00:20", judge: 4 },
  ],
  timeLeft: "01:15",
};

const ProjectionScreen: React.FC = () => {
  const data = projectionMock;
  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-start py-4">
      {/* Info Card */}
      <div className="w-full max-w-[1400px] rounded-xl bg-white px-8 py-3 mb-2 flex flex-col gap-1 shadow-sm">
        <div className="font-bold text-[20px] md:text-[18px] pb-1">
          {data.event}
        </div>
        <div className="flex flex-row flex-wrap gap-8 text-xs items-center">
          <div className="">
            <span className="font-semibold text-gray-600 mr-2">HÌNH THỨC</span>
            <span className="text-black font-medium text-[14px]">
              {data.format}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-600 mr-2">NỘI DUNG</span>
            <span className="text-black font-medium text-[14px]">
              {data.content}
            </span>
          </div>
          <div className="ml-auto text-xs bg-green-100 rounded px-4 py-1 font-semibold text-right text-[#226e39] border border-green-200 mt-2 md:mt-0">
            Thời gian thi đấu: {data.roundTime}
          </div>
        </div>
      </div>
      {/* Main Layout */}
      <div className="w-full max-w-[1400px] flex flex-col gap-6 px-2 md:px-0">
        {/* Row 1: Team & Timer */}
        <div className="grid md:grid-cols-5 grid-cols-1 gap-6">
          {/* Team: 3/5 */}
          <div className="md:col-span-3 col-span-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white rounded-xl shadow-sm p-4 min-h-[85px]">
            {data.team.map((mem, i) => (
              <div
                key={i}
                className="bg-[#fafbfc] rounded-md border border-gray-200 px-3 py-2 text-[15px] md:text-sm font-medium text-black flex flex-col text-xs sm:text-base"
              >
                <span className="font-semibold text-base md:text-base text-black">
                  {mem.name}
                </span>
                <span className="text-gray-500">Đơn vị: {mem.unit}</span>
              </div>
            ))}
          </div>
          {/* Timer: 2/5 */}
          <div className="md:col-span-2 col-span-1 flex flex-col justify-center items-center bg-white rounded-xl shadow-sm p-4 min-h-[85px] mt-3 md:mt-0">
            <div className="text-[24px] sm:text-[18px] font-semibold text-gray-500 mb-1">
              THỜI GIAN
            </div>
            <div className="text-[58px] sm:text-[40px] font-extrabold text-blue-600 leading-none tracking-wider">
              {data.timeLeft}
            </div>
          </div>
        </div>
        {/* Row 2: Judges */}
        <div className="grid md:grid-cols-5 grid-cols-2 gap-3 md:gap-6">
          {data.judges.map((score, idx) => (
            <div
              key={idx}
              className="flex flex-col text-center items-center justify-center border-2 border-gray-200 rounded-xl bg-white px-2 py-6 min-w-[65px] md:min-w-[70px] shadow-sm text-xs sm:text-base"
            >
              <div className="text-gray-500 text-[15px] md:text-[16px] mb-1 font-semibold">
                Assesor {idx + 1}
              </div>
              <div className="text-2xl md:text-2xl font-bold tracking-wide text-black">
                {score}
              </div>
            </div>
          ))}
        </div>
        {/* Row 3: Total & History */}
        <div className="grid md:grid-cols-5 grid-cols-1 gap-3 md:gap-6">
          <div className="md:col-span-2 col-span-1 bg-yellow-300 rounded-xl flex flex-col items-center justify-center min-h-[65px] md:min-h-[78px] shadow font-bold mb-3 md:mb-0">
            <div className="text-gray-600 font-semibold text-lg pb-1 pt-2 md:text-lg text-base">
              TỔNG ĐIỂM
            </div>
            <div className="text-4xl md:text-4xl font-black text-black pb-2">
              {data.total}
            </div>
          </div>
          <div className="md:col-span-3 col-span-1 bg-white rounded-xl flex flex-col justify-center border border-gray-200 p-4 min-h-[65px] md:min-h-[78px] shadow-sm overflow-auto">
            <table className="w-full text-xs sm:text-base md:text-sm text-black">
              <thead>
                <tr className="border-b text-gray-500 font-semibold">
                  <th className="text-left">#</th>
                  <th className="text-left">ĐIỂM</th>
                  <th className="text-left">THỜI GIAN</th>
                  <th className="text-left">GIÁM ĐỊNH</th>
                </tr>
              </thead>
              <tbody>
                {data.judgeScores.map((item, idx) => (
                  <tr key={idx} className="border-b last:border-b-0">
                    <td>{idx + 1}</td>
                    <td>+{item.score}</td>
                    <td>{item.time}</td>
                    <td>Assesor {item.judge}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectionScreen;
