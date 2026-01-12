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
const TalukaUsersdatas = ({ users, datataluka, datausercategorycrud }: Props) => {

  const [filteredData, setFilteredData] = useState<UserData[]>([]);
  const [usercategory, setUsercategory] = useState(0);
  const [villages, setVillages] = useState<Village[]>([]);
  const [grampanchayats, setGrampanchayats] = useState<Grampanchayat[]>([]);
  const [villageGpMapping, setVillageGpMapping] = useState<Record<number, number>>({});
  const [talukaGpMapping, setTalukaGpMapping] = useState<Record<number, number[]>>({});
  const [talukaVillageMapping, setTalukaVillageMapping] = useState<Record<number, number[]>>({});

  const [loggedInTalukaId, setLoggedInTalukaId] = useState<number>(0);

  const [name, setName] = useState('');
  const [Contact, setContact] = useState('');
  const [Username, setUsername] = useState('');
  const [Password, setPassword] = useState('');
  const [address, setaddress] = useState('');
  const [Taluka, setTaluka] = useState(0);
  const [Village, setVillage] = useState(0);
  const [Grampanchayat, setGrampanchayat] = useState(0);
  const [editId, setEditId] = useState<number | null>(null);
  const [editVillageId, setEditVillageId] = useState<number | null>(null);
  const { isActive, setIsActive, isEditMode, setIsEditmode, setIsmodelopen, isvalidation, setisvalidation } = useToggleContext();
  const [loading, setLoading] = useState(false);
  const [error, setErrors] = useState<FormErrors>({});

  // Get logged-in user's taluka_id from sessionStorage
  useEffect(() => {
    const talukaId = sessionStorage.getItem('taluka_id');
    console.log('TalukaUsersdatas - sessionStorage taluka_id:', talukaId);
    if (talukaId) {
      const talukaIdNum = Number(talukaId);
      console.log('TalukaUsersdatas - setting loggedInTalukaId to:', talukaIdNum);
      setLoggedInTalukaId(talukaIdNum);
      setTaluka(talukaIdNum); // Set the taluka to the logged-in user's taluka
    } else {
      console.log('TalukaUsersdatas - No taluka_id found in sessionStorage');
      // Set default values if no taluka_id in sessionStorage
      setLoggedInTalukaId(0);
      setTaluka(0);
    }
  }, []);

  // Filter users to only show those from the logged-in user's taluka
  useEffect(() => {
    if (loggedInTalukaId && users) {
      const filteredUsers = users.filter(user => Number(user.taluka_id) === loggedInTalukaId);
      setFilteredData(filteredUsers);
    } else {
      setFilteredData(users || []);
    }
  }, [loggedInTalukaId, users]);

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
          setTalukaGpMapping(talukaGpMappingFinal);
          setTalukaVillageMapping(talukaVillageMappingFinal);

          console.log('TalukaUsersdatas - talukaVillageMappingFinal:', talukaVillageMappingFinal);
          console.log('TalukaUsersdatas - loggedInTalukaId for mapping check:', loggedInTalukaId);
          console.log('TalukaUsersdatas - villages for taluka:', talukaVillageMappingFinal[loggedInTalukaId]);

          // setTalukaVillageMapping(talukaVillageMappingFinal);
        }
      } catch (error) {
        console.error('Error fetching villages and grampanchayats:', error);
      }
    };

    fetchVillagesAndGrampanchayats();
  }, []);


  useEffect(() => {

    if (!isvalidation) {

      setErrors({})
    }
  }, [isvalidation])

  // Reset village/grampanchayat when category changes (but not during edit mode initialization)
  useEffect(() => {
    if (usercategory && !isEditMode) {
      setVillage(0);
      setGrampanchayat(0);
    }
  }, [usercategory, isEditMode]);

  // Reset grampanchayat and village when taluka changes (but not during edit mode initialization)
  useEffect(() => {
    if (Taluka && !isEditMode) {
      setVillage(0);
      setGrampanchayat(0);
    }
  }, [Taluka, isEditMode]);

  // For taluka users, don't reset village when grampanchayat changes since we show all villages anyway
  // Reset village only when grampanchayat changes for non-PESA Mobilizer categories that need filtering
  useEffect(() => {
    if (Grampanchayat && !isEditMode && !isPESAMobilizer()) {
      // Only reset village for categories that filter villages by grampanchayat
      setVillage(0);
    }
  }, [Grampanchayat, isEditMode, usercategory, datausercategorycrud]);

  // Auto-set grampanchayat from village mapping when editing (for backward compatibility)
  useEffect(() => {
    if (isEditMode && Village && !Grampanchayat && !isPESAMobilizer() && villageGpMapping[Village]) {
      setGrampanchayat(villageGpMapping[Village]);
    }
  }, [Village, villageGpMapping, isEditMode, Grampanchayat, usercategory, datausercategorycrud]);

  // Set village when taluka is ready during edit mode
  useEffect(() => {
    if (isEditMode && editVillageId && Taluka) {
      // For PESA Mobilizer: only need Taluka to filter villages
      // For others: need Grampanchayat to filter villages, but set village_id immediately
      if (isPESAMobilizer()) {
        // For PESA Mobilizer, set village immediately when taluka is set
        setVillage(editVillageId);
        setEditVillageId(null);
      } else if (Grampanchayat) {
        // For others, set village when both taluka and grampanchayat are set
        setVillage(editVillageId);
        setEditVillageId(null);
      }
      // If grampanchayat is not set yet but we have village_id, still set it
      // The village will be shown in dropdown options even if filter is not ready
      if (!isPESAMobilizer() && !Grampanchayat && editVillageId) {
        // Set village anyway, it will be included in dropdown options
        setVillage(editVillageId);
      }
    }
  }, [isEditMode, editVillageId, Taluka, Grampanchayat, isPESAMobilizer()]);

  const reset = () => {
    setUsercategory(Number(""))

    setName("")
    setContact("")
    setUsername("")
    setPassword("")
    setaddress("")
    setTaluka(loggedInTalukaId || 0); // Reset to logged-in user's taluka, fallback to 0
    setVillage(Number(""))
    setGrampanchayat(Number(""))
    setEditId(0);
    setEditVillageId(null);
  }

  useEffect(() => {
    if (!isEditMode) {
      reset()
    }
  }, [isEditMode, loggedInTalukaId]); // Add loggedInTalukaId as dependency

  const validateInputs = () => {
    const newErrors: FormErrors = {};
    setisvalidation(true)
    // Category validation

    // Documents validation
    if (!usercategory) {
      newErrors.usercategory = "Usercategory is required";
    } else if (usercategory !== 25 && usercategory !== 34) {
      newErrors.usercategory = "Invalid category selected. Only allowed categories are permitted.";
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

    // Grampanchayat is optional for taluka users (category 37), required only for non-PESA Mobilizer categories at other levels
    // Since taluka users can select villages directly, grampanchayat is not mandatory for them

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
    // Set all values in proper order
    setUsercategory(Number(item.user_category_id))
    setEditId(item.user_id)
    setName(item.name)
    setContact(item.contact_no)
    setUsername(item.username)
    setPassword(item.password)
    setaddress(item.address)
    // Set taluka first
    setTaluka(Number(item.taluka_id))
    // Set grampanchayat
    setGrampanchayat(Number(item.gp_id) || 0)
    // Store village_id to set it properly after taluka is set
    if (item.village_id) {
      setEditVillageId(Number(item.village_id));
    } else {
      setVillage(0);
      setEditVillageId(null);
    }
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
        </div>
      )
    }
  ];

  return (
    <div className="">

      <ReusableTable
        data={filteredData}
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
                {(() => {
                  // Get allowed categories
                  const allowedCategories = datausercategorycrud.filter((category) =>
                    category.user_category_id === 25 || category.user_category_id === 34
                  );

                  // In edit mode, ensure the current category is included even if not in allowed list
                  if (isEditMode && usercategory && !allowedCategories.find(cat => cat.user_category_id === usercategory)) {
                    const currentCategory = datausercategorycrud.find(cat => cat.user_category_id === usercategory);
                    if (currentCategory) {
                      allowedCategories.unshift(currentCategory);
                    }
                  }

                  return allowedCategories.map((category) => (
                    <option key={category.user_category_id} value={category.user_category_id}>
                      {category.category_name}
                    </option>
                  ));
                })()}
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
                value={(Taluka || loggedInTalukaId) || ""}
                onChange={(e) => setTaluka(Number(e.target.value))}
                disabled={true} // Disable taluka selection for category 37 users - they can only see their own taluka
              >
                {(() => {
                  const currentTalukaId = Taluka || loggedInTalukaId;
                  const talukaData = datataluka.find(t => t.taluka_id === currentTalukaId);

                  return (
                    <option value={currentTalukaId || ""}>
                      {talukaData?.name || 'Loading taluka...'}
                    </option>
                  );
                })()}
              </select>
              {error && (
                <div className="text-red-500 text-sm mt-1 pl-1">
                  {error.Taluka}
                </div>
              )}
            </div>

            {/* Grampanchayat field - Optional for taluka users, hide only for PESA Mobilizer */}
            {!isPESAMobilizer() && (
              <div>
                <Label>Grampanchayat <span className="text-gray-500 text-sm">(Optional)</span></Label>
                <select name="" id="" className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Grampanchayat ? "border-red-500" : ""
                  }`}
                  value={Grampanchayat}
                  onChange={(e) => setGrampanchayat(Number(e.target.value))}
                  disabled={!Taluka}
                >
                  <option value="">
                    {!Taluka ? "Select Grampanchayat" : "Select Grampanchayat (Optional)"}
                  </option>
                  {(() => {
                    if (!Taluka) {
                      return <option disabled>No taluka selected</option>;
                    }

                    // Get gp_ids for the selected taluka from the mapping
                    const gpIdsForTaluka = talukaGpMapping[Taluka] || [];

                    // Filter grampanchayats that belong to this taluka
                    const filteredGps = grampanchayats.filter((gp) =>
                      gpIdsForTaluka.includes(gp.gp_id)
                    );

                    if (filteredGps.length === 0) {
                      return <option disabled>No grampanchayats available</option>;
                    }

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
              <select name="" id="" className={`h-11 w-full rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 dark:placeholder:text-white/30 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 ${error.Village ? "border-red-500" : ""
                }`}
                value={Village ? Number(Village) : ""}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVillage(val || 0);
                  if (val && editVillageId) {
                    setEditVillageId(null);
                  }
                }}
                disabled={!Taluka}
              >
                <option value="">
                  {!Taluka ? "Select Village" : "Select Village"}
                </option>
                {(() => {
                  console.log('Village dropdown - Taluka:', Taluka);
                  console.log('Village dropdown - talukaVillageMapping:', talukaVillageMapping);
                  console.log('Village dropdown - villages:', villages);

                  if (!Taluka) {
                    console.log('Village dropdown - No taluka selected');
                    return <option disabled>No taluka selected</option>;
                  }

                  // Taluka users can see all villages in their taluka using talukaVillageMapping
                  const villageIdsForTaluka = talukaVillageMapping[Taluka] || [];
                  console.log('Village dropdown - villageIdsForTaluka:', villageIdsForTaluka);

                  const filteredVillages = villages.filter((v) =>
                    villageIdsForTaluka.includes(Number(v.village_id))
                  );
                  console.log('Village dropdown - filteredVillages:', filteredVillages);

                  if (filteredVillages.length === 0) {
                    console.log('Village dropdown - No villages available');
                    return <option disabled>No villages available</option>;
                  }

                  return filteredVillages.map((village) => (
                    <option key={village.village_id} value={Number(village.village_id)}>
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
        title="Taluka Users"
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

export default TalukaUsersdatas;
