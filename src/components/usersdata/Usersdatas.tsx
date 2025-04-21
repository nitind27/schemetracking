"use client";

import { useEffect, useState } from 'react';

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";
import Button from "../ui/button/Button";

import { toast } from 'react-toastify';

import { UserData } from './Userdata';
import { useToggleContext } from '@/context/ToggleContext';
import { UserCategory } from '../usercategory/userCategory';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';

const Usersdatas = () => {
  const [data, setData] = useState<UserData[]>([]);
  const [datavillage, setDatavillage] = useState<Village[]>([]);
  const [datataluka, setDatataluka] = useState<Taluka[]>([]);
  const [datausercategorycrud, setDatausercategorycrud] = useState<UserCategory[]>([]);

  const [usercategory, setUsercategory] = useState(0);

  const [name, setName] = useState('');
  const [Contact, setContact] = useState('');
  const [Username, setUsername] = useState('');
  const [Password, setPassword] = useState('');
  const [address, setaddress] = useState('');
  const [Taluka, setTaluka] = useState(0);
  const [Village, setVillage] = useState(0);
  const [editId, setEditId] = useState<number | null>(null);
  const { isActive, setIsActive } = useToggleContext();
  const fetchData = async () => {
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  const fetchDatavillages = async () => {
    try {
      const response = await fetch('/api/villages');
      const result = await response.json();
      setDatavillage(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  const fetchDatataluka = async () => {
    try {
      const response = await fetch('/api/taluka');
      const result = await response.json();
      setDatataluka(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  const fetchDatausercategorycrud = async () => {
    try {
      const response = await fetch('/api/usercategorycrud');
      const result = await response.json();
      setDatausercategorycrud(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDatavillages();
    fetchDatataluka();
    fetchDatausercategorycrud();

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
        ? 'Users updated successfully!'
        : 'Users created successfully!');


      setEditId(null);
      fetchData();

    } catch (error) {
      console.error('Error saving Users:', error);
      toast.error(editId
        ? 'Failed to update Users. Please try again.'
        : 'Failed to create Users. Please try again.');
    }
  };


  const handleDelete = async (id: number) => {
    try {
      const response = await fetch('/api/usercategorycrud', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: id })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleEdit = (item: UserData) => {
    setIsActive(!isActive)

    setUsercategory(Number(item.user_category_id))

    setName(item.name)
    setContact(item.contact_no)
    setUsername(item.username)
    setPassword(item.password)
    setaddress(item.address)
    setTaluka(item.taluka_id)
    setVillage(item.village_id)
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
      render: (data) => <span>{datausercategorycrud.filter((pac) => pac.user_category_id == data.user_category_id).map((data) => data.category_name)}</span>
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
      render: (data) => <span>{datataluka.filter((datatlk) => datatlk.taluka_id == data.taluka_id).map((datamap) => datamap.name)}</span>
    },
    {
      key: 'village_id',
      label: 'Village',
      accessor: 'village_id',
      render: (data) => <span>{datavillage.filter((datavlg) => datavlg.village_id == data.village_id).map((datamap) => datamap.name)}</span>
    },
    {
      key: 'status',
      label: 'Status',
      accessor: 'status',
      render: (data) => <span>{data.status}</span>
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
              <Label>Category</Label>


              <select
                name=""
                id=""
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                value={usercategory}
                onChange={(e) => setUsercategory(Number(e.target.value))}
              >
                <option value="">Category</option>
                {datausercategorycrud.map((category) => (
                  <option key={category.user_category_id} value={category.user_category_id}>
                    {category.category_name}
                  </option>
                ))}
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
                onChange={(e) => setTaluka(Number(e.target.value))}

              >
                <option value="">Taluka</option>
             
                {datataluka.map((category) => (
                  <option key={category.taluka_id} value={category.taluka_id}>
                    {category.name}
                  </option>
                ))}

              </select>
            </div>

            <div>
              <Label>Village</Label>
              <select name="" id="" className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden  dark:placeholder:text-white/30  bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                value={Village}
                onChange={(e) => setVillage(Number(e.target.value))}
              >
                <option value="">Village</option>
                {datavillage.filter((data) => data.taluka_id == Taluka.toString()).map((category) => (
                  <option key={category.village_id} value={category.village_id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

          </div>
        }

        columns={columns}
        title="Users"
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
