import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  createStaff,
  updateStaff,
  fetchStaffById,
  clearCurrentStaff,
} from "../../store/slices/staffSlice";
import { fetchRoles } from "../../services/staffService";
import LoadingSpinner from "../common/LoadingSpinner";

const StaffForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { currentStaff, isLoading } = useSelector((state) => state.staff);
  const [roles, setRoles] = React.useState([]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    loadRoles();
    if (isEditing && id) dispatch(fetchStaffById(id));
    return () => {
      dispatch(clearCurrentStaff());
    };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && currentStaff)
      reset({
        name: currentStaff.name,
        email: currentStaff.email,
        role: currentStaff.role,
        qualification: currentStaff.qualification,
        contact: currentStaff.contact,
        dateOfJoining: currentStaff.dateOfJoining?.split("T")[0],
        gender: currentStaff.gender,
        address: currentStaff.address,
        bankDetails: currentStaff.bankDetails,
      });
  }, [isEditing, currentStaff, reset]);

  const loadRoles = async () => {
    try {
      const res = await fetchRoles();
      setRoles(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmit = async (data) => {
    try {
      if (isEditing) await dispatch(updateStaff({ id, data })).unwrap();
      else await dispatch(createStaff(data)).unwrap();
      navigate("/staff");
    } catch (error) {
      console.error("Failed to save staff:", error);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? "Edit Staff" : "Add New Staff"}
        </h1>
        <p className="text-gray-500 mt-1">
          {isEditing ? "Update staff information" : "Enter staff details"}
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                {...register("name", { required: "Name required" })}
                className={`w-full px-4 py-2 border rounded-lg ${errors.name ? "border-red-500" : "border-gray-300"}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Name (Optional - Max 10 chars)
              </label>
              <input
                {...register("shortName")}
                type="text"
                maxLength={10}
                placeholder="e.g., JD, SK"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                If not provided, will be auto-generated from full name
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                {...register("email", {
                  required: "Email required",
                  pattern: { value: /^\S+@\S+$/i, message: "Invalid email" },
                })}
                className={`w-full px-4 py-2 border rounded-lg ${errors.email ? "border-red-500" : "border-gray-300"}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                {...register("role", { required: "Role required" })}
                className={`w-full px-4 py-2 border rounded-lg ${errors.role ? "border-red-500" : "border-gray-300"}`}
              >
                <option value="">Select Role</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qualification *
              </label>
              <input
                {...register("qualification", {
                  required: "Qualification required",
                })}
                className={`w-full px-4 py-2 border rounded-lg ${errors.qualification ? "border-red-500" : "border-gray-300"}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number *
              </label>
              <input
                {...register("contact", { required: "Contact required" })}
                className={`w-full px-4 py-2 border rounded-lg ${errors.contact ? "border-red-500" : "border-gray-300"}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Joining *
              </label>
              <input
                type="date"
                {...register("dateOfJoining", {
                  required: "Date of joining required",
                })}
                className={`w-full px-4 py-2 border rounded-lg ${errors.dateOfJoining ? "border-red-500" : "border-gray-300"}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                {...register("gender")}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {!isEditing && "*"}
              </label>
              <input
                type="password"
                {...register("password", {
                  required: !isEditing && "Password required",
                  minLength: { value: 6, message: "Min 6 characters" },
                })}
                className={`w-full px-4 py-2 border rounded-lg ${errors.password ? "border-red-500" : "border-gray-300"}`}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate("/staff")}
            className="px-6 py-2 border rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg"
          >
            {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StaffForm;
