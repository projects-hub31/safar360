import { Navigate, Route, Routes } from 'react-router-dom';
import TravelerLayout from './components/TravelerLayout';
import ComingSoon from './pages/ComingSoon';
import Home from './pages/traveler/Home';
import Search from './pages/traveler/Search';
import TourDetail from './pages/traveler/TourDetail';
import PropertyDetail from './pages/traveler/PropertyDetail';
import Wishlist from './pages/traveler/Wishlist';
import Profile from './pages/traveler/Profile';
import Transport from './pages/traveler/Transport';
import MyEnquiries from './pages/traveler/Enquiries';
import RoleSelect from './pages/identity/RoleSelect';
import Register from './pages/identity/Register';
import Login from './pages/identity/Login';
import Otp from './pages/identity/Otp';
import OtpExhausted from './pages/identity/OtpExhausted';
import Kyc from './pages/identity/Kyc';
import KycPending from './pages/identity/KycPending';
import KycApproved from './pages/identity/KycApproved';
import KycRejected from './pages/identity/KycRejected';
import Checkout from './pages/booking/Checkout';
import Gateway from './pages/booking/Gateway';
import Awaiting from './pages/booking/Awaiting';
import Confirmed from './pages/booking/Confirmed';
import Outcome from './pages/booking/Outcome';
import AwaitingAccept from './pages/booking/AwaitingAccept';
import GroupSplit from './pages/booking/GroupSplit';
import Participant from './pages/booking/Participant';
import History from './pages/booking/History';
import Cancel from './pages/booking/Cancel';
import Dashboard from './pages/vendor/Dashboard';
import Plans from './pages/vendor/Plans';
import Subscribe from './pages/vendor/Subscribe';
import Grace from './pages/vendor/Grace';
import Listings from './pages/vendor/Listings';
import Availability from './pages/vendor/Availability';
import Inbox from './pages/vendor/Inbox';
import BookingDetail from './pages/vendor/BookingDetail';
import Payouts from './pages/vendor/Payouts';
import PayoutDetail from './pages/vendor/PayoutDetail';
import Gate from './pages/vendor/Gate';
import Analytics from './pages/vendor/Analytics';
import Vehicles from './pages/transport/Vehicles';
import TransportRoutes from './pages/transport/Routes';
import Quotes from './pages/transport/Quotes';
import Quote from './pages/transport/Quote';
import Permits from './pages/transport/Permits';
import Property from './pages/transport/Property';
import Rooms from './pages/transport/Rooms';
import Menu from './pages/transport/Menu';
import Enquiries from './pages/transport/Enquiries';
import Featured from './pages/transport/Featured';
import Catalog from './pages/shop/Catalog';
import Product from './pages/shop/Product';
import Cart from './pages/shop/Cart';
import ShopCheckout from './pages/shop/Checkout';
import Order from './pages/shop/Order';
import Tracking from './pages/shop/Tracking';
import ShopOutcome from './pages/shop/Outcome';
import Returns from './pages/shop/Returns';
import Feed from './pages/social/Feed';
import Composer from './pages/social/Composer';
import Post from './pages/social/Post';
import SocialProfile from './pages/social/Profile';
import Chats from './pages/social/Chats';
import Thread from './pages/social/Thread';
import Report from './pages/social/Report';
import Planner from './pages/ai/Planner';
import Itinerary from './pages/ai/Itinerary';
import Saved from './pages/ai/Saved';
import Chatbot from './pages/ai/Chatbot';

const App = () => {
  return (
    <Routes>
      <Route element={<TravelerLayout />}>
        <Route index element={<Navigate to="/discover/home" replace />} />
        <Route path="discover/home" element={<Home />} />
        <Route path="discover/search" element={<Search />} />
        <Route path="discover/tour/:id" element={<TourDetail />} />
        <Route path="discover/property" element={<PropertyDetail />} />
        <Route path="discover/wishlist" element={<Wishlist />} />
        <Route path="discover/profile" element={<Profile />} />
        <Route path="discover/transport" element={<Transport />} />
        <Route path="discover/enquiries" element={<MyEnquiries />} />
        <Route path="identity/role" element={<RoleSelect />} />
        <Route path="identity/register" element={<Register />} />
        <Route path="identity/login" element={<Login />} />
        <Route path="identity/otp" element={<Otp />} />
        <Route path="identity/otp-exhausted" element={<OtpExhausted />} />
        <Route path="identity/kyc" element={<Kyc />} />
        <Route path="identity/kyc-pending" element={<KycPending />} />
        <Route path="identity/kyc-approved" element={<KycApproved />} />
        <Route path="identity/kyc-rejected" element={<KycRejected />} />
        <Route path="booking/checkout" element={<Checkout />} />
        <Route path="booking/gateway" element={<Gateway />} />
        <Route path="booking/awaiting" element={<Awaiting />} />
        <Route path="booking/confirmed" element={<Confirmed />} />
        <Route path="booking/expired" element={<Outcome kind="expired" />} />
        <Route path="booking/failed" element={<Outcome kind="failed" />} />
        <Route path="booking/held" element={<Outcome kind="held" />} />
        <Route path="booking/sold-out" element={<Outcome kind="sold-out" />} />
        <Route path="booking/late-webhook" element={<Outcome kind="late" />} />
        <Route path="booking/declined" element={<Outcome kind="declined" />} />
        <Route path="booking/awaiting-accept" element={<AwaitingAccept />} />
        <Route path="booking/group-split" element={<GroupSplit />} />
        <Route path="booking/participant/:groupId/:index" element={<Participant />} />
        <Route path="booking/history" element={<History />} />
        <Route path="booking/cancel/:ref" element={<Cancel />} />
        <Route path="vendor/dashboard" element={<Dashboard />} />
        <Route path="vendor/plans" element={<Plans />} />
        <Route path="vendor/subscribe" element={<Subscribe />} />
        <Route path="vendor/grace" element={<Grace />} />
        <Route path="vendor/listings" element={<Listings />} />
        <Route path="vendor/availability" element={<Availability />} />
        <Route path="vendor/inbox" element={<Inbox />} />
        <Route path="vendor/booking" element={<BookingDetail />} />
        <Route path="vendor/payouts" element={<Payouts />} />
        <Route path="vendor/payout" element={<PayoutDetail />} />
        <Route path="vendor/gate" element={<Gate />} />
        <Route path="vendor/analytics" element={<Analytics />} />
        <Route path="transport/vehicles" element={<Vehicles />} />
        <Route path="transport/routes" element={<TransportRoutes />} />
        <Route path="transport/quotes" element={<Quotes />} />
        <Route path="transport/quote" element={<Quote />} />
        <Route path="transport/permits" element={<Permits />} />
        <Route path="transport/property" element={<Property />} />
        <Route path="transport/rooms" element={<Rooms />} />
        <Route path="transport/menu" element={<Menu />} />
        <Route path="transport/enquiries" element={<Enquiries />} />
        <Route path="transport/featured" element={<Featured />} />
        <Route path="shop/catalog" element={<Catalog />} />
        <Route path="shop/product/:id" element={<Product />} />
        <Route path="shop/cart" element={<Cart />} />
        <Route path="shop/checkout" element={<ShopCheckout />} />
        <Route path="shop/order" element={<Order />} />
        <Route path="shop/tracking/:ref?" element={<Tracking />} />
        <Route path="shop/returns/:ref/:subOrderId" element={<Returns />} />
        <Route path="shop/expired" element={<ShopOutcome kind="expired" />} />
        <Route path="shop/failed" element={<ShopOutcome kind="failed" />} />
        <Route path="shop/held" element={<ShopOutcome kind="held" />} />
        <Route path="shop/sold-out" element={<ShopOutcome kind="sold-out" />} />
        <Route path="social/feed" element={<Feed />} />
        <Route path="social/composer" element={<Composer />} />
        <Route path="social/post/:id" element={<Post />} />
        <Route path="social/profile/:id?" element={<SocialProfile />} />
        <Route path="social/chats" element={<Chats />} />
        <Route path="social/thread/:id" element={<Thread />} />
        <Route path="social/report/:targetType/:targetId" element={<Report />} />
        <Route path="ai/planner" element={<Planner />} />
        <Route path="ai/itinerary" element={<Itinerary />} />
        <Route path="ai/saved" element={<Saved />} />
        <Route path="ai/chatbot" element={<Chatbot />} />
        <Route path="*" element={<ComingSoon />} />
      </Route>
    </Routes>
  );
};

export default App;
