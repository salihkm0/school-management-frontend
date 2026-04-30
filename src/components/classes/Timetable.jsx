import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { fetchClassById, updateTimetable } from "../../store/slices/classSlice";
import { fetchStaff } from "../../store/slices/staffSlice";
import LoadingSpinner from "../common/LoadingSpinner";
import toast from "react-hot-toast";

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const timeSlots = [
  { period: 1, start: "09:00", end: "10:00", label: "1st Period (9:00-10:00)" },
  {
    period: 2,
    start: "10:00",
    end: "11:00",
    label: "2nd Period (10:00-11:00)",
  },
  {
    period: 3,
    start: "11:00",
    end: "12:00",
    label: "3rd Period (11:00-12:00)",
  },
  { period: 4, start: "12:00", end: "13:00", label: "4th Period (12:00-1:00)" },
  { period: 5, start: "14:00", end: "15:00", label: "5th Period (2:00-3:00)" },
  { period: 6, start: "15:00", end: "16:00", label: "6th Period (3:00-4:00)" },
  { period: 7, start: "16:00", end: "17:00", label: "7th Period (4:00-5:00)" },
];

const Timetable = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentClass, isLoading } = useSelector((state) => state.classes);
  const { staff } = useSelector((state) => state.staff);
  const [timetable, setTimetable] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchClassById(id));
    dispatch(fetchStaff({ limit: 100, role: "teacher" }));
  }, [dispatch, id]);

  useEffect(() => {
    if (currentClass?.timetable && currentClass.timetable.length > 0) {
      setTimetable(currentClass.timetable);
    } else {
      const emptyTimetable = days.map((day) => ({
        day,
        periods: timeSlots.map((slot) => ({
          period: slot.period,
          startTime: slot.start,
          endTime: slot.end,
          subjectId: "",
          teacherId: "",
          room: "",
        })),
      }));
      setTimetable(emptyTimetable);
    }
  }, [currentClass]);

  const updateCell = (dayIndex, periodIndex, field, value) => {
    const newTimetable = [...timetable];
    newTimetable[dayIndex].periods[periodIndex][field] = value;
    setTimetable(newTimetable);
  };

  const getSubjectName = (subjectId) => {
    const subject = currentClass?.subjects?.find((s) => s._id === subjectId);
    return subject?.name || subjectId;
  };

  const getTeacherName = (teacherId) => {
    const teacher = staff.find((s) => s._id === teacherId);
    return teacher?.name || teacherId;
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateTimetable({ id, timetable });
      toast.success("Timetable saved successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to save timetable");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyDay = (fromDayIndex, toDayIndex) => {
    const newTimetable = [...timetable];
    newTimetable[toDayIndex].periods = JSON.parse(
      JSON.stringify(newTimetable[fromDayIndex].periods),
    );
    setTimetable(newTimetable);
    toast.success(
      `Copied schedule from ${days[fromDayIndex]} to ${days[toDayIndex]}`,
    );
  };

  const handleClearDay = (dayIndex) => {
    const newTimetable = [...timetable];
    newTimetable[dayIndex].periods = newTimetable[dayIndex].periods.map(
      (p) => ({
        ...p,
        subjectId: "",
        teacherId: "",
        room: "",
      }),
    );
    setTimetable(newTimetable);
    toast.success(`Cleared schedule for ${days[dayIndex]}`);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => navigate(`/classes/${id}`)}
            className="text-primary-600 mb-2"
          >
            ← Back to Class
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Class Timetable - {currentClass?.displayName}
          </h1>
          <p className="text-gray-500 mt-1">Manage weekly class schedule</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg"
        >
          {isEditing ? "Cancel Edit" : "Edit Timetable"}
        </button>
      </div>

      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-blue-800 mb-2">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            {days.map((day, idx) => (
              <div key={day} className="flex items-center space-x-1">
                <span className="text-sm font-medium">{day}:</span>
                <button
                  onClick={() => handleClearDay(idx)}
                  className="text-xs text-red-600"
                >
                  Clear
                </button>
                {idx > 0 && (
                  <button
                    onClick={() => handleCopyDay(0, idx)}
                    className="text-xs text-green-600"
                  >
                    Copy Mon
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 border text-left">Day / Period</th>
                {timeSlots.map((slot) => (
                  <th
                    key={slot.period}
                    className="px-4 py-3 border text-center text-sm"
                  >
                    {slot.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timetable.map((dayData, dayIndex) => (
                <tr key={dayData.day}>
                  <td className="px-4 py-3 border font-medium bg-gray-50">
                    {dayData.day}
                  </td>
                  {dayData.periods.map((period, periodIndex) => (
                    <td
                      key={periodIndex}
                      className="px-4 py-2 border align-top"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <select
                            value={period.subjectId}
                            onChange={(e) =>
                              updateCell(
                                dayIndex,
                                periodIndex,
                                "subjectId",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-1 text-sm border rounded"
                          >
                            <option value="">Select Subject</option>
                            {currentClass?.subjects?.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={period.teacherId}
                            onChange={(e) =>
                              updateCell(
                                dayIndex,
                                periodIndex,
                                "teacherId",
                                e.target.value,
                              )
                            }
                            className="w-full px-2 py-1 text-sm border rounded"
                          >
                            <option value="">Select Teacher</option>
                            {staff.map((s) => (
                              <option key={s._id} value={s._id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={period.room}
                            onChange={(e) =>
                              updateCell(
                                dayIndex,
                                periodIndex,
                                "room",
                                e.target.value,
                              )
                            }
                            placeholder="Room No"
                            className="w-full px-2 py-1 text-sm border rounded"
                          />
                        </div>
                      ) : (
                        <div className="text-center">
                          {period.subjectId ? (
                            <>
                              <div className="font-medium text-sm">
                                {getSubjectName(period.subjectId)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {getTeacherName(period.teacherId)}
                              </div>
                              {period.room && (
                                <div className="text-xs text-gray-400">
                                  Room: {period.room}
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isEditing && (
          <div className="p-4 border-t flex justify-end space-x-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-2 border rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg"
            >
              {isSubmitting ? "Saving..." : "Save Timetable"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timetable;
