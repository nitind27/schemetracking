// "use client"
// import Loader from '@/common/Loader';

// import { usePathname } from 'next/navigation';
// import React, { useEffect, useState } from 'react';
 

// const PathHandler = ({ children }: any) => {
//     const router = usePathname();
    
//     const [loading, setLoading] = useState(false);

//     const handleItemClick = (path: any) => {
     
//             setLoading(true);
//             localStorage.setItem("currentPath", path);
        
//     };

//     useEffect(() => {
//         const handleRouteChange = () => {
//             setLoading(false);
//         };

//         if (router) {
//             handleRouteChange();
//         }

//         return () => {
//             // Cleanup if needed
//         };
//     }, [router]);

//     return (
//         <div>
//             {loading && <div><Loader /></div>}
//             {React.Children.map(children, child =>
//                 React.cloneElement(child, { onClick: handleItemClick })
//             )}
//         </div>
//     );
// };

// export default PathHandler;
import React from 'react'

const PathHandler = () => {
  return (
    <div>
      
    </div>
  )
}

export default PathHandler
