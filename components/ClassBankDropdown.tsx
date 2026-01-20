import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SavedClass } from '../types';

// ============================================================================
// Types
// ============================================================================

interface ClassBankDropdownProps {
  /** List of saved classes to display */
  classes: SavedClass[];
  /** Callback when user selects a class to load */
  onLoad: (classData: SavedClass) => void;
  /** Callback when dropdown should close (click outside, escape key) */
  onClose: () => void;
  /** Callback when user clicks "Manage Classes..." */
  onManage: () => void;
  /** Reference to the anchor element (button) for positioning */
  anchorRef: React.RefObject<HTMLButtonElement>;
}

// ============================================================================
// ClassBankDropdown Component
// ============================================================================

/**
 * Dropdown menu for loading saved classes from the class bank.
 *
 * Features:
 * - Displays class name and student count for each saved class
 * - Click-outside detection to close
 * - Escape key closes dropdown
 * - Hover states for list items
 * - Empty state (defensive, shouldn't appear since button is disabled when empty)
 * - Uses portal to escape overflow containers
 *
 * Position: Fixed, positioned below anchor element via portal
 */
const ClassBankDropdown: React.FC<ClassBankDropdownProps> = ({
  classes,
  onLoad,
  onClose,
  onManage,
  anchorRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position based on anchor element
  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4, // 4px gap below button
        left: rect.left,
      });
    }
  }, [anchorRef]);

  // Handle click outside to close
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose, anchorRef]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const dropdownContent = (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
      }}
      className="w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[9999] animate-fade-in"
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Load Class
        </span>
      </div>

      {/* Class List */}
      {classes.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">
            No saved classes
          </p>
        </div>
      ) : (
        <>
          <div className="max-h-64 overflow-y-auto">
            {classes.map((classData) => (
              <button
                key={classData.id}
                onClick={() => onLoad(classData)}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-between group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-700 dark:text-white truncate">
                    {classData.name}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {classData.students.length} student{classData.students.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-amber-400 transition-colors shrink-0 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            ))}
          </div>

          {/* Manage Classes Footer */}
          <div className="border-t border-slate-100 dark:border-slate-700">
            <button
              onClick={() => {
                onManage();
                onClose();
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 group"
            >
              <svg
                className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-amber-400 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-amber-400 transition-colors">
                Manage Classes...
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );

  // Render via portal to escape overflow containers
  return createPortal(dropdownContent, document.body);
};

export default ClassBankDropdown;
