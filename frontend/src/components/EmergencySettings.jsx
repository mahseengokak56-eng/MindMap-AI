import { useState, useEffect } from 'react';
import { X, Phone, User, ShieldAlert } from 'lucide-react';
import { updateEmergencyContact, getProfile } from '../services/api';
import { useToast } from '../context/ToastContext';

const EmergencySettings = ({ onClose, setSavedContact }) => {
  const [contact, setContact] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    // Load existing profile
    getProfile().then(res => {
      if (res.data?.emergencyContact) {
        setContact({
          name: res.data.emergencyContact.name || '',
          phone: res.data.emergencyContact.phone || ''
        });
      }
    }).catch(err => console.error("Could not load profile", err));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await updateEmergencyContact(contact);
      addToast('Emergency contact saved successfully.', 'success');
      if (setSavedContact) {
         setSavedContact(res.data.emergencyContact);
      }
      onClose();
    } catch (err) {
      addToast('Failed to save emergency contact.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md p-6 relative animate-[fadeIn_0.2s_ease-out]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Emergency Contact</h2>
            <p className="text-xs text-gray-400">Set someone to trust during a crisis</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2">
              <User size={16} className="text-emerald-400" /> Contact Name
            </label>
            <input type="text" placeholder="Jane Doe" value={contact.name} onChange={e => setContact({...contact, name: e.target.value})} className="glass-input w-full" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2 mb-2">
              <Phone size={16} className="text-blue-400" /> Phone Number
            </label>
            <input type="tel" placeholder="+1 (555) 000-0000" value={contact.phone} onChange={e => setContact({...contact, phone: e.target.value})} className="glass-input w-full" />
          </div>

          <p className="text-xs text-justify text-gray-500">
            This contact will be accessible quickly from the SOS button in the navigation bar when you are feeling overwhelmed.
          </p>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2 font-bold">
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmergencySettings;
