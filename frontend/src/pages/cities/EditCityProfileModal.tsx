import { useState } from 'react';
import { citiesApi } from '../../api/cities.api';
import type { CityProfile } from '../../types/city.types';

interface Props {
  profile: CityProfile;
  onClose: () => void;
  onUpdated: (updated: CityProfile) => void;
}

export default function EditCityProfileModal({ profile, onClose, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'basic' | 'population' | 'contact' | 'partnership'>('basic');

  // basicInfo state
  const [basicInfo, setBasicInfo] = useState({
    name: profile.basicInfo?.name ?? '',
    region: profile.basicInfo?.region ?? '',
    yearEstablished: profile.basicInfo?.yearEstablished ?? 0,
    landAreaSm2: profile.basicInfo?.landAreaSm2 ?? 0,
    officialWebsite: profile.basicInfo?.officialWebsite ?? '',

  });

  // population state
  const [population, setPopulation] = useState({
    total: profile.population?.total ?? 0,
    male: profile.population?.male ?? 0,
    female: profile.population?.female ?? 0,
    youth: profile.population?.youth ?? 0,
    lastUpdated: profile.population?.lastUpdated
      ? new Date(profile.population.lastUpdated).toISOString().split('T')[0]
      : '',
  });

  // contactInfo state
  const [contactInfo, setContactInfo] = useState({
    address: profile.contactInfo?.address ?? '',
    phone: profile.contactInfo?.phone ?? '',
    email: profile.contactInfo?.email ?? '',
  });

  // partnershipHistory state
  const [partnershipHistory, setPartnershipHistory] = useState({
    agreementDate: profile.partnershipHistory?.agreementDate
      ? new Date(profile.partnershipHistory.agreementDate).toISOString().split('T')[0]
      : '',
    summary: profile.partnershipHistory?.summary ?? '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const updated = await citiesApi.update(profile.city!, {
        basicInfo,
        population: {
          ...population,
          lastUpdated: new Date(population.lastUpdated),
        },
        contactInfo,
        partnershipHistory: {
          ...partnershipHistory,
          agreementDate: new Date(partnershipHistory.agreementDate),
        },
      });
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update city profile');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'population', label: 'Population' },
    { id: 'contact', label: 'Contact' },
    { id: 'partnership', label: 'Partnership' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-blue-100 dark:border-slate-700 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-blue-100 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-[#1a4a8a] dark:text-white">
              Edit City Profile
            </h2>
            <p className="text-sm text-blue-400 dark:text-slate-400 mt-0.5">
              {profile.basicInfo?.name} — {profile.city}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-blue-100 dark:border-slate-700 px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#1a4a8a] text-[#1a4a8a] dark:text-white dark:border-blue-400'
                  : 'border-transparent text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}

            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                      City Name
                    </label>
                    <input
                      type="text"
                      value={basicInfo.name}
                      onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                      className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                      Region
                    </label>
                    <input
                      type="text"
                      value={basicInfo.region}
                      onChange={(e) => setBasicInfo({ ...basicInfo, region: e.target.value })}
                      className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                      Year Established
                    </label>
                    <input
                      type="number"
                      value={basicInfo.yearEstablished}
                      onChange={(e) => setBasicInfo({ ...basicInfo, yearEstablished: Number(e.target.value) })}
                      className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                      Land Area (km²)
                    </label>
                    <input
                      type="number"
                      value={basicInfo.landAreaSm2}
                      onChange={(e) => setBasicInfo({ ...basicInfo, landAreaSm2: Number(e.target.value) })}
                      className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                      Official Website
                    </label>
                    <input
                      type="text"
                      value={basicInfo.officialWebsite}
                      onChange={(e) => setBasicInfo({ ...basicInfo, officialWebsite: e.target.value })}
                      className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Population Tab */}
            {activeTab === 'population' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Total Population', key: 'total' },
                    { label: 'Male Population', key: 'male' },
                    { label: 'Female Population', key: 'female' },
                    { label: 'Youth Population', key: 'youth' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                        {field.label}
                      </label>
                      <input
                        type="number"
                        value={population[field.key as keyof typeof population]}
                        onChange={(e) => setPopulation({ ...population, [field.key]: Number(e.target.value) })}
                        className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                      Last Updated
                    </label>
                    <input
                      type="date"
                      value={population.lastUpdated}
                      onChange={(e) => setPopulation({ ...population, lastUpdated: e.target.value })}
                      className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={contactInfo.address}
                    onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                    className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                    className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>
            )}

            {/* Partnership Tab */}
            {activeTab === 'partnership' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                    Agreement Date
                  </label>
                  <input
                    type="date"
                    value={partnershipHistory.agreementDate}
                    onChange={(e) => setPartnershipHistory({ ...partnershipHistory, agreementDate: e.target.value })}
                    className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a4a8a] dark:text-slate-300 mb-1">
                    Summary
                  </label>
                  <textarea
                    rows={5}
                    value={partnershipHistory.summary}
                    onChange={(e) => setPartnershipHistory({ ...partnershipHistory, summary: e.target.value })}
                    className="w-full bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg px-3 py-2.5 text-sm text-[#1a4a8a] dark:text-white focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-blue-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-blue-400 hover:text-[#1a4a8a] dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-[#1a4a8a] hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}