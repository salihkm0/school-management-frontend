import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchExams, fetchExamById } from '../../store/slices/examSlice'
import { fetchClasses } from '../../store/slices/classSlice'
import LoadingSpinner from '../common/LoadingSpinner'

const ExamSchedule = () => {
  const dispatch = useDispatch()
  const { exams } = useSelector((state) => state.exams)
  const { classes } = useSelector((state) => state.classes)
  const [selectedClass, setSelectedClass] = useState('')
  const [schedules, setSchedules] = useState([])

  useEffect(() => {
    dispatch(fetchClasses({ limit: 100 }))
    dispatch(fetchExams({ limit: 100 }))
  }, [dispatch])

  useEffect(() => {
    if (selectedClass) {
      const classExams = exams.filter(e => e.classIds?.some(c => c._id === selectedClass || c === selectedClass))
      setSchedules(classExams)
    }
  }, [selectedClass, exams])

  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-gray-900">Exam Schedule</h1><p className="text-gray-500 mt-1">View exam timetable by class</p></div>
        <div className="bg-white rounded-xl shadow-sm p-6"><label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label><select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="px-4 py-2 border rounded-lg w-64"><option value="">Select Class</option>{classes.map(c => <option key={c._id} value={c._id}>{c.displayName || c.name}</option>)}</select></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div><button onClick={() => setSelectedClass('')} className="text-primary-600 mb-4">← Back</button><h1 className="text-2xl font-bold text-gray-900">Exam Schedule - {classes.find(c => c._id === selectedClass)?.displayName}</h1></div>

      {schedules.length === 0 ? (<div className="bg-white rounded-xl shadow-sm p-12 text-center"><p className="text-gray-500">No exams scheduled for this class</p></div>) : schedules.map((exam) => (<div key={exam._id} className="bg-white rounded-xl shadow-sm overflow-hidden"><div className="px-6 py-4 bg-gray-50 border-b"><h2 className="text-lg font-semibold">{exam.displayName || exam.name}</h2><p className="text-sm text-gray-500">{new Date(exam.startDate).toLocaleDateString()} - {new Date(exam.endDate).toLocaleDateString()}</p></div><table className="min-w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left">Subject</th><th className="px-6 py-3 text-left">Date</th><th className="px-6 py-3 text-left">Session</th><th className="px-6 py-3 text-left">Time</th><th className="px-6 py-3 text-left">Max Marks</th></tr></thead><tbody>{exam.schedule?.map((s, i) => (<tr key={i} className="border-t"><td className="px-6 py-3">{s.subjectName}</td><td className="px-6 py-3">{new Date(s.examDate).toLocaleDateString()}</td><td className="px-6 py-3">{s.session}</td><td className="px-6 py-3">{s.startTime || '9:00 AM'} - {s.endTime || '12:00 PM'}</td><td className="px-6 py-3">{s.maxMarks}</td></tr>))}</tbody></table></div>))}
    </div>
  )
}

export default ExamSchedule