const Initials = ({
  initials,
  size = 24, // default size in px
  fontSizeClass = "text-3xl",
  className = "",
  isActive = true,
}) => {
  if (!initials) return null;

  // Map numeric sizes to Tailwind width/height classes
  const sizeMap = {
    12: "w-12 h-12",
    16: "w-16 h-16",
    20: "w-20 h-20",
    24: "w-24 h-24",
    28: "w-28 h-28",
    32: "w-32 h-32",
    36: "w-36 h-36",
    40: "w-40 h-40",
    48: "w-48 h-48",
    56: "w-56 h-56",
    64: "w-64 h-64",
  };

  const sizeClass = sizeMap[size] || "w-24 h-24";

  return (
    <div
      className={`rounded-full bg-white flex items-center justify-center font-bold  border shadow ${
        isActive ? "text-green-700" : "text-gray-500"
      } ${sizeClass} ${fontSizeClass} ${className}`}
    >
      {initials}
    </div>
  );
};

export default Initials;
