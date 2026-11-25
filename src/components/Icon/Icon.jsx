import {
  AlertCircle,
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FileImage,
  FileText,
  Image,
  ImageDown,
  Info,
  Layers,
  Lock,
  Mail,
  Menu,
  RotateCcw,
  Scaling,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'

const ICONS = {
  AlertCircle,
  Archive,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  FileImage,
  FileText,
  Image,
  ImageDown,
  Info,
  Layers,
  Lock,
  Mail,
  Menu,
  RotateCcw,
  Scaling,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
  X,
}

export default function Icon({ name, size = 20, strokeWidth = 1.9, ...rest }) {
  const Component = ICONS[name] || FileText
  return <Component size={size} strokeWidth={strokeWidth} aria-hidden="true" {...rest} />
}

export function BrandMark({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role="img"
      aria-label="FormReady logo"
      className="fr-brand-mark-svg"
    >
      <rect width="512" height="512" rx="112" fill="#1f5fbf" />
      <path d="M150 120h150l76 76v180a28 28 0 0 1-28 28H150a28 28 0 0 1-28-28V148a28 28 0 0 1 28-28z" fill="#ffffff" />
      <path d="M300 120v60a16 16 0 0 0 16 16h60" fill="#cfe0f7" />
      <path d="M186 250h124M186 300h92" stroke="#1f5fbf" strokeWidth="22" strokeLinecap="round" />
      <circle cx="352" cy="352" r="74" fill="#1c7d54" />
      <path
        d="M316 352l25 25 46-50"
        fill="none"
        stroke="#ffffff"
        strokeWidth="22"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
