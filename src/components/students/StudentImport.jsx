import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import {
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { importStudents, importFromSamboorna } from "../../store/slices/studentSlice";  // Fixed path
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
  const { register, handleSubmit, watch } = useForm();
  const academicYearId = watch("academicYearId");

  useEffect(() => {
    dispatch(fetchAcademicYears({ limit: 100 }));
    dispatch(fetchClasses({ limit: 100 }));
  }, [dispatch]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import Students</h1>
        <p className="text-gray-500 mt-1">
          Bulk import students from CSV or Excel files
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setImportType("standard")}
              className={`flex-1 py-2 rounded-lg font-medium ${
                importType === "standard"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Standard Import
            </button>
            <button
              onClick={() => setImportType("samboorna")}
              className={`flex-1 py-2 rounded-lg font-medium ${
                importType === "samboorna"
                  ? "bg-primary-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              Samboorna Import
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year *
              </label>
              <select
                {...register("academicYearId", { required: true })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((y) => (
                  <option key={y._id} value={y._id}>
                    {y.name}
                  </option>
                ))}
              </select>
            </div>
            {importType === "standard" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Class (Optional)
                </label>
                <select
                  {...register("classId")}
                  className="w-full px-4 py-2 border rounded-lg"
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
            {importType === "samboorna" && (
              <>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register("autoCreateClasses")}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Auto-create classes if not found
                    </span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      {...register("updateExisting")}
                      defaultChecked
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Update existing students
                    </span>
                  </label>
                </div>
              </>
            )}
            <div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500">
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {selectedFile ? selectedFile.name : "Click to upload"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    CSV or Excel files only
                  </p>
                </label>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !selectedFile}
              className="w-full bg-primary-500 text-white py-2 rounded-lg"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : "Import Students"}
            </button>
          </form>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Instructions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">File Format</h3>
              <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                {importType === "samboorna" ? (
                  <>
                    <li>studentCode (required)</li>
                    <li>fullName (required)</li>
                    <li>admissionNo (required)</li>
                    <li>className (required)</li>
                    <li>dateOfBirth (YYYY-MM-DD)</li>
                    <li>
                      fatherFullName, motherFullName, guardian, phoneNumber
                    </li>
                  </>
                ) : (
                  <>
                    <li>fullName (required)</li>
                    <li>studentCode (required)</li>
                    <li>admissionNo (required)</li>
                    <li>className (required)</li>
                    <li>dateOfBirth (YYYY-MM-DD)</li>
                    <li>fatherName, motherName, phoneNumber</li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 text-primary-600"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                <span>Download Template</span>
              </button>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800">⚠️ Notes</h3>
              <ul className="text-sm text-yellow-700 list-disc list-inside">
                <li>Student codes must be unique</li>
                <li>Duplicate codes will update existing records</li>
                <li>Date format: YYYY-MM-DD</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentImport;