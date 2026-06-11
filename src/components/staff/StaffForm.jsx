// src/components/staff/StaffForm.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { createStaff, updateStaff, fetchStaffById, clearCurrentStaff } from "../../store/slices/staffSlice";
import { fetchRoles } from "../../services/staffService";
import LoadingSpinner from "../common/LoadingSpinner";

const StaffForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const { currentStaff, isLoading } = useSelector((state) => state.staff);
  const [roles, setRoles] = React.useState([]);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      employeeType: "Permanent"
    }
  });

  useEffect(() => {
    loadRoles();
    if (isEditing && id) dispatch(fetchStaffById(id));
    return () => { dispatch(clearCurrentStaff()); };
  }, [dispatch, id, isEditing]);

  useEffect(() => {
    if (isEditing && currentStaff) {
      reset({
        name: currentStaff.name,
        shortName: currentStaff.shortName || "",
        email: currentStaff.email,
        role: currentStaff.role,
        employeeType: currentStaff.employeeType || "Permanent",
        qualification: currentStaff.qualification,
        contact: currentStaff.contact,
        dateOfJoining: currentStaff.dateOfJoining?.split("T")[0],
        gender: currentStaff.gender,
        address: currentStaff.address,
        bankDetails: currentStaff.bankDetails,
      });
    }
  }, [isEditing, currentStaff, reset]);

  const loadRoles = async () => {
    try {
      const res = await fetchRoles();
      setRoles(res.data || []);
    } catch (error) { console.error(error); }
  };

  const onSubmit = async (data) => {
    try {
      if (isEditing) await dispatch(updateStaff({ id, data })).unwrap();
      else await dispatch(createStaff(data)).unwrap();
      navigate("/staff");
    } catch (error) { console.error("Failed to save staff:", error); }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{isEditing ? "Edit Staff" : "Add New Staff"}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{isEditing ? "Update staff information" : "Enter staff details"}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input {...register("name", { required: "Name required" })} className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 ${errors.name ? "border-rose-500" : "border-gray-200"}`} />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
              <input {...register("shortName")} maxLength={10} placeholder="e.g., JD" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
              <p className="text-xs text-gray-400 mt-1">Max 10 chars. Auto-generated if empty.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" {...register("email", { required: "Email required", pattern: { value: /^\S+@\S+$/i, message: "Invalid email" } })} className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.email ? "border-rose-500" : "border-gray-200"} focus:outline-none focus:ring-1 focus:ring-emerald-500`} />
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select {...register("role", { required: "Role required" })} className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.role ? "border-rose-500" : "border-gray-200"} focus:outline-none focus:ring-1 focus:ring-emerald-500`}>
                <option value="">Select Role</option>
                {roles.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee Type *</label>
              <select {...register("employeeType", { required: "Employee type required" })} className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.employeeType ? "border-rose-500" : "border-gray-200"} focus:outline-none focus:ring-1 focus:ring-emerald-500`}>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Temporary">Temporary</option>
                <option value="Part-time">Part-time</option>
                <option value="Guest">Guest</option>
              </select>
              {errors.employeeType && <p className="mt-1 text-xs text-rose-500">{errors.employeeType.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification *</label>
              <input {...register("qualification", { required: "Qualification required" })} className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.qualification ? "border-rose-500" : "border-gray-200"} focus:outline-none focus:ring-1 focus:ring-emerald-500`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
              <input {...register("contact", { required: "Contact required" })} className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.contact ? "border-rose-500" : "border-gray-200"} focus:outline-none focus:ring-1 focus:ring-emerald-500`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining *</label>
              <input type="date" {...register("dateOfJoining", { required: "Date of joining required" })} className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.dateOfJoining ? "border-rose-500" : "border-gray-200"} focus:outline-none focus:ring-1 focus:ring-emerald-500`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select {...register("gender")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500">
                <option value="">Select</option><option value="M">Male</option><option value="F">Female</option><option value="Other">Other</option>
              </select>
           </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password {!isEditing && "*"}</label>
              <input type="password" {...register("password", { required: !isEditing && "Password required", minLength: { value: 6, message: "Min 6 characters" } })} className={`w-full px-3 py-2 text-sm border rounded-lg ${errors.password ? "border-rose-500" : "border-gray-200"} focus:outline-none focus:ring-1 focus:ring-emerald-500`} />
              {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Address</h2>
          </div>
          <div className="p-4">
            <textarea {...register("address")} rows={3} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" placeholder="Street, City, State, Pincode" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Bank Details</h2>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
              <input {...register("bankDetails.accountHolderName")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input {...register("bankDetails.accountNumber")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input {...register("bankDetails.bankName")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
              <input {...register("bankDetails.ifscCode")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate("/staff")} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
            <CheckIcon className="w-4 h-4" />
            <span>{isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StaffForm;