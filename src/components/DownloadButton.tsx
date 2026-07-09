interface DownloadButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export function DownloadButton({ disabled, onClick }: DownloadButtonProps) {
  return (
    <button
      className="theme-btn download-btn"
      id="download-btn"
      aria-label="Download diagram as image"
      disabled={disabled}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3.5v11.5" />
        <path d="M7.2 10.5 12 15.3l4.8-4.8" />
        <path d="M4.5 19h15" />
      </svg>
    </button>
  );
}
