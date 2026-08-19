// import React, { useState } from 'react';
// import './MasterLayout.css';

// const MasterLayout = ({ title, children, onSave, onCancel }) => {
//   const [isEditing, setIsEditing] = useState(false);

//   return (
//     <div className="master-container">
//       <div className="master-header">
//         <h2>{title}</h2>
//         <div className="master-actions">
//           {!isEditing ? (
//             <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
//               Add New
//             </button>
//           ) : (
//             <div className="btn-group">
//               <button className="btn btn-success" onClick={onSave}>Save</button>
//               <button className="btn btn-secondary" onClick={() => {
//                 setIsEditing(false);
//                 onCancel();
//               }}>Cancel</button>
//             </div>
//           )}
//         </div>
//       </div>
//       {children({ isEditing, setIsEditing })}
//     </div>
//   );
// };

// export default MasterLayout;
// // | Master                   | Purpose                                      |
// // | ------------------------ | -------------------------------------------- |
// // | 1. City Master           | Cities manage karne ke liye                  |
// // | 2. State Master          | States list                                  |
// // | 3. Hub Master            | Distribution hubs                            |
// // | 4. Warehouse Master      | Warehouses manage karne ke liye              |
// // | 5. Route Master          | Route Name, Route Code, Start City, End City |
// // | 6. Vehicle Master        | Vehicle details                              |
// // | 7. Driver Master         | Driver information                           |
// // | 8. Customer Master       | Pickup/Delivery customers                    |
// // | 9. Service Zone Master   | North, South, East, West, etc.               |
// // | 10. Transporter Master   | Transport companies/vendors                  |
// // | 11. Delivery Type Master | Standard, Express, Same Day                  |
// // | 12. Stop/Location Master | Pickup & delivery points                     |
