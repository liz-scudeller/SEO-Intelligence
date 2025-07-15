import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [locations, setLocations] = useState([]);
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [editedServiceName, setEditedServiceName] = useState('');
  const [editingLocation, setEditingLocation] = useState(null);
  const [editedCity, setEditedCity] = useState('');
  const [editedProvince, setEditedProvince] = useState('');

  useEffect(() => {
    fetchLocations();
    fetchServices();
  }, []);

  const fetchLocations = async () => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', user.data.user.id);
    if (!error) setLocations(data);
  };

  const handleAddLocation = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return toast.error('Could not get user');
    if (!city || !province) return toast.error('City and province are required.');

    const slug = city.toLowerCase().replace(/\s+/g, '-');

    const { error } = await supabase.from('locations').insert([{
      user_id: user.id,
      city,
      province,
      slug,
      active: true
    }]);

    if (error) return toast.error('Failed to add city.');

    toast.success('City added!');
    setCity('');
    setProvince('');
    fetchLocations();
  };

  const handleToggleActive = async (id, currentStatus) => {
    await supabase.from('locations').update({ active: !currentStatus }).eq('id', id);
    fetchLocations();
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this city?');
    if (!confirm) return;
    await supabase.from('locations').delete().eq('id', id);
    toast.success('City deleted');
    fetchLocations();
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location.id);
    setEditedCity(location.city);
    setEditedProvince(location.province);
  };

  const handleSaveLocation = async (id) => {
    const slug = editedCity.toLowerCase().replace(/\s+/g, '-');
    await supabase
      .from('locations')
      .update({ city: editedCity, province: editedProvince, slug })
      .eq('id', id);
    setEditingLocation(null);
    setEditedCity('');
    setEditedProvince('');
    toast.success('City updated');
    fetchLocations();
  };

  const fetchServices = async () => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user.data.user.id);
    if (!error) setServices(data);
  };

  const handleAddService = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return toast.error('Could not get user');
    if (!newService) return toast.error('Service name is required.');

    const slug = newService.toLowerCase().replace(/\s+/g, '-');

    const { error } = await supabase.from('services').insert([{
      user_id: user.id,
      name: newService,
      slug,
      active: true
    }]);

    if (error) return toast.error('Failed to add service.');

    toast.success('Service added!');
    setNewService('');
    fetchServices();
  };

  const handleToggleService = async (id, currentStatus) => {
    await supabase.from('services').update({ active: !currentStatus }).eq('id', id);
    fetchServices();
  };

  const handleDeleteService = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this service?');
    if (!confirm) return;
    await supabase.from('services').delete().eq('id', id);
    toast.success('Service deleted');
    fetchServices();
  };

  const handleEditService = (service) => {
    setEditingService(service.id);
    setEditedServiceName(service.name);
  };

  const handleSaveService = async (id) => {
    await supabase.from('services').update({ name: editedServiceName }).eq('id', id);
    setEditingService(null);
    setEditedServiceName('');
    toast.success('Service updated');
    fetchServices();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings – Cities</h2>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Province"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button onClick={handleAddLocation} className="bg-[#2a2b2e] text-white px-4 py-2 rounded">
          Add City
        </button>
      </div>

      <table className="w-full mb-10">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b">
            <th className="p-2">City</th>
            <th>Province</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc.id} className="border-t text-sm">
              <td className="p-2">
                {editingLocation === loc.id ? (
                  <input
                    type="text"
                    value={editedCity}
                    onChange={(e) => setEditedCity(e.target.value)}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  loc.city
                )}
              </td>
              <td>
                {editingLocation === loc.id ? (
                  <input
                    type="text"
                    value={editedProvince}
                    onChange={(e) => setEditedProvince(e.target.value)}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  loc.province
                )}
              </td>
              <td>{loc.active ? 'Active' : 'Inactive'}</td>
              <td className="flex gap-2 py-2">
                {editingLocation === loc.id ? (
                  <button onClick={() => handleSaveLocation(loc.id)} className="text-green-600">Save</button>
                ) : (
                  <button onClick={() => handleEditLocation(loc)} className="text-blue-600">Edit</button>
                )}
                <button onClick={() => handleToggleActive(loc.id, loc.active)} className="text-blue-600">
                  {loc.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => handleDelete(loc.id)} className="text-red-500">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-2xl font-bold mb-4">Services</h2>
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="New Service"
          value={newService}
          onChange={(e) => setNewService(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button onClick={handleAddService} className="bg-[#2a2b2e] text-white px-4 py-2 rounded">
          Add Service
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b">
            <th className="p-2">Service</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((svc) => (
            <tr key={svc.id} className="border-t text-sm">
              <td className="p-2">
                {editingService === svc.id ? (
                  <input
                    type="text"
                    value={editedServiceName}
                    onChange={(e) => setEditedServiceName(e.target.value)}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  svc.name
                )}
              </td>
              <td>{svc.active ? 'Active' : 'Inactive'}</td>
              <td className="flex gap-2 py-2">
                {editingService === svc.id ? (
                  <button onClick={() => handleSaveService(svc.id)} className="text-green-600">Save</button>
                ) : (
                  <button onClick={() => handleEditService(svc)} className="text-blue-600">Edit</button>
                )}
                <button onClick={() => handleToggleService(svc.id, svc.active)} className="text-blue-600">
                  {svc.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => handleDeleteService(svc.id)} className="text-red-500">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
