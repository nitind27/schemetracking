"use client";

import { useEffect, useState } from 'react';

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import Button from "../ui/button/Button";

import { toast } from 'react-toastify';

import { UserData } from './Userdata';

const Usersdatas = () => {
  const [data, setData] = useState<UserData[]>([]);

  const [usercategory, setUsercategory] = useState('');
  const [shemeyear, setSchemeyear] = useState('');
  const [name, setName] = useState('');
  const [Contact, setContact] = useState('');
  const [Username, setUsername] = useState('');
  const [Password, setPassword] = useState('');
  const [address, setaddress] = useState('');
  const [Taluka, setTaluka] = useState('');
  const [Village, setVillage] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);


  const handleSave = async () => {

    const apiUrl = editId ? `/api/users/insert` : '/api/users/insert';
    const method = editId ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({

          name: name,
          user_category_id: usercategory,
          username: Username,
          password: Password,
          contact_no: Contact,
          address: address,
          taluka_id: Taluka,
          village_id: Village,
          status: "Active"

        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success(editId
        ? 'Category updated successfully!'
        : 'Category created successfully!');

   
      setEditId(null);
      fetchData();

    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(editId
        ? 'Failed to update category. Please try again.'
        : 'Failed to create category. Please try again.');
    }
  };


  const handleDelete = async (id: number) => {
    try {
      const response = await fetch('/api/usercategorycrud', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id : id })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleEdit = (item: UserData) => {
    console.log(item)
    // setInputValue(item.category_name);
    // setEditId(item.user_category_id);
  };

  const columns: Column<UserData>[] = [

    {
      key: 'name',
      label: 'Name',
      accessor: 'name',
      render: (data) => <span>{data.name}</span>
    },
    {
      key: 'user_category_id',
      label: 'User Category',
      accessor: 'user_category_id',
      render: (data) => <span>{data.user_category_id}</span>
    },
    {
      key: 'username',
      label: 'User Name',
      accessor: 'username',
      render: (data) => <span>{data.username}</span>
    },
    {
      key: 'password',
      label: 'Password',
      accessor: 'password',
      render: (data) => <span>{data.password}</span>
    },
    {
      key: 'contact_no',
      label: 'Contact No',
      accessor: 'contact_no',
      render: (data) => <span>{data.contact_no}</span>
    },
    {
      key: 'address',
      label: 'Address',
      accessor: 'address',
      render: (data) => <span>{data.address}</span>
    },
    {
      key: 'taluka_id',
      label: 'Taluka',
      accessor: 'taluka_id',
      render: (data) => <span>{data.taluka_id}</span>
    },
    {
      key: 'village_id',
      label: 'Village',
      accessor: 'village_id',
      render: (data) => <span>{data.village_id}</span>
    },
    {
      key: 'status',
      label: 'Status',
      accessor: 'status',
      render: (data) => <span>{data.status}</span>
    },
    {
      key: 'taluka_id',
      label: 'Taluka',
      accessor: 'taluka_id',
      render: (data) => <span>{data.taluka_id}</span>
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (data) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleEdit(data)}>
            Edit
          </Button>
          <Button
            size="sm"

            onClick={() => handleDelete(data.user_id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="p-4">

      <ReusableTable
        data={data}
        classname={"h-[550px] overflow-y-auto scrollbar-hide"}
        inputfiled={
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-1">
            <div className="col-span-1">
              <Label>Select Year</Label>
              <select name="" id="" className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                onChange={(e) => setSchemeyear(e.target.value)}
                value={shemeyear}
              >
                <option value="">Select Year</option>
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
                <option value="2022-22">2022-22</option>

              </select>

            </div>
            <div className="col-span-1">
              <Label>Select Category</Label>
              <select name="" id="" className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                onChange={(e) => setUsercategory(e.target.value)}
                value={usercategory}
              >
                <option value="">Select Category</option>
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
                <option value="2022-22">2022-22</option>

              </select>

            </div>
            <div>
              <Label>Name</Label>
              <input
                type="text"
                placeholder="Enter Name"
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"

                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label>Contact</Label>
              <input
                type="text"
                placeholder="Enter Contact"
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"

                value={Contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
            <div>
              <Label>Address</Label>
              <input
                type="text"
                placeholder="Enter Address"
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"

                value={address}
                onChange={(e) => setaddress(e.target.value)}
              />
            </div>
            <div>
              <Label>Username</Label>
              <input
                type="text"
                placeholder="Enter Username"
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"

                value={Username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <Label>Password</Label>
              <input
                type="text"
                placeholder="Enter Password"
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"

                value={Password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label>Taluka</Label>
              <select name="" id="" className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                value={Taluka}
                onChange={(e) => setTaluka(e.target.value)}

              >
                <option value="">Select Taluka</option>
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
                <option value="2022-22">2022-22</option>

              </select>
            </div>

            <div>
              <Label>Village</Label>
              <select name="" id="" className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                value={Village}
                onChange={(e) => setVillage(e.target.value)}
              >
                <option value="">Select Village</option>
                <option value="2025-26">2025-26</option>
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
                <option value="2022-22">2022-22</option>

              </select>
            </div>

          </div>
        }

        columns={columns}
        title="User Category"
        filterOptions={[]}
        // filterKey="role"
        submitbutton={
          <button type='button' onClick={handleSave} className='bg-blue-700 text-white py-2 p-2 rounded'>
            {editId ? 'Update User' : 'Save Changes'}
          </button>
        }
        searchKey="username"
        rowsPerPage={5}
      />
    </div>
  );
};

export default Usersdatas;
