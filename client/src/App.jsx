import { Navigate, Route, Routes } from 'react-router-dom';
import TravelerLayout from './components/TravelerLayout';
import ComingSoon from './pages/ComingSoon';
import Home from './pages/traveler/Home';
import Search from './pages/traveler/Search';
import TourDetail from './pages/traveler/TourDetail';
import PropertyDetail from './pages/traveler/PropertyDetail';

const App = () => {
  return (
    <Routes>
      <Route element={<TravelerLayout />}>
        <Route index element={<Navigate to="/discover/home" replace />} />
        <Route path="discover/home" element={<Home />} />
        <Route path="discover/search" element={<Search />} />
        <Route path="discover/tour/:id" element={<TourDetail />} />
        <Route path="discover/property" element={<PropertyDetail />} />
        <Route path="*" element={<ComingSoon />} />
      </Route>
    </Routes>
  );
};

export default App;
