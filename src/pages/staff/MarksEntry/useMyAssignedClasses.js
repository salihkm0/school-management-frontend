import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClasses } from '../../../store/slices/classSlice';
import { fetchTeacherClassTeacherClasses } from '../../../store/slices/classSlice';
import { fetchStaff } from '../../../store/slices/staffSlice';

export const useMyAssignedClasses = (currentAcademicYear) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { staff } = useSelector((state) => state.staff);
  
  const [allMyClasses, setAllMyClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch staff data if needed
  useEffect(() => {
    if (staff.length === 0 && user?.role !== 'admin') {
      dispatch(fetchStaff({ limit: 1000 }));
    }
  }, [staff, dispatch, user]);

  const loadClasses = useCallback(async () => {
    if (!currentAcademicYear) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    if (user?.role === 'admin') {
      try {
        const allClassesResult = await dispatch(fetchClasses({ limit: 1000 })).unwrap();
        setAllMyClasses(allClassesResult.data || []);
      } catch (e) {
        console.error("Failed to fetch classes for admin:", e);
      }
      setIsLoading(false);
      return;
    }

    if (staff.length === 0) return; // Wait for staff

    const currentStaff = staff.find((s) => {
      const su = s.userId?._id || s.userId;
      return su === user?.id;
    });
    
    if (!currentStaff) {
      setIsLoading(false);
      return;
    }
    
    const staffId = currentStaff._id;

    try {
      const ctResult = await dispatch(
        fetchTeacherClassTeacherClasses({
          teacherId: staffId,
          academicYearId: currentAcademicYear._id,
        })
      ).unwrap();
      const ctClasses = ctResult?.data || [];

      const allClassesResult = await dispatch(fetchClasses({ limit: 1000 })).unwrap();
      const classesList = allClassesResult.data || [];

      const stClasses = classesList.filter((cls) =>
        (cls.subjectTeachers || []).some(
          (st) => st.teacherId?._id === staffId || st.teacherId === staffId
        )
      );

      const allAssigned = [...ctClasses, ...stClasses];
      const unique = Array.from(new Map(allAssigned.map((c) => [c._id, c])).values());
      setAllMyClasses(unique);
    } catch (e) {
      console.error("Failed to fetch teacher classes:", e);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, currentAcademicYear, user, staff]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses, currentAcademicYear]);

  return { allMyClasses, isLoading };
};
