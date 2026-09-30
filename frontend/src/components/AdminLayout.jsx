import AdminSidebar from "./AdminSidebar";

function AdminLayout({ children }) {
  return (
    <div className="admin-outer-canvas">
      <div className="admin-layout-frame">
        <AdminSidebar />
        <div className="admin-main-canvas">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
