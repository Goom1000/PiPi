import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SavedClass, GradeLevel, StudentWithGrade } from '../types';

// ============================================================================
// Types
// ============================================================================

interface StudentListModalProps {
  /** Current list of student names */
  studentNames: string[];
  /** Current student grade data (from active class) */
  studentData: StudentWithGrade[];
  /** Callback to update student names */
  onUpdateStudents: (students: string[]) => void;
  /** Callback to update a student's grade */
  onUpdateGrade: (studentName: string, grade: GradeLevel | null) => void;
  /** Callback when modal should close */
  onClose: () => void;
  /** Saved classes for load dropdown */
  classes: SavedClass[];
  /** Callback to save current list as a class */
  onSaveClass: () => void;
  /** Callback to load a saved class */
  onLoadClass: (classData: SavedClass) => void;
  /** Currently active class name */
  activeClassName: string | null;
  /** Callback to open manage classes modal */
  onManageClasses: () => void;
}

// ============================================================================
// StudentListModal Component
// ============================================================================

const StudentListModal: React.FC<StudentListModalProps> = ({
  studentNames,
  studentData,
  onUpdateStudents,
  onUpdateGrade,
  onClose,
  classes,
  onSaveClass,
  onLoadClass,
  activeClassName,
  onManageClasses,
}) => {
  const [newStudentName, setNewStudentName] = useState('');
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadDropdownRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLoadDropdown) {
          setShowLoadDropdown(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showLoadDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (loadDropdownRef.current && !loadDropdownRef.current.contains(e.target as Node)) {
        setShowLoadDropdown(false);
      }
    };
    if (showLoadDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLoadDropdown]);

  // Sort students alphabetically
  const sortedStudents = useMemo(() => {
    return [...studentNames].sort((a, b) => a.localeCompare(b));
  }, [studentNames]);

  // Get grade for a student
  const getStudentGrade = (name: string): GradeLevel | null => {
    return studentData.find(s => s.name === name)?.grade ?? null;
  };

  // Count graded students
  const gradedCount = useMemo(() => {
    return studentData.filter(s => s.grade).length;
  }, [studentData]);

  // Add student handler
  const handleAddStudent = () => {
    const trimmed = newStudentName.trim();
    if (!trimmed) return;

    // Avoid duplicates
    if (!studentNames.includes(trimmed)) {
      onUpdateStudents([...studentNames, trimmed]);
    }
    setNewStudentName('');
    inputRef.current?.focus();
  };

  // Remove student handler
  const handleRemoveStudent = (name: string) => {
    onUpdateStudents(studentNames.filter(n => n !== name));
  };

  // Handle load class
  const handleLoadClass = (classData: SavedClass) => {
    onLoadClass(classData);
    setShowLoadDropdown(false);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white font-fredoka">
                Class List
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {studentNames.length} student{studentNames.length !== 1 ? 's' : ''}
                {gradedCount > 0 && (
                  <span className="ml-2 text-indigo-500 dark:text-amber-400">
                    ({gradedCount} graded)
                  </span>
                )}
              </p>
            </div>

            {/* Active Class Badge */}
            {activeClassName && (
              <div className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full text-xs font-bold">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                {activeClassName}
              </div>
            )}
          </div>
        </div>

        {/* Add Student Input */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStudent()}
              placeholder="Add student name..."
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-amber-500 focus:border-transparent transition-all"
            />
            <button
              onClick={handleAddStudent}
              disabled={!newStudentName.trim()}
              className="px-4 py-2.5 bg-indigo-600 dark:bg-amber-500 text-white dark:text-slate-900 rounded-xl hover:bg-indigo-700 dark:hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm"
            >
              Add
            </button>
          </div>
        </div>

        {/* Student List */}
        <div className="px-6 pb-4">
          <div className="max-h-64 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl">
            {sortedStudents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                  No students added yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedStudents.map((student) => {
                  const currentGrade = getStudentGrade(student);
                  const grades: GradeLevel[] = ['A', 'B', 'C', 'D', 'E'];
                  return (
                    <div
                      key={student}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Student Name */}
                      <span className="text-sm font-medium text-slate-700 dark:text-white min-w-0 truncate flex-1">
                        {student}
                      </span>

                      {/* Grade Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {grades.map((grade) => {
                          const isSelected = currentGrade === grade;
                          const colorClasses = {
                            A: isSelected ? 'bg-rose-500 text-white border-rose-500' : 'text-rose-500 border-rose-300 dark:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20',
                            B: isSelected ? 'bg-orange-500 text-white border-orange-500' : 'text-orange-500 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20',
                            C: isSelected ? 'bg-amber-500 text-white border-amber-500' : 'text-amber-500 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20',
                            D: isSelected ? 'bg-green-500 text-white border-green-500' : 'text-green-500 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20',
                            E: isSelected ? 'bg-emerald-500 text-white border-emerald-500' : 'text-emerald-500 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
                          };
                          return (
                            <button
                              key={grade}
                              onClick={() => onUpdateGrade(student, isSelected ? null : grade)}
                              className={`w-7 h-7 text-xs font-bold rounded-md border transition-all ${colorClasses[grade]}`}
                              title={isSelected ? `Remove grade ${grade}` : `Set grade to ${grade}`}
                            >
                              {grade}
                            </button>
                          );
                        })}

                        {/* Remove Student Button */}
                        <button
                          onClick={() => handleRemoveStudent(student)}
                          className="w-7 h-7 ml-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex items-center justify-center"
                          title="Remove student"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Save/Load */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3">
            {/* Save Class Button */}
            <button
              onClick={onSaveClass}
              disabled={studentNames.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 dark:bg-amber-500 text-white dark:text-slate-900 rounded-xl hover:bg-indigo-700 dark:hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Class
            </button>

            {/* Load Class Button with Dropdown */}
            <div className="relative flex-1" ref={loadDropdownRef}>
              <button
                onClick={() => setShowLoadDropdown(!showLoadDropdown)}
                disabled={classes.length === 0}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                </svg>
                Load Class
                <svg className={`w-3 h-3 transition-transform ${showLoadDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Load Dropdown */}
              {showLoadDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-10">
                  <div className="max-h-48 overflow-y-auto">
                    {classes.map((classData) => (
                      <button
                        key={classData.id}
                        onClick={() => handleLoadClass(classData)}
                        className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-slate-700 dark:text-white truncate">
                          {classData.name}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                          {classData.students.length} students
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setShowLoadDropdown(false);
                      onManageClasses();
                    }}
                    className="w-full px-4 py-2.5 text-left bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-t border-slate-200 dark:border-slate-700 text-xs font-medium text-indigo-600 dark:text-amber-400"
                  >
                    Manage Classes...
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer - Done Button */}
        <div className="p-6 pt-2">
          <button
            onClick={onClose}
            className="w-full px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentListModal;
