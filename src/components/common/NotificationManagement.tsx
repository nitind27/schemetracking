"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiBell,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiX,
  FiFile,
  FiCalendar,
  FiLink,
  FiFilter,
  FiDownload
} from 'react-icons/fi';
import { Modal } from '@/components/ui/modal';
import Loader from '@/common/Loader';

interface Notification {
  id: number;
  title: string;
  description: string;
  link?: string;
  pdf_file?: string;
  expiry_date?: string;
  user_id?: number;
  status: 'Active' | 'Inactive';
  created_at: string;
  updated_at: string;
}

const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    link: '',
    expiry_date: '',
    pdf_file: null as File | null,
    delete_file: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [notifications, searchQuery, statusFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        toast.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.description.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(n => n.status === statusFilter);
    }

    setFilteredNotifications(filtered);
  };

  const handleAddNew = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      link: '',
      expiry_date: '',
      pdf_file: null,
      delete_file: false
    });
    setPreviewFile(null);
    setSelectedNotification(null);
    setIsModalOpen(true);
  };

  const handleEdit = (notification: Notification) => {
    setFormData({
      id: notification.id.toString(),
      title: notification.title,
      description: notification.description,
      link: notification.link || '',
      expiry_date: notification.expiry_date ? notification.expiry_date.split('T')[0] : '',
      pdf_file: null,
      delete_file: false
    });
    setPreviewFile(notification.pdf_file ? `/api/notifications/${notification.pdf_file}` : null);
    setSelectedNotification(notification);
    setIsModalOpen(true);
  };

  const handleView = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Notification deleted successfully');
        fetchNotifications();
        // Trigger refresh event for NotificationsList component
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error deleting notification');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, pdf_file: file, delete_file: false });
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewFile(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewFile(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setFormData({ ...formData, pdf_file: null, delete_file: true });
    setPreviewFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const userId = sessionStorage.getItem('user_id');
      const submitFormData = new FormData();

      if (formData.id) {
        // Update
        submitFormData.append('id', formData.id);
        submitFormData.append('title', formData.title.trim());
        submitFormData.append('description', formData.description.trim());
        submitFormData.append('link', formData.link.trim());
        submitFormData.append('expiry_date', formData.expiry_date || '');
        submitFormData.append('delete_file', formData.delete_file.toString());
        if (formData.pdf_file) {
          submitFormData.append('pdf_file', formData.pdf_file);
        }
        if (userId) {
          submitFormData.append('user_id', userId);
        }

        const response = await fetch('/api/notifications', {
          method: 'PUT',
          body: submitFormData
        });

        if (response.ok) {
          toast.success('Notification updated successfully');
          setIsModalOpen(false);
          // Reset form data
          setFormData({
            id: '',
            title: '',
            description: '',
            link: '',
            expiry_date: '',
            pdf_file: null,
            delete_file: false
          });
          setPreviewFile(null);
          setSelectedNotification(null);
          fetchNotifications();
          // Trigger refresh event for NotificationsList component
          window.dispatchEvent(new CustomEvent('refreshNotifications'));
        } else {
          const data = await response.json();
          toast.error(data.error || 'Failed to update notification');
        }
      } else {
        // Create
        submitFormData.append('title', formData.title.trim());
        submitFormData.append('description', formData.description.trim());
        submitFormData.append('link', formData.link.trim());
        submitFormData.append('expiry_date', formData.expiry_date || '');
        if (formData.pdf_file) {
          submitFormData.append('pdf_file', formData.pdf_file);
        }
        if (userId) {
          submitFormData.append('user_id', userId);
        }

        const response = await fetch('/api/notifications', {
          method: 'POST',
          body: submitFormData
        });

        if (response.ok) {
          toast.success('Notification created successfully');
          setIsModalOpen(false);
          // Reset form data
          setFormData({
            id: '',
            title: '',
            description: '',
            link: '',
            expiry_date: '',
            pdf_file: null,
            delete_file: false
          });
          setPreviewFile(null);
          fetchNotifications();
          // Trigger refresh event for NotificationsList component
          window.dispatchEvent(new CustomEvent('refreshNotifications'));
        } else {
          const data = await response.json();
          toast.error(data.error || 'Failed to create notification');
        }
      }
    } catch (error) {
      console.error('Error submitting notification:', error);
      toast.error('Error submitting notification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileType = (filename?: string): string => {
    if (!filename) return '';
    const ext = filename.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return 'image';
    }
    return 'pdf';
  };

  const isExpired = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center ">
            <FiBell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Important Notifications
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage and organize your notifications
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
        >
          <FiPlus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Notification</span>
          <span className="sm:hidden">Add</span>
        </motion.button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Active' | 'Inactive')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  S.No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                  Expiry Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No notifications found
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((notification, index) => (
                  <tr
                    key={notification.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                      <td className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </span>
                        {notification.pdf_file && (
                          <FiFile className="w-4 h-4 text-blue-500" />
                        )}
                        {notification.link && (
                          <FiLink className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {notification.description}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {notification.expiry_date ? (
                        <div className="flex items-center gap-2">
                          <FiCalendar className="w-4 h-4 text-gray-400" />
                          <span
                            className={`text-sm ${
                              isExpired(notification.expiry_date)
                                ? 'text-red-600 font-semibold'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {new Date(notification.expiry_date).toLocaleDateString('en-IN')}
                            {isExpired(notification.expiry_date) && ' (Expired)'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No expiry</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          notification.status === 'Active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {notification.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(notification)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors"
                          title="View"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(notification)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({
            id: '',
            title: '',
            description: '',
            link: '',
            expiry_date: '',
            pdf_file: null,
            delete_file: false
          });
          setPreviewFile(null);
        }}
        className="max-w-2xl mx-4 h-[550px] bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative h-full flex flex-col overflow-y-auto"
        >
          {/* Header with Gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-6 rounded-t-3xl flex-shrink-0">
            <div className="absolute inset-0 bg-black/10 rounded-t-3xl"></div>
            <div className="relative flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <FiBell className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-1">
                  {formData.id ? 'Edit Notification' : 'Create New Notification'}
                </h3>
                <p className="text-blue-100 text-sm">
                  {formData.id ? 'Update notification details' : 'Fill in the details to create a new notification'}
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-b-3xl flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                  Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <FiFile className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400"
                    required
                    placeholder="Enter notification title"
                  />
                </div>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200 resize-none placeholder-gray-400"
                  required
                  placeholder="Enter notification description"
                />
              </motion.div>

              {/* Link and Expiry Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Link */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="w-1 h-5 bg-green-500 rounded-full"></span>
                    Link (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiLink className="w-5 h-5" />
                    </div>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-all duration-200 placeholder-gray-400"
                      placeholder="https://example.com"
                    />
                  </div>
                </motion.div>

                {/* Expiry Date */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                    Expiry Date (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <FiCalendar className="w-5 h-5" />
                    </div>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                    />
                  </div>
                </motion.div>
              </div>

              {/* File Upload */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <span className="w-1 h-5 bg-orange-500 rounded-full"></span>
                  File (PDF or Image) - Optional
                </label>
                
                {previewFile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 relative group"
                  >
                    <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-lg">
                      {getFileType(formData.pdf_file?.name || selectedNotification?.pdf_file) === 'image' ? (
                        <img
                          src={previewFile}
                          alt="Preview"
                          className="w-full h-64 object-cover"
                        />
                      ) : (
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl flex flex-col items-center justify-center gap-3 min-h-[200px]">
                          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <FiFile className="w-8 h-8 text-blue-600 dark:text-blue-300" />
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                            {formData.pdf_file?.name || selectedNotification?.pdf_file}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200"></div>
                    </div>
                    <motion.button
                      type="button"
                      onClick={handleRemoveFile}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all duration-200 flex items-center justify-center"
                    >
                      <FiX className="w-5 h-5" />
                    </motion.button>
                  </motion.div>
                )}

                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={handleFileChange}
                    id="file-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                        <FiDownload className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                      </div>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PDF, JPEG, PNG, GIF, WEBP (Max 10MB)
                      </p>
                    </div>
                  </label>
                </div>
              </motion.div>

              {/* Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700"></div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-end gap-3 pt-2"
              >
                <motion.button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({
                      id: '',
                      title: '',
                      description: '',
                      link: '',
                      expiry_date: '',
                      pdf_file: null,
                      delete_file: false
                    });
                    setPreviewFile(null);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
                  whileHover={{ scale: isSubmitting || !formData.title.trim() || !formData.description.trim() ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting || !formData.title.trim() || !formData.description.trim() ? 1 : 0.98 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-sm flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiPlus className="w-5 h-5" />
                      <span>{formData.id ? 'Update Notification' : 'Create Notification'}</span>
                    </>
                  )}
                </motion.button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </Modal>

      {/* View Modal - Show Selected Notification Details */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedNotification(null);
        }}
        className="max-w-3xl mx-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative"
        >
          {/* Header with Gradient */}
          <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-6 rounded-t-3xl">
            <div className="absolute inset-0 bg-black/10 rounded-t-3xl"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <FiEye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    Notification Details
                  </h3>
                  <p className="text-blue-100 text-sm">
                    View complete notification information
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedNotification(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FiX className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          {selectedNotification && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-b-3xl space-y-6">
              {/* Notification ID Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
                    ID: #{selectedNotification.id}
                  </span>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      selectedNotification.status === 'Active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {selectedNotification.status}
                  </span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                  Title
                </label>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedNotification.title}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <span className="w-1 h-5 bg-green-500 rounded-full"></span>
                  Description
                </label>
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedNotification.description}
                  </p>
                </div>
              </div>

              {/* Link */}
              {selectedNotification.link && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="w-1 h-5 bg-purple-500 rounded-full"></span>
                    Link
                  </label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                    <a
                      href={selectedNotification.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2"
                    >
                      <FiLink className="w-4 h-4" />
                      {selectedNotification.link}
                    </a>
                  </div>
                </div>
              )}

              {/* Expiry Date */}
              {selectedNotification.expiry_date && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="w-1 h-5 bg-orange-500 rounded-full"></span>
                    Expiry Date
                  </label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-5 h-5 text-gray-400" />
                      <span
                        className={`text-gray-700 dark:text-gray-300 ${
                          isExpired(selectedNotification.expiry_date)
                            ? 'text-red-600 font-semibold'
                            : ''
                        }`}
                      >
                        {new Date(selectedNotification.expiry_date).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        {isExpired(selectedNotification.expiry_date) && (
                          <span className="ml-2 text-red-600">(Expired)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* File/PDF */}
              {selectedNotification.pdf_file && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    <span className="w-1 h-5 bg-indigo-500 rounded-full"></span>
                    Attached File
                  </label>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                    {getFileType(selectedNotification.pdf_file) === 'image' ? (
                      <div className="space-y-3">
                        <img
                          src={`/api/notifications/${selectedNotification.pdf_file}`}
                          alt={selectedNotification.title}
                          className="w-full max-h-96 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <a
                          href={`/api/notifications/${selectedNotification.pdf_file}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <FiFile className="w-4 h-4" />
                          {selectedNotification.pdf_file}
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <FiFile className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {selectedNotification.pdf_file}
                          </p>
                          <a
                            href={`/api/notifications/${selectedNotification.pdf_file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-flex items-center gap-1"
                          >
                            <FiDownload className="w-4 h-4" />
                            Download PDF
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                    Created At
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(selectedNotification.created_at).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 block">
                    Last Updated
                  </label>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(selectedNotification.updated_at).toLocaleString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <motion.button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleEdit(selectedNotification);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <FiEdit2 className="w-5 h-5" />
                  Edit Notification
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </Modal>
    </div>
  );
};

export default NotificationManagement;

