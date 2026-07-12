import { useEffect, useState } from 'react';
import { citiesApi } from '../../api/cities.api';
import type { CityProfile } from '../../types/city.types';
import { useAuthStore } from '../../store/auth.store';
import EditCityProfileModal from './EditCityProfileModal';

export default function CityProfilesPage() {
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState<CityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProfile, setEditingProfile] = useState<CityProfile | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await citiesApi.getAll();
        setProfiles(data);
      } catch {
        setError('Failed to load city profiles');
      } finally {
        setLoading(false);
      }
    };
    fetchProfiles();
  }, []);

  const handleUpdated = (updated: CityProfile) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1a4a8a] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1a4a8a] dark:text-white">
          City Profiles
        </h1>
        <p className="text-blue-400 dark:text-slate-400 mt-1">
          Official identity records for both partner administrations.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {profiles.map((profile) => (
          <CityCard
            key={profile.id}
            profile={profile}
            canEdit={
              user?.role === 'SUPER_ADMIN' ||
              (user?.role === 'CITY_ADMIN' && user?.city === profile.city)
            }
            onEdit={() => setEditingProfile(profile)}
          />
        ))}
      </div>

      {/* Edit Modal */}
      {editingProfile && (
        <EditCityProfileModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}

function CityCard({ profile, canEdit, onEdit }: { profile: CityProfile; canEdit: boolean; onEdit: () => void; }) {
  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-blue-100 dark:border-slate-700 overflow-hidden">

      {/* Card header */}
      <div className="bg-[#1a4a8a] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {profile.basicInfo?.name}
              </h2>
              <p className="text-blue-200 text-sm mt-0.5">
                {profile.basicInfo?.region} · Est. {profile.basicInfo?.yearEstablished}
              </p>
              {profile.basicInfo?.motto && (
                <p className="text-blue-300 text-sm italic mt-1">
                  "{profile.basicInfo.motto}"
                </p>
              )}
            </div>
          </div>

          {/* Edit button */}
          {canEdit && (
            <button
              onClick={onEdit} // ← connect
              className="text-white/70 hover:text-white transition"
              title="Edit city profile"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* Basic info row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-3">
            <p className="text-xs text-blue-400 dark:text-slate-400">Land Area</p>
            <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white mt-0.5">
              {profile.basicInfo?.landAreaSm2?.toLocaleString()} km²
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-3">
            <p className="text-xs text-blue-400 dark:text-slate-400">Established</p>
            <p className="text-sm font-semibold text-[#1a4a8a] dark:text-white mt-0.5">
              {profile.basicInfo?.yearEstablished}
            </p>
          </div>
        </div>

        {/* Population stats */}
        <div>
          <h3 className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-3">
            Population
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: profile.population?.total?.toLocaleString() },
              { label: 'Male', value: profile.population?.male?.toLocaleString() },
              { label: 'Female', value: profile.population?.female?.toLocaleString() },
              { label: 'Youth', value: profile.population?.youth?.toLocaleString() },
            ].map((stat) => (
              <div key={stat.label}
                className="bg-blue-50 dark:bg-slate-800 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-[#1a4a8a] dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-300 dark:text-slate-500 mt-2">
            Last updated: {profile.population?.lastUpdated
              ? new Date(profile.population.lastUpdated).toLocaleDateString()
              : 'N/A'}
          </p>
        </div>

        {/* Key officials */}
        <div>
          <h3 className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-3">
            Key Officials
          </h3>
          <div className="space-y-2">
            {profile.keyOfficials?.slice(0, 3).map((official, index) => (
              <div key={index}
                className="flex items-center justify-between py-2 border-b border-blue-50 dark:border-slate-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1a4a8a] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">
                      {official.name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#1a4a8a] dark:text-white">
                      {official.name}
                    </p>
                    <p className="text-xs text-blue-400 dark:text-slate-400">
                      {official.title}
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-blue-400 dark:text-slate-400">
                    {official.email}
                  </p>
                  <p className="text-xs text-blue-300 dark:text-slate-500">
                    {official.phone}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div>
          <h3 className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-3">
            Departments
          </h3>
          <div className="space-y-2">
            {profile.departments?.slice(0, 3).map((dept, index) => (
              <div key={index}
                className="flex items-center justify-between py-2 border-b border-blue-50 dark:border-slate-800 last:border-0">
                <div>
                  <p className="text-sm font-medium text-[#1a4a8a] dark:text-white">
                    {dept.name}
                  </p>
                  <p className="text-xs text-blue-400 dark:text-slate-400">
                    Head: {dept.headName}
                  </p>
                </div>
                <p className="text-xs text-blue-300 dark:text-slate-500 hidden sm:block">
                  {dept.headEmail}
                </p>
              </div>
            ))}
            {profile.departments && profile.departments.length > 3 && (
              <p className="text-xs text-blue-400 dark:text-slate-400 pt-1">
                +{profile.departments.length - 3} more departments
              </p>
            )}
          </div>
        </div>

        {/* Areas of focus */}
        <div>
          <h3 className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-3">
            Areas of Focus
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.areasOfFocus?.map((area) => (
              <span key={area}
                className="bg-blue-50 dark:bg-slate-800 text-[#1a4a8a] dark:text-blue-300 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-100 dark:border-slate-700">
                {area}
              </span>
            ))}
          </div>
        </div>

        {/* Partnership history summary */}
        {profile.partnershipHistory?.summary && (
          <div>
            <h3 className="text-xs font-semibold text-blue-300 dark:text-slate-500 uppercase tracking-wider mb-3">
              Partnership Summary
            </h3>
            <p className="text-sm text-blue-400 dark:text-slate-400 leading-relaxed">
              {profile.partnershipHistory.summary}
            </p>
            <p className="text-xs text-blue-300 dark:text-slate-500 mt-2">
              Agreement signed:{' '}
              {profile.partnershipHistory.agreementDate
                ? new Date(profile.partnershipHistory.agreementDate).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        )}

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-50 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm text-blue-400 dark:text-slate-400">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{profile.contactInfo?.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-400 dark:text-slate-400">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="truncate">{profile.contactInfo?.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-400 dark:text-slate-400">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{profile.contactInfo?.email}</span>
          </div>
          {profile.basicInfo?.officialWebsite && (
            <div className="flex items-center gap-2 text-sm text-blue-400 dark:text-slate-400">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <a href={profile.basicInfo.officialWebsite}
                target="_blank"
                rel="noreferrer"
                className="truncate hover:text-[#1a4a8a] dark:hover:text-blue-300 transition">
                {profile.basicInfo.officialWebsite}
              </a>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}