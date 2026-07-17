import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchClasses, fetchTeacherClasses } from '../../../store/slices/classSlice';
import { fetchStaff } from '../../../store/slices/staffSlice';

export const useMyAssignedClasses = (currentAcademicYear) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { staff } = useSelector((state) => state.staff);
  
  const [allMyClasses, setAllMyClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch staff data if needed
  useEffect(() => {
    if (staff.length === 0) {
      if (user?.role !== 'admin' || window.location.pathname.includes('/staff/')) {
        dispatch(fetchStaff({ limit: 1000 }));
      }
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
        const result = await dispatch(
          fetchClasses({
            academicYearId: currentAcademicYear._id,
            limit: 1000 // Get all classes
          })
        ).unwrap();
        setAllMyClasses(result.data || []);
      } catch (e) {
        console.error("Failed to fetch all classes for admin:", e);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const currentStaff = staff.find(s => {
      const staffUserId = s.userId?._id || s.userId;
      return staffUserId === user?.id;
    });
    
    if (!currentStaff) {
      setIsLoading(false);
      return;
    }
    
    const staffId = currentStaff._id;

    try {
      // Use the proper backend endpoint to get classes where teacher is involved
      const result = await dispatch(
        fetchTeacherClasses({
          teacherId: staffId,
          academicYearId: currentAcademicYear._id,
        })
      ).unwrap();
      
      setAllMyClasses(result.data || []);
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
