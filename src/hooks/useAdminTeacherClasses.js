import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStaff } from '../store/slices/staffSlice';
import { fetchTeacherClasses, fetchTeacherClassTeacherClasses } from '../store/slices/classSlice';

export const useAdminTeacherClasses = (type = 'all') => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { staff } = useSelector(state => state.staff);
  const { classes, teacherClasses, teacherClassTeacherClasses } = useSelector(state => state.classes);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchStaff({ limit: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    const loadClasses = async () => {
      if (user?.role === 'admin') {
        try {
          const { fetchClasses } = await import('../store/slices/classSlice');
          const res = await dispatch(fetchClasses({ limit: 1000 })).unwrap();
          setMyClasses(res.data || []);
        } catch (e) {
          console.error("Failed to fetch all classes for admin:", e);
          setMyClasses([]);
        }
        setLoading(false);
        return;
      }

      if (staff.length === 0) return;
      
      const currentStaff = staff.find(s => {
        const staffUserId = s.userId?._id || s.userId;
        return staffUserId === user?.id;
      });

      if (currentStaff) {
        if (type === 'class-teacher') {
          try {
            const res = await dispatch(fetchTeacherClassTeacherClasses({ teacherId: currentStaff._id })).unwrap();
            setMyClasses(res.data || []);
          } catch(e) {}
        } else {
          try {
            const res = await dispatch(fetchTeacherClasses({ teacherId: currentStaff._id })).unwrap();
            setMyClasses(res.data || []);
          } catch(e) {}
        }
      } else {
        setMyClasses([]);
      }
      setLoading(false);
    };
    
    loadClasses();
  }, [dispatch, staff, user, type]);

  return { myClasses, loading };
};
