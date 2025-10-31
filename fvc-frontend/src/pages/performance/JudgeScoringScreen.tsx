import React, { useState } from "react";

const JudgeScoringScreen: React.FC = () => {
  const [value, setValue] = useState("0");
  const judgeNumber = 1;
  const status = "ĐÃ KẾT NỐI";

  const handleNumClick = (num: string) => {
    if (value.length < 2) setValue(value === "0" ? num : value + num);
  };
  const handleClear = () => setValue("0");
  const handleConfirm = () => {
    alert("Điểm vừa chấm: " + value);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-[700px] bg-white border-0 rounded-xl shadow p-4 flex flex-col gap-6 items-center">
        <div className="w-full flex flex-row items-center justify-between mb-4">
          <span className="text-base text-black font-semibold">
            Giám định số: <strong>{judgeNumber}</strong>
          </span>
          <span className="px-4 py-1 rounded text-xs bg-green-100 text-green-700 border border-green-400 font-semibold">
            Trạng thái: {status}
          </span>
          <span className="text-base text-gray-700 font-medium">Sân: ?</span>
        </div>
        <div
          className="w-full relative flex flex-row items-center justify-center mb-2 mt-2"
          style={{ minHeight: "60px" }}
        >
          <div className="flex-1 flex justify-center items-center">
            <span className="text-[40px] font-bold text-black select-none">
              {value || "0"}
            </span>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <button
              aria-label="clear"
              onClick={handleClear}
              className="p-2 rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-100 transition flex items-center justify-center"
              style={{ fontSize: 28, minWidth: 40, minHeight: 40 }}
            >
              {/* Left straight arrow icon SVG */}
              <svg
                width="28"
                height="28"
                viewBox="0 0 36 36"
                fill="none"
                stroke="#111"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="31" y1="18" x2="8" y2="18" />
                <polyline points="15,25 8,18 15,11" />
              </svg>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3 mb-2 w-full justify-center">
          {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              className={`h-16 w-[96px] text-3xl rounded-lg border font-bold transition-all duration-75 ${
                ["8", "9"].includes(num)
                  ? "bg-yellow-200 border-yellow-300"
                  : "bg-gray-50 border-gray-200"
              } hover:bg-yellow-100`}
              onClick={() => handleNumClick(num)}
            >
              {num}
            </button>
          ))}
        </div>
        <button
          className="mt-8 bg-green-600 hover:bg-green-700 text-white rounded px-8 py-4 text-xl font-bold w-full max-w-md shadow"
          onClick={handleConfirm}
        >
          XÁC NHẬN
        </button>
      </div>
    </div>
  );
};

export default JudgeScoringScreen;
