"use client";

import { useEffect, useState } from 'react';

import Label from "../form/Label";
import { ReusableTable } from "../tables/BasicTableOne";
import { Column } from "../tables/tabletype";


import { toast } from 'react-toastify';

import { UserData } from './Userdata';
import { useToggleContext } from '@/context/ToggleContext';
import { UserCategory } from '../usercategory/userCategory';
import { Taluka } from '../Taluka/Taluka';
import { Village } from '../Village/village';
import DefaultModal from '../example/ModalExample/DefaultModal';
import { FaEdit } from 'react-icons/fa';

interface Grampanchayat {
  gp_id: number;
  gpname: string;
  taluka_id?: number;
}

type Props = {
  users: UserData[];
  datataluka: Taluka[];
  datausercategorycrud: UserCategory[];
};
type FormErrors = {

  usercategory?: string;
  name?: string;
  Contact?: string;
  Username?: string;
  Password?: string;
  address?: string;
  Taluka?: string;
  Village?: string;
  Grampanchayat?: string;

};
const Usersdatas = ({ users, datataluka, datausercategorycrud }: Props) => {

  const [data, setData] = useState<UserData[]>(users || []);
  const [usercategory, setUsercategory] = useState(0);
  const [villages, setVillages] = useState<Village[]>([]);
  const [grampanchayats, setGrampanchayats] = useState<Grampanchayat[]>([]);
  const [villageGpMapping, setVillageGpMapping] = useState<Record<number, number>>({});
  const [gpVillageMapping, setGpVillageMapping] = useState<Record<number, number[]>>({});
  const [talukaGpMapping, setTalukaGpMapping] = useState<Record<number, number[]>>({});
  const [availableTalukaIds, setAvailableTalukaIds] = useState<number[]>([]);
  const [talukaVillageMapping, setTalukaVillageMapping] = useState<Record<number, number[]>>({});

  const [name, setName] = useState('');
  const [Contact, setContact] = useState('');
  const [Username, setUsername] = useState('');
  const [Password, setPassword] = useState('');
  const [address, setaddress] = useState('');
  const [Taluka, setTaluka] = useState(0);
  const [Village, setVillage] = useState(0);
  const [Grampanchayat, setGrampanchayat] = useState(0);
  const [editId, setEditId] = useState<number | null>(null);
  const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState<FormErrors>({});

  // Check if selected category is "PESA Mobilizer"
  const isPESAMobilizer = () => {
    const selectedCategory = datausercategorycrud.find(cat => cat.user_category_id === usercategory);
    return selectedCategory?.category_name?.toLowerCase() === 'pesa mobilizer';
  };

  // Fetch villages, grampanchayats and village-gp mapping from API
  useEffect(() => {
    const fetchVillagesAndGrampanchayats = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || '';
        const [villagesRes, grampanchayatsRes, basicDetailsRes] = await Promise.all([
          fetch(`${base}/api/villages`, { cache: 'no-store' }),
          fetch(`${base}/api/grampanchyat`, { cache: 'no-store' }),
          fetch(`${base}/api/basicdetailsofvillage`, { cache: 'no-store' })
        ]);
        
        const [villagesData, grampanchayatsData, basicDetailsData] = await Promise.all([
          villagesRes.json(),
          grampanchayatsRes.json(),
          basicDetailsRes.json()
        ]);
        
        setVillages(Array.isArray(villagesData) ? villagesData : []);
        setGrampanchayats(Array.isArray(grampanchayatsData) ? grampanchayatsData : []);
        
        // Create mapping of village_id to gp_id from basic_village_details
        // Also create reverse mapping of gp_id to array of village_ids
        // And create mapping of taluka_id to array of gp_ids
        // And track available taluka_ids and taluka to village mapping
        if (Array.isArray(basicDetailsData)) {
          const mapping: Record<number, number> = {};
          const reverseMapping: Record<number, number[]> = {};
          const talukaGpMap: Record<number, Set<number>> = {};
          const talukaSet: Set<number> = new Set();
          const talukaVillageMap: Record<number, Set<number>> = {};
          
          basicDetailsData.forEach((detail: { village_id?: number; gp_id?: number; taluka_id?: number | string }) => {
            if (detail.village_id && detail.gp_id) {
              const villageId = Number(detail.village_id);
              const gpId = Number(detail.gp_id);
              mapping[villageId] = gpId;
              
              // Create reverse mapping: gp_id -> array of village_ids
              if (!reverseMapping[gpId]) {
                reverseMapping[gpId] = [];
              }
              reverseMapping[gpId].push(villageId);
            }
            
            // Create taluka to gp mapping and track available talukas
            if (detail.taluka_id && detail.gp_id) {
              const talukaId = Number(detail.taluka_id);
              const gpId = Number(detail.gp_id);
              talukaSet.add(talukaId);
              
              if (!talukaGpMap[talukaId]) {
                talukaGpMap[talukaId] = new Set();
              }
              talukaGpMap[talukaId].add(gpId);
            }
            
            // Create taluka to village mapping for PESA Mobilizer
            if (detail.taluka_id && detail.village_id) {
              const talukaId = Number(detail.taluka_id);
              const villageId = Number(detail.village_id);
              talukaSet.add(talukaId);
              
              if (!talukaVillageMap[talukaId]) {
                talukaVillageMap[talukaId] = new Set();
              }
              talukaVillageMap[talukaId].add(villageId);
            }
          });
          
          // Convert Set to Array for talukaGpMapping
          const talukaGpMappingFinal: Record<number, number[]> = {};
          Object.keys(talukaGpMap).forEach(talukaId => {
            talukaGpMappingFinal[Number(talukaId)] = Array.from(talukaGpMap[Number(talukaId)]);
          });
          
          // Convert Set to Array for talukaVillageMapping
          const talukaVillageMappingFinal: Record<number, number[]> = {};
          Object.keys(talukaVillageMap).forEach(talukaId => {
            talukaVillageMappingFinal[Number(talukaId)] = Array.from(talukaVillageMap[Number(talukaId)]);
          });
          
          setVillageGpMapping(mapping);
          setGpVillageMapping(reverseMapping);
          setTalukaGpMapping(talukaGpMappingFinal);
          setAvailableTalukaIds(Array.from(talukaSet));
          setTalukaVillageMapping(talukaVillageMappingFinal);
        }
      } catch (error) {
        console.error('Error fetching villages and grampanchayats:', error);
      }
    };
    
    fetchVillagesAndGrampanchayats();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false); // End loading
    }
  };

  useEffect(() => {

    if (!isvalidation) {

      setErrors({})
    }
  }, [isvalidation])

  // Reset village/grampanchayat when category changes
  useEffect(() => {
    if (usercategory) {
      setVillage(0);
      setGrampanchayat(0);
    }
  }, [usercategory]);

  // Reset grampanchayat and village when taluka changes
  useEffect(() => {
    if (Taluka) {
      setVillage(0);
      setGrampanchayat(0);
    }
  }, [Taluka]);

  // Reset village when grampanchayat changes (only if not in edit mode)
  useEffect(() => {
    if (Grampanchayat && !isEditMode) {
      setVillage(0);
    }
  }, [Grampanchayat, isEditMode]);

  // Auto-set grampanchayat from village mapping when editing (for backward compatibility)
  useEffect(() => {
    if (isEditMode && Village && !Grampanchayat && !isPESAMobilizer() && villageGpMapping[Village]) {
      setGrampanchayat(villageGpMapping[Village]);
    }
  }, [Village, villageGpMapping, isEditMode, Grampanchayat, usercategory, datausercategorycrud]);

  const reset = () => {
    setUsercategory(Number(""))

    setName("")
    setContact("")
    setUsername("")
    setPassword("")
    setaddress("")
    setTaluka(Number(""))
    setVillage(Number(""))
    setGrampanchayat(Number(""))
    setEditId(0);
  }

  useEffect(() => {
    if (!isEditMode) {
      reset()
    }
  }, [isEditMode]);

  const validateInputs = () => {
    const newErrors: FormErrors = {};
    setisvalidation(true)
    // Category validation

    // Documents validation
    if (!usercategory) {
      newErrors.usercategory = "Usercategory is required";
    }
    if (!name || name.length === 0) {
      newErrors.name = "Name is required";
    }
    if (!Contact || Contact.length === 0) {
      newErrors.Contact = "Contact is required";
    }
    if (!Username || Username.length === 0) {
      newErrors.Username = "Username is required";
    }
    if (!Password || Password.length === 0) {
      newErrors.Password = "Password is required";
    }
    if (!address || address.length === 0) {
      newErrors.address = "Address is required";
    }
    if (!Taluka) {
      newErrors.Taluka = "Taluka is required";
    }
    
    // Village is always required
    if (!Village) {
      newErrors.Village = "Village is required";
    }
    
    // Grampanchayat is required only for non-PESA Mobilizer categories
    if (!isPESAMobilizer() && !Grampanchayat) {
      newErrors.Grampanchayat = "Grampanchayat is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSave = async () => {
    if (!validateInputs()) return;
    setLoading(true);
    const apiUrl = isEditMode ? `/api/users/insert` : '/api/users/insert';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      // Always include village_id, and add gp_id for non-PESA Mobilizer categories
      const requestBody: {
        user_id: number | null;
        name: string;
        user_category_id: number;
        username: string;
        password: string;
        contact_no: string;
        address: string;
        taluka_id: number;
        village_id: number;
        gp_id?: number;
        status: string;
      } = {
        user_id: editId,
        name: name,
        user_category_id: usercategory,
        username: Username,
        password: Password,
        contact_no: Contact,
        address: address,
        taluka_id: Taluka,
        village_id: Village,
        status: "Active"
      };

      // Add gp_id for non-PESA Mobilizer categories
      if (!isPESAMobilizer() && Grampanchayat) {
        requestBody.gp_id = Grampanchayat;
      }

      const response = await fetch(apiUrl, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success(editId
        ? 'Users updated successfully!'
        : 'Users created successfully!');


      reset()
      setEditId(null);
      fetchData();
    } catch (error) {
      console.error('Error saving Users:', error);
      toast.error(editId
        ? 'Failed to update Users. Please try again.'
        : 'Failed to create Users. Please try again.');
    } finally {
      setLoading(false);
      setIsmodelopen(false);
    }
  };




  const handleEdit = (item: UserData) => {
    setIsActive(!isActive)
    setIsmodelopen(true);
    setIsEditmode(true);
    setUsercategory(Number(item.user_category_id))
    setEditId(item.user_id)
    setName(item.name)
    setContact(item.contact_no)
    setUsername(item.username)
    setPassword(item.password)
    setaddress(item.address)
    setTaluka(item.taluka_id)
    setVillage(item.village_id || 0)
    setGrampanchayat(item.gp_id || 0)
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
      render: (data) => <span>{data.user_category_name}</span>
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
      render: (data) => <span>{data.taluka_name}</span>
    },
    {
      key: 'village_id',
      label: 'Village',
      accessor: 'village_id',
      render: (data) => <span>{data.village_name}</span>
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
        <div className="flex gap-2 whitespace-nowrap w-full">
          <span
            onClick={() => handleEdit(data)}
            className="cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            <FaEdit className="inline-block align-middle text-lg" />
          </span>


          <span>
            <DefaultModal id={data.user_id} fetchData={fetchData} endpoint={"users/insert"} bodyname='user_id' newstatus={data.status} />
          </span>
        </div>
      )
    }
  ];

  return (
    <div className="">

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
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.usercategory ? "border-red-500" : ""
                  }`}
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
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.usercategory}
                </div>
              )}
            </div>
            <div>
              <Label>Name</Label>
              <input
                type="text"
                placeholder="Enter Name"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.name ? "border-red-500" : ""
                  }`}

                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.name}
                </div>
              )}
            </div>
            <div>
              <Label>Contact</Label>
              <input
                type="text"
                placeholder="Enter Contact"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Contact ? "border-red-500" : ""
                  }`}

                value={Contact}
                onChange={(e) => setContact(e.target.value)}
              />
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.Contact}
                </div>
              )}
            </div>
            <div>
              <Label>Address</Label>
              <input
                type="text"
                placeholder="Enter Address"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.address ? "border-red-500" : ""
                  }`}

                value={address}
                onChange={(e) => setaddress(e.target.value)}
              />
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.address}
                </div>
              )}
            </div>
            <div>
              <Label>Username</Label>
              <input
                type="text"
                placeholder="Enter Username"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Username ? "border-red-500" : ""
                  }`}

                value={Username}
                onChange={(e) => setUsername(e.target.value)}
              />
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.Username}
                </div>
              )}
            </div>
            <div>
              <Label>Password</Label>
              <input
                type="text"
                placeholder="Enter Password"
                className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Password ? "border-red-500" : ""
                  }`}

                value={Password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.Password}
                </div>
              )}
            </div>
            <div>
              <Label>Taluka</Label>
              <select name="" id="" className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Taluka ? "border-red-500" : ""
                }`}
                value={Taluka}
                onChange={(e) => setTaluka(Number(e.target.value))}

              >
                <option value="">Taluka</option>

                {datataluka
                  .filter((taluka) => availableTalukaIds.includes(taluka.taluka_id))
                  .map((category) => (
                    <option key={category.taluka_id} value={category.taluka_id}>
                      {category.name}
                    </option>
                  ))}

              </select>
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.Taluka}
                </div>
              )}
            </div>

            {/* Grampanchayat field - Hide only for PESA Mobilizer */}
            {!isPESAMobilizer() && (
              <div>
                <Label>Grampanchayat</Label>
                <select name="" id="" className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Grampanchayat ? "border-red-500" : ""
                  }`}
                  value={Grampanchayat}
                  onChange={(e) => setGrampanchayat(Number(e.target.value))}
                  disabled={!Taluka}
                >
                  <option value="">
                    {!Taluka ? "Select Grampanchayat" : "Select Grampanchayat"}
                  </option>
                  {Taluka && (() => {
                    // Get gp_ids for the selected taluka from the mapping
                    const gpIdsForTaluka = talukaGpMapping[Taluka] || [];
                    
                    // Filter grampanchayats that belong to this taluka
                    const filteredGps = grampanchayats.filter((gp) => 
                      gpIdsForTaluka.includes(gp.gp_id)
                    );
                    
                    return filteredGps.map((gp) => (
                      <option key={gp.gp_id} value={gp.gp_id}>
                        {gp.gpname}
                      </option>
                    ));
                  })()}
                </select>
                {error && (
                  <div className="text-red-500 text-sm mt-1 pl-1">
                    {error.Grampanchayat}
                  </div>
                )}
              </div>
            )}

            {/* Village field - Always visible */}
            <div>
              <Label>Village</Label>
              <select name="" id="" className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Village ? "border-red-500" : ""
                }`}
                value={Village}
                onChange={(e) => setVillage(Number(e.target.value))}
                disabled={!Taluka || (!isPESAMobilizer() && !Grampanchayat)}
              >
                <option value="">
                  {!Taluka ? "Select Village" : !isPESAMobilizer() && !Grampanchayat ? "Select Village" : "Select Village"}
                </option>
                {Taluka && (() => {
                  // For PESA Mobilizer: show villages filtered by taluka from basicdetailsofvillage mapping
                  // For others: show villages filtered by grampanchayat from basicdetailsofvillage mapping
                  let filteredVillages: Village[] = [];
                  
                  if (isPESAMobilizer()) {
                    // Filter villages by taluka using talukaVillageMapping (from basicdetailsofvillage)
                    const villageIdsForTaluka = talukaVillageMapping[Taluka] || [];
                    filteredVillages = villages.filter((v) => 
                      villageIdsForTaluka.includes(v.village_id)
                    );
                  } else if (Grampanchayat) {
                    // Filter villages by grampanchayat using the gpVillageMapping (from basicdetailsofvillage)
                    const villageIds = gpVillageMapping[Grampanchayat] || [];
                    filteredVillages = villages.filter((v) => 
                      villageIds.includes(v.village_id)
                    );
                  }
                  
                  return filteredVillages.map((village) => (
                    <option key={village.village_id} value={village.village_id}>
                      {village.name || village.marathi_name}
                    </option>
                  ));
                })()}
              </select>
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.Village}
                </div>
              )}
            </div>

          </div>
        }

        columns={columns}
        title="Users"
        filterOptions={[]}
        // filterKey="role"
        submitbutton={
          <button
            type='button'
            onClick={handleSave}
            className='bg-blue-700 text-white py-2 p-2 rounded'
            disabled={loading}
          >
            {loading ? 'Submitting...' : (editId ? 'Update' : 'Save Changes')}
          </button>
        }
        searchKey="username"
      // 
      />
    </div>
  );
};

export default Usersdatas;
