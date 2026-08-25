import { useApp } from '../../context/app/useApp';

// Overlay-on-photo variant of a wishlist toggle — shared by TourCard and the
// Wishlist page's own cards so the star never drifts out of sync between them.
export default function WishlistButton({ tourId, className = '' }) {
  const { wishlist, toggleWishlist } = useApp();
  const wished = wishlist.includes(tourId);

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(tourId);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={wished}
      aria-label={(wished ? 'Remove from' : 'Save to') + ' wishlist'}
      className={`grid h-9 w-9 flex-none place-items-center rounded-full bg-black/55 text-lg text-white ${className}`}
    >
      <span className={wished ? 'text-amber-400' : 'text-white'}>{wished ? '★' : '☆'}</span>
    </button>
  );
}
