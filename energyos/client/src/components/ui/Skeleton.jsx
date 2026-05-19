export default function Skeleton({ width, height, className = '' }) {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div 
      className={`animate-pulse bg-white/5 rounded-xl ${className}`}
      style={style}
    />
  );
}
