import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';

// Route-level code-splitting: each module below becomes its own chunk,
// fetched only when a traveller actually navigates into that role's
// screens, instead of one ~530KB bundle shipped up front on first paint
// (see CLAUDE.md — the production build flagged this). Grouped by module
// folder so e.g. every vendor screen still lands in one small chunk
// together, matching the pages/ directory layout 1:1.
const ComingSoon = lazy(() => import('./pages/ComingSoon'));

const Home = lazy(() => import('./pages/traveler/Home'));
const Search = lazy(() => import('./pages/traveler/Search'));
const TourDetail = lazy(() => import('./pages/traveler/TourDetail'));
const PropertyDetail = lazy(() => import('./pages/traveler/PropertyDetail'));
const Wishlist = lazy(() => import('./pages/traveler/Wishlist'));
const Profile = lazy(() => import('./pages/traveler/Profile'));
const Transport = lazy(() => import('./pages/traveler/Transport'));
const MyEnquiries = lazy(() => import('./pages/traveler/Enquiries'));

const RoleSelect = lazy(() => import('./pages/identity/RoleSelect'));
const Register = lazy(() => import('./pages/identity/Register'));
const Login = lazy(() => import('./pages/identity/Login'));
const Otp = lazy(() => import('./pages/identity/Otp'));
const OtpExhausted = lazy(() => import('./pages/identity/OtpExhausted'));
const Kyc = lazy(() => import('./pages/identity/Kyc'));
const KycPending = lazy(() => import('./pages/identity/KycPending'));
const KycApproved = lazy(() => import('./pages/identity/KycApproved'));
const KycRejected = lazy(() => import('./pages/identity/KycRejected'));

const Checkout = lazy(() => import('./pages/booking/Checkout'));
const Gateway = lazy(() => import('./pages/booking/Gateway'));
const Awaiting = lazy(() => import('./pages/booking/Awaiting'));
const Confirmed = lazy(() => import('./pages/booking/Confirmed'));
const Outcome = lazy(() => import('./pages/booking/Outcome'));
const AwaitingAccept = lazy(() => import('./pages/booking/AwaitingAccept'));
const GroupSplit = lazy(() => import('./pages/booking/GroupSplit'));
const Participant = lazy(() => import('./pages/booking/Participant'));
const History = lazy(() => import('./pages/booking/History'));
const Cancel = lazy(() => import('./pages/booking/Cancel'));

const Dashboard = lazy(() => import('./pages/vendor/Dashboard'));
const Plans = lazy(() => import('./pages/vendor/Plans'));
const Subscribe = lazy(() => import('./pages/vendor/Subscribe'));
const Grace = lazy(() => import('./pages/vendor/Grace'));
const Listings = lazy(() => import('./pages/vendor/Listings'));
const Availability = lazy(() => import('./pages/vendor/Availability'));
const Inbox = lazy(() => import('./pages/vendor/Inbox'));
const VendorBookingDetail = lazy(() => import('./pages/vendor/BookingDetail'));
const Payouts = lazy(() => import('./pages/vendor/Payouts'));
const PayoutDetail = lazy(() => import('./pages/vendor/PayoutDetail'));
const Gate = lazy(() => import('./pages/vendor/Gate'));
const Analytics = lazy(() => import('./pages/vendor/Analytics'));

const Vehicles = lazy(() => import('./pages/transport/Vehicles'));
const TransportRoutes = lazy(() => import('./pages/transport/Routes'));
const Quotes = lazy(() => import('./pages/transport/Quotes'));
const Quote = lazy(() => import('./pages/transport/Quote'));
const Permits = lazy(() => import('./pages/transport/Permits'));
const Property = lazy(() => import('./pages/transport/Property'));
const Rooms = lazy(() => import('./pages/transport/Rooms'));
const Menu = lazy(() => import('./pages/transport/Menu'));
const Enquiries = lazy(() => import('./pages/transport/Enquiries'));
const Featured = lazy(() => import('./pages/transport/Featured'));

const Catalog = lazy(() => import('./pages/shop/Catalog'));
const Product = lazy(() => import('./pages/shop/Product'));
const Cart = lazy(() => import('./pages/shop/Cart'));
const ShopCheckout = lazy(() => import('./pages/shop/Checkout'));
const Order = lazy(() => import('./pages/shop/Order'));
const Tracking = lazy(() => import('./pages/shop/Tracking'));
const ShopOutcome = lazy(() => import('./pages/shop/Outcome'));
const Returns = lazy(() => import('./pages/shop/Returns'));
const SellerProducts = lazy(() => import('./pages/shop/SellerProducts'));
const Fulfilment = lazy(() => import('./pages/shop/Fulfilment'));
const SellerReturns = lazy(() => import('./pages/shop/SellerReturns'));

const Feed = lazy(() => import('./pages/social/Feed'));
const Composer = lazy(() => import('./pages/social/Composer'));
const Post = lazy(() => import('./pages/social/Post'));
const SocialProfile = lazy(() => import('./pages/social/Profile'));
const Chats = lazy(() => import('./pages/social/Chats'));
const Thread = lazy(() => import('./pages/social/Thread'));
const Report = lazy(() => import('./pages/social/Report'));
const Campaigns = lazy(() => import('./pages/social/Campaigns'));
const Collab = lazy(() => import('./pages/social/Collab'));
const Referrals = lazy(() => import('./pages/social/Referrals'));
const Explore = lazy(() => import('./pages/social/Explore'));

const Planner = lazy(() => import('./pages/ai/Planner'));
const Itinerary = lazy(() => import('./pages/ai/Itinerary'));
const Saved = lazy(() => import('./pages/ai/Saved'));
const Chatbot = lazy(() => import('./pages/ai/Chatbot'));
const AiMap = lazy(() => import('./pages/ai/Map'));
const Landmark = lazy(() => import('./pages/ai/Landmark'));
const Geofence = lazy(() => import('./pages/ai/Geofence'));
const Weather = lazy(() => import('./pages/ai/Weather'));
const AiTracking = lazy(() => import('./pages/ai/Tracking'));
const Escalation = lazy(() => import('./pages/ai/Escalation'));

const Console = lazy(() => import('./pages/admin/Console'));
const AdminKyc = lazy(() => import('./pages/admin/Kyc'));
const Moderation = lazy(() => import('./pages/admin/Moderation'));
const Ledger = lazy(() => import('./pages/admin/Ledger'));
const PayoutBatch = lazy(() => import('./pages/admin/PayoutBatch'));
const Disputes = lazy(() => import('./pages/admin/Disputes'));
const Fraud = lazy(() => import('./pages/admin/Fraud'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const Config = lazy(() => import('./pages/admin/Config'));
const Audit = lazy(() => import('./pages/admin/Audit'));

function RouteFallback() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <span className="font-mono text-xs uppercase tracking-wider text-fg-subtle">Loading…</span>
    </div>
  );
}

const App = () => {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<AppShell />}>
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
          <Route path="vendor/booking" element={<VendorBookingDetail />} />
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
          <Route path="shop/seller-products" element={<SellerProducts />} />
          <Route path="shop/fulfilment" element={<Fulfilment />} />
          <Route path="shop/returns" element={<SellerReturns />} />
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
          <Route path="social/campaigns" element={<Campaigns />} />
          <Route path="social/collab/:id" element={<Collab />} />
          <Route path="social/referrals" element={<Referrals />} />
          <Route path="social/explore" element={<Explore />} />
          <Route path="ai/planner" element={<Planner />} />
          <Route path="ai/itinerary" element={<Itinerary />} />
          <Route path="ai/saved" element={<Saved />} />
          <Route path="ai/chatbot" element={<Chatbot />} />
          <Route path="ai/map" element={<AiMap />} />
          <Route path="ai/landmark/:id" element={<Landmark />} />
          <Route path="ai/geofence/:landmarkId" element={<Geofence />} />
          <Route path="ai/tracking/:ref?" element={<AiTracking />} />
          <Route path="ai/escalation" element={<Escalation />} />
          <Route path="ai/weather" element={<Weather />} />
          <Route path="admin/console" element={<Console />} />
          <Route path="admin/kyc" element={<AdminKyc />} />
          <Route path="admin/moderation" element={<Moderation />} />
          <Route path="admin/ledger" element={<Ledger />} />
          <Route path="admin/payout-batch" element={<PayoutBatch />} />
          <Route path="admin/disputes" element={<Disputes />} />
          <Route path="admin/fraud" element={<Fraud />} />
          <Route path="admin/analytics" element={<AdminAnalytics />} />
          <Route path="admin/config" element={<Config />} />
          <Route path="admin/audit" element={<Audit />} />
          <Route path="*" element={<ComingSoon />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default App;
