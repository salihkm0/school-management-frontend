import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import {
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { importStudents, importFromSamboorna } from "../../store/slices/studentSlice";
import { fetchAcademicYears } from "../../store/slices/academicYearSlice";
import { fetchClasses } from "../../store/slices/classSlice";
import { useSelector } from "react-redux";
import LoadingSpinner from "../common/LoadingSpinner";
import toast from "react-hot-toast";

const StudentImport = () => {
  const dispatch = useDispatch();
  const { academicYears } = useSelector((state) => state.academicYears);
  const { classes } = useSelector((state) => state.classes);
  const [isLoading, setIsLoading] = useState(false);
  const [importType, setImportType] = useState("standard");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const { register, handleSubmit, watch } = useForm();
  const academicYearId = watch("academicYearId");

  useEffect(() => {
    dispatch(fetchAcademicYears({ limit: 100 }));
    dispatch(fetchClasses({ limit: 100 }));
  }, [dispatch]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (file) {
      const validTypes = [
        "text/csv",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a CSV or Excel file");
        return;
      }
      setSelectedFile(file);
      toast.success(`File "${file.name}" selected`);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedFile) {
      toast.error("Please select a file to import");
      return;
    }
    setIsLoading(true);
    try {
      if (importType === "samboorna") {
        await dispatch(
          importFromSamboorna({
            file: selectedFile,
            academicYearId: data.academicYearId,
            autoCreateClasses: data.autoCreateClasses || false,
            updateExisting: data.updateExisting !== false,
          })
        ).unwrap();
        toast.success("Students imported successfully from Samboorna");
      } else {
        await dispatch(
          importStudents({
            file: selectedFile,
            academicYearId: data.academicYearId,
            classId: data.classId,
          })
        ).unwrap();
        toast.success("Students imported successfully");
      }
      setSelectedFile(null);
      document.getElementById("file-input").value = "";
    } catch (error) {
      console.error("Import failed:", error);
      toast.error(error.message || "Import failed. Please check your file format.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers =
      importType === "samboorna"
        ? [
            "studentCode",
            "fullName",
            "gender",
            "dateOfBirth",
            "admissionNo",
            "className",
            "division",
            "fatherFullName",
            "motherFullName",
            "guardian",
            "phoneNumber",
          ]
        : [
            "fullName",
            "studentCode",
            "admissionNo",
            "gender",
            "dateOfBirth",
            "className",
            "division",
            "fatherName",
            "motherName",
            "phoneNumber",
          ];
    const csvContent = [
      headers.join(","),
      headers.map(() => "").join(","),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student_import_template_${importType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Import Students</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bulk import students from CSV or Excel files</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import Form */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Import Type Tabs */}
          <div className="border-b border-gray-200 bg-gray-50/30">
            <div className="flex p-1 gap-1">
              <button
                onClick={() => setImportType("standard")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  importType === "standard"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Standard Import
              </button>
              <button
                onClick={() => setImportType("samboorna")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  importType === "samboorna"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                Samboorna Import
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("academicYearId", { required: true })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((y) => (
                  <option key={y._id} value={y._id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class (Standard Import only) */}
            {importType === "standard" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Class <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <select
                  {...register("classId")}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.displayName || c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Samboorna Options */}
            {importType === "samboorna" && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("autoCreateClasses")}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Auto-create classes if not found</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("updateExisting")}
                    defaultChecked
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Update existing students</span>
                </label>
              </div>
            )}

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File <span className="text-rose-500">*</span>
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-gray-300 hover:border-emerald-400 bg-gray-50/30"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-input").click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <CloudArrowUpIcon className={`w-10 h-10 mx-auto mb-2 transition-colors ${
                  dragActive ? "text-emerald-500" : "text-gray-400"
                }`} />
                <p className="text-sm text-gray-600">
                  {selectedFile ? (
                    <span className="font-medium text-emerald-600">{selectedFile.name}</span>
                  ) : (
                    <>Click to upload or drag and drop</>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">CSV or Excel files only</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !selectedFile || !academicYearId}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-4 h-4" />
                  <span>Import Students</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Instructions Panel */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/30">
            <h2 className="text-sm font-semibold text-gray-900">Instructions</h2>
          </div>
          <div className="p-5 space-y-5">
            {/* File Format */}
            <div>
              <h3 className="text-sm font-medium text-gray-800 mb-2">File Format</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                {importType === "samboorna" ? (
                  <>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span><code className="text-xs bg-gray-100 px-1 rounded">studentCode</code> (required)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span><code className="text-xs bg-gray-100 px-1 rounded">fullName</code> (required)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span><code className="text-xs bg-gray-100 px-1 rounded">admissionNo</code> (required)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span><code className="text-xs bg-gray-100 px-1 rounded">className</code> (required)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span><code className="text-xs bg-gray-100 px-1 rounded">dateOfBirth</code> (YYYY-MM-DD)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span>fatherFullName, motherFullName, guardian, phoneNumber</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span><code className="text-xs bg-gray-100 px-1 rounded">fullName</code> (required)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span><code className="text-xs bg-gray-100 px-1 rounded">studentCode</code> (required)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span><code className="text-xs bg-gray-100 px-1 rounded">admissionNo</code> (required)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span><code className="text-xs bg-gray-100 px-1 rounded">className</code> (required)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span>fatherName, motherName, phoneNumber</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Download Template */}
            <div className="pt-2">
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                <span>Download Template</span>
              </button>
            </div>

            {/* Notes */}
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">Important Notes</h3>
                  <ul className="mt-2 text-xs text-amber-700 space-y-1 list-disc list-inside">
                    <li>Student codes must be unique across the system</li>
                    <li>Duplicate student codes will update existing records</li>
                    <li>Date format must be <code className="bg-amber-100 px-1 rounded">YYYY-MM-DD</code></li>
                    <li>Maximum file size: 10MB</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentImport;