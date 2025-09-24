import React from 'react';

export const CallHistorySkeletonItem: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center space-x-4 shadow-sm animate-pulse">
        <div className="w-14 h-14 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-grow min-w-0 space-y-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
    </div>
);

export const UserTableSkeletonRow: React.FC = () => (
    <tr className="animate-pulse">
        <td className="px-4 py-3">
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
            </div>
        </td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div></td>
        <td className="px-4 py-3"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div></td>
        <td className="px-4 py-3">
            <div className="flex items-center space-x-2">
                <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
        </td>
    </tr>
);


export const PersonaCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col animate-pulse">
        <div className="flex items-start space-x-3 flex-grow">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
            <div className="flex-grow space-y-2">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
        </div>
        <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
    </div>
);

export const PersonaListSkeletonItem: React.FC = () => (
    <div className="flex items-start p-3 space-x-4 bg-white dark:bg-gray-800 border rounded-xl shadow-sm border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="w-12 h-12 flex-shrink-0 mt-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="flex-1 min-w-0 space-y-2 py-1">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
    </div>
);
