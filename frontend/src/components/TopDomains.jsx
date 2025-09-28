export default function TopDomains({ domains }) {
  return (
    <div className="card p-6">
      <h3 className="mb-4 font-semibold">Top Reported Domains</h3>
      <ul className="space-y-2 text-sm">
        {domains.map((d, i) => (
          <li
            key={i}
            className="flex justify-between items-center border-b last:border-0 pb-1"
          >
            <span className="truncate max-w-[70%] break-words">{d.domain}</span>
            <span className="font-bold text-brad-500">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
