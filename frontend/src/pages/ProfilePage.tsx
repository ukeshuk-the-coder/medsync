import { useAuth } from '../AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="card" style={{ padding: 28, maxWidth: 480 }}>
      <div className="field"><label>Name</label><input defaultValue={user?.name} /></div>
      <div className="field"><label>Email</label><input defaultValue={user?.email} disabled /></div>
      <div className="field"><label>Mobile</label><input defaultValue={user?.mobile} /></div>
      <div className="grid grid-2">
        <div className="field"><label>State</label><input defaultValue={user?.state} /></div>
        <div className="field"><label>City</label><input defaultValue={user?.city} /></div>
      </div>
      <button className="btn btn-primary">Save Changes</button>
    </div>
  );
}
