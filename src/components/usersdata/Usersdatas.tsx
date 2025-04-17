"use client"
import React, { useState } from 'react';


import { RowDataPacket } from "mysql2";

interface User extends RowDataPacket {
  user_id: number;
  name: string;
  user_category_id: number;
  username: string;
  password: string;
  contact_no: string;
  address: string;
  taluka_id: number;
  village_id: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}
const Usersdatas = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    user_category_id: '',
    username: '',
    password: '',
    contact_no: '',
    address: '',
    taluka_id: '',
    village_id: '',
    status: 'active'
  });

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/users/insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setModalVisible(false);
        setFormData({
          name: '',
          user_category_id: '',
          username: '',
          password: '',
          contact_no: '',
          address: '',
          taluka_id: '',
          village_id: '',
          status: 'active'
        });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error inserting user:', error);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <button 
        onClick={() => setModalVisible(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Add User
      </button>

      {modalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center ">
          <div className="bg-white ml-96 p-6 rounded-lg w-[750px] max-h-[80vh] mt-16 overflow-y-auto ">
            <h2 className="text-xl mb-4">Add New User</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-1">Full Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">User Category ID:</label>
                <input
                  type="number"
                  value={formData.user_category_id}
                  onChange={(e) => setFormData({...formData, user_category_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Username:</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Password:</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Contact Number:</label>
                <input
                  type="tel"
                  value={formData.contact_no}
                  onChange={(e) => setFormData({...formData, contact_no: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Address:</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Taluka ID:</label>
                <input
                  type="number"
                  value={formData.taluka_id}
                  onChange={(e) => setFormData({...formData, taluka_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Village ID:</label>
                <input
                  type="number"
                  value={formData.village_id}
                  onChange={(e) => setFormData({...formData, village_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1">Status:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalVisible(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">ID</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Username</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Contact</th>
            <th className="border p-2">Address</th>
            <th className="border p-2">Taluka</th>
            <th className="border p-2">Village</th>
            <th className="border p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.user_id} className="hover:bg-gray-50">
              <td className="border p-2">{user.user_id}</td>
              <td className="border p-2">{user.name}</td>
              <td className="border p-2">{user.username}</td>
              <td className="border p-2">{user.user_category_id}</td>
              <td className="border p-2">{user.contact_no}</td>
              <td className="border p-2">{user.address}</td>
              <td className="border p-2">{user.taluka_id}</td>
              <td className="border p-2">{user.village_id}</td>
              <td className="border p-2 capitalize">{user.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Usersdatas;
