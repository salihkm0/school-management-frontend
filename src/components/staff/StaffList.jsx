import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { fetchStaff, deleteStaff } from "../../store/slices/staffSlice";
import { fetchRoles } from "../../services/staffService";
import LoadingSpinner from "../common/LoadingSpinner";
import ConfirmModal from "../common/Modal";

const StaffList = () => {
  const dispatch = useDispatch();
  const { staff, isLoading, pagination } = useSelector((state) => state.staff);
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 20,
    search: "",
    role: "",
    isActive: "true",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [roles, setRoles] = useState([]);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    loadRoles();
    loadStaff();
  }, [searchParams]);

  const loadRoles = async () => {
    try {
      const res = await fetchRoles();
      setRoles(res.data || []);
    } catch (error) {
      console.error("Failed to load roles:", error);
    }
  };

  const loadStaff = () => {
    dispatch(fetchStaff(searchParams));
  };

  const handleSearch = (data) => {
    setSearchParams({
      ...searchParams,
      page: 1,
      search: data.search,
      role: data.role,
      isActive: data.isActive,
    });
  };

  const handleReset = () => {
    reset({ search: "", role: "", isActive: "true" });
    setSearchParams({
      page: 1,
      limit: 20,
      search: "",
      role: "",
      isActive: "true",
    });
  };

  const handleDelete = async () => {
    if (selectedStaff) {
      await dispatch(deleteStaff(selectedStaff._id));
      setShowDeleteModal(false);
      setSelectedStaff(null);
      loadStaff();
    }
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ ...searchParams, page: newPage });
  };

  if (isLoading && staff.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-1">Manage all staff members</p>
        </div>
        <Link
          to="/staff/new"
          className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Staff</span>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <form
          onSubmit={handleSubmit(handleSearch)}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <input
            {...register("search")}
            type="text"
            placeholder="Search by name, code, email..."
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          />
          <select {...register("role")} className="px-4 py-2 border rounded-lg">
            <option value="">All Roles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            {...register("isActive")}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border rounded-lg"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-lg"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Staff
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Short Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Staff Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((s) => (
              <tr key={s._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium">
                      {s.name?.charAt(0)}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {s.name}
                      </div>
                      <div className="text-xs text-gray-500">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {s.shortName || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {s.staffCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                  {s.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {s.contact}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${s.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex justify-end space-x-2">
                    <Link to={`/staff/${s._id}`} className="text-blue-600">
                      <EyeIcon className="w-5 h-5" />
                    </Link>
                    <Link
                      to={`/staff/${s._id}/edit`}
                      className="text-green-600"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedStaff(s);
                        setShowDeleteModal(true);
                      }}
                      className="text-red-600"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedStaff(null);
        }}
        onConfirm={handleDelete}
        title="Deactivate Staff"
        message={`Are you sure you want to deactivate ${selectedStaff?.name}?`}
        confirmText="Deactivate"
        confirmVariant="danger"
      />
    </div>
  );
};

export default StaffList;
