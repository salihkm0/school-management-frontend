// src/components/staff/StaffList.jsx
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { fetchStaff, deleteStaff } from "../../store/slices/staffSlice";
import { fetchRoles } from "../../services/staffService";
import LoadingSpinner from "../common/LoadingSpinner";

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
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [roles, setRoles] = useState([]);
  const menuRef = useRef(null);
  const { register, handleSubmit, reset, watch } = useForm();

  useEffect(() => {
    loadRoles();
    loadStaff();
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setShowFilters(false);
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
    setShowFilters(false);
  };

  const handleDelete = async () => {
    if (selectedStaff) {
      await dispatch(deleteStaff(selectedStaff._id));
      setShowDeleteModal(false);
      setSelectedStaff(null);
      setOpenMenuId(null);
      loadStaff();
    }
  };

  const handlePageChange = (newPage) => {
    setSearchParams({ ...searchParams, page: newPage });
  };

  const hasActiveFilters = searchParams.search || searchParams.role || searchParams.isActive !== "true";

  if (isLoading && staff.length === 0) return <LoadingSpinner />;

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all staff members</p>
        </div>
        <Link
          to="/staff/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-all shadow-sm"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Add Staff</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, code, email..."
            {...register("search")}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white transition-all"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              showFilters || hasActiveFilters
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            <FunnelIcon className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                {Object.values(searchParams).filter(v => v && v !== "true").length}
              </span>
            )}
          </button>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <form onSubmit={handleSubmit(handleSearch)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select {...register("role")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white">
                  <option value="">All Roles</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select {...register("isActive")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={handleReset} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded-lg transition-colors">Reset</button>
              <button type="submit" className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">Apply Filters</button>
            </div>
          </form>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs sm:text-sm text-gray-500">
          {pagination.total > 0 ? (
            <>Showing <span className="font-medium text-gray-900">{((pagination.page - 1) * pagination.limit) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium text-gray-900">{pagination.total}</span> staff</>
          ) : (
            'No staff found'
          )}
        </p>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Short Name</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Staff Code</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm text-gray-500">No staff found</p>
                      <Link to="/staff/new" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Add your first staff →</Link>
                    </div>
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-emerald-700">{s.name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{s.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[100px] sm:max-w-none">{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{s.shortName || "-"}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 font-mono hidden sm:table-cell">{s.staffCode}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 capitalize">{s.role}</td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">{s.contact}</td>
                    <td className="px-3 sm:px-4 py-3 hidden lg:table-cell">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20" : "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20"}`}>
                        {s.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right">
                      <div className="hidden sm:flex items-center justify-end gap-1">
                        <Link to={`/staff/${s._id}`} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"><EyeIcon className="w-4 h-4" /></Link>
                        <Link to={`/staff/${s._id}/edit`} className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"><PencilIcon className="w-4 h-4" /></Link>
                        <button onClick={() => { setSelectedStaff(s); setShowDeleteModal(true); }} className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                      </div>
                      <div className="relative sm:hidden" ref={menuRef}>
                        <button onClick={() => setOpenMenuId(openMenuId === s._id ? null : s._id)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                          <EllipsisVerticalIcon className="w-5 h-5" />
                        </button>
                        {openMenuId === s._id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                            <Link to={`/staff/${s._id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpenMenuId(null)}><EyeIcon className="w-4 h-4" /> View</Link>
                            <Link to={`/staff/${s._id}/edit`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpenMenuId(null)}><PencilIcon className="w-4 h-4" /> Edit</Link>
                            <button onClick={() => { setSelectedStaff(s); setShowDeleteModal(true); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"> <TrashIcon className="w-4 h-4" /> Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-3 sm:px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">Page {pagination.page} of {pagination.pages}</div>
            <div className="flex items-center justify-center gap-1">
              <button onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50"><ChevronLeftIcon className="w-4 h-4" /></button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum = pagination.pages <= 5 ? i + 1 : pagination.page <= 3 ? i + 1 : pagination.page >= pagination.pages - 2 ? pagination.pages - 4 + i : pagination.page - 2 + i;
                  return <button key={pageNum} onClick={() => handlePageChange(pageNum)} className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 px-1.5 sm:px-2 text-xs sm:text-sm rounded-lg transition-colors ${pagination.page === pageNum ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{pageNum}</button>
                })}
              </div>
              <button onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg disabled:opacity-50"><ChevronRightIcon className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center"><TrashIcon className="w-5 h-5 text-rose-600" /></div>
                <div><h3 className="text-base sm:text-lg font-semibold text-gray-900">Deactivate Staff</h3><p className="text-xs sm:text-sm text-gray-500">This action can be reversed later.</p></div>
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6">Are you sure you want to deactivate <span className="font-medium text-gray-900">{selectedStaff?.name}</span>?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700">Deactivate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffList;