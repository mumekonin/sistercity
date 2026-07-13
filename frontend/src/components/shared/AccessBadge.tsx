interface Props {
  access: string;
}
const accessConfig: Record<string, { label: string; className: string }> = {
  BOTH_CITIES: { label: 'Both Cities', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  CITY_ADMINS: { label: 'City Admins', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  DEPARTMENT:  { label: 'Department',  className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
};
export default function AccessBadge({ access }: Props) {
  const config = accessConfig[access] ?? { label: access, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}