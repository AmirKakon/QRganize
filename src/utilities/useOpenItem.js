import { useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Opens an item on top of the current page instead of replacing it: the page
// underneath stays mounted (scroll, filters, tab intact), so Back just closes
// the item. The current location is passed as the "background" that App keeps
// rendering; an item opened from inside an overlay keeps the original one.
const useOpenItem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Read through a ref so the returned function stays stable while filters
  // rewrite the URL; memoized list tiles depend on that.
  const locationRef = useRef(location);
  locationRef.current = location;

  return useCallback(
    (id) =>
      navigate(`/item?id=${encodeURIComponent(id)}`, {
        state: { background: locationRef.current.state?.background ?? locationRef.current },
      }),
    [navigate]
  );
};

export default useOpenItem;
