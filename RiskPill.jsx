const styles = {
  low: 'bg-[#E4F2E9] text-risk-low',
  mid: 'bg-[#FBEEDA] text-risk-mid',
  high: 'bg-[#F5E1DE] text-risk-high'
}

const labels = {
  low: 'Low',
  mid: 'Moderate',
  high: 'High'
}

export default function RiskPill({ level }) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[level]}`}>
      {labels[level]}
    </span>
  )
}
