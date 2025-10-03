import React from "react";

export type FormPreviewData = {
  title: string;
  description: string;
  fullName: string;
  email: string;
  studentId: string;
  club: string;
  gender: string;
  competitionType: string;
  weightClass?: string;
  quyenCategory?: string;
  musicCategory?: string;
  coachName: string;
  phoneNumber: string;
  phoneRequired: boolean;
  questions?: Array<{
    id: string;
    type: string;
    label: string;
    options?: string[];
  }>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  data: FormPreviewData;
  selectedFileName?: string;
};

export default function FormPreviewModal({
  open,
  onClose,
  data,
  selectedFileName,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-3xl rounded-xl bg-white shadow-2xl border border-gray-200 max-h-[85vh] overflow-y-auto pt-10">
        <div className="px-4 py-2 text-sm font-semibold text-gray-600"></div>
        <div className="p-4">
          <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-4 shadow">
            <div className="mb-3 text-[#2563eb] font-bold">
              {data.title || "Đăng Ký Giải Vovinam 2025"}
            </div>
            <div className="mb-4 text-sm text-gray-600">
              {data.description ||
                "Form dành cho sinh viên tham gia giải Vovinam."}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  defaultValue={data.fullName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  defaultValue={data.email}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MSSV
                  </label>
                  <input
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    defaultValue={data.studentId}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CLB
                  </label>
                  <input
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    defaultValue={data.club}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giới tính
                </label>
                <div className="flex items-center gap-6 text-sm">
                  {[
                    { value: "male", label: "Nam" },
                    { value: "female", label: "Nữ" },
                    { value: "other", label: "Khác" },
                  ].map((g) => (
                    <label
                      key={g.value}
                      className="inline-flex items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="preview-gender"
                        defaultChecked={data.gender === g.value}
                      />
                      <span>{g.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Nội dung thi đấu
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Hạng cân (Đối kháng)
                    </label>
                    <input
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={data.weightClass || ""}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Quyền
                    </label>
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      {(
                        [
                          "Đơn luyện",
                          "Đa luyện",
                          "Song Luyện",
                          "Đồng Đội",
                        ] as string[]
                      ).map((c) => (
                        <span
                          key={c}
                          className={`rounded-full border px-3 py-1.5 text-xs ${
                            data.quyenCategory === c
                              ? "border-blue-500 text-blue-600 bg-blue-50"
                              : "border-gray-300 text-gray-700 bg-white"
                          }`}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <input
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={data.quyenCategory || ""}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Nội dung Võ nhạc
                    </label>
                    <input
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      value={data.musicCategory || ""}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thẻ sinh viên
                </label>
                <div className="inline-flex items-center gap-2">
                  <span className="rounded-md bg-gray-100 px-3 py-1.5 text-sm border border-gray-300">
                    Chọn file
                  </span>
                  <span className="text-sm text-gray-500">
                    {selectedFileName || "Chưa có tệp"}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SDT liên lạc{data.phoneRequired ? " *" : ""}
                </label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  defaultValue={data.phoneNumber}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Huấn luyện viên quản lý
                </label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  defaultValue={data.coachName}
                />
              </div>
            </div>

            {data.questions && data.questions.length > 0 && (
              <div className="mt-4 space-y-3">
                {data.questions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {q.label}
                    </label>
                    {q.type === "short-answer" && (
                      <input
                        disabled
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                        placeholder="Trả lời ngắn"
                      />
                    )}
                    {q.type === "dropdown" && (
                      <select
                        disabled
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                      >
                        {(q.options ?? ["Tùy chọn 1"]).map((o, i) => (
                          <option key={i}>{o}</option>
                        ))}
                      </select>
                    )}
                    {q.type === "multiple-choice" && (
                      <div className="space-y-1 border border-gray-200 rounded-md p-3">
                        {(q.options ?? ["Lựa chọn 1"]).map((o, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 text-sm text-gray-700"
                          >
                            <input type="radio" disabled />
                            {o}
                          </label>
                        ))}
                      </div>
                    )}
                    {q.type === "checkbox" && (
                      <div className="space-y-1 border border-gray-200 rounded-md p-3">
                        {(q.options ?? ["Lựa chọn 1"]).map((o, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 text-sm text-gray-700"
                          >
                            <input type="checkbox" disabled />
                            {o}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <button className="rounded border border-gray-300 px-3 py-1.5 text-sm">
                Lưu nháp
              </button>
              <button className="rounded bg-[#377CFB] px-3 py-1.5 text-sm text-white">
                Gửi Form
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-sm shadow z-10"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
