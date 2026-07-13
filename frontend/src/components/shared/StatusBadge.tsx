interface Props {
  status: string;
}
const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT:     { label: 'Draft',    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' },
  APPROVED:  { label: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  REJECTED:  { label: 'Rejected', className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
};
export default function StatusBadge({ status }: Props) {
  const config = statusConfig[status] ?? { label: status, className: 'bg-blue-100 text-blue-600' };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}