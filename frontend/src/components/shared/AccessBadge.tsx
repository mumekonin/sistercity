interface Props {
  access: string;
}
const accessConfig: Record<string, { label: string; className: string }> = {
  PUBLIC:          { label: 'Public',        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  BOTH_CITIES:     { label: 'Both Cities',   className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  OWN_CITY_ONLY:   { label: 'My City Only',  className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  DEPARTMENT_ONLY: { label: 'Department',    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  ADMINS_ONLY:     { label: 'Admins Only',   className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
};
export default function AccessBadge({ access }: Props) {
  const config = accessConfig[access] ?? { label: access, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}