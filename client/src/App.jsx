import { Routes, Route, useLocation } from "react-router-dom";

// Payment Pages
import PaymentPage from "./pages/PaymentPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";

// Shared Components
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Utility Pages
import Landing from "./pages/utils/Landing.jsx";

// Auth Pages
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";
import ForgotPassword from "./pages/auth/ForgotPassword.jsx";
import ResetPassword from "./pages/auth/ResetPassword.jsx";
import NotFound from "./pages/auth/NotFound.jsx";
import Unauthorized from "./pages/utils/Unauthorized.jsx";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import StudentProfileForm from "./pages/student/StudentProfileForm.jsx";
import StudentProfile from "./pages/student/StudentProfile.jsx";
import TeacherList from "./pages/student/TeacherList.jsx";
import BookClass from "./pages/student/BookClass.jsx";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard.jsx";
import TeacherProfileForm from "./pages/teacher/TeacherProfileForm.jsx";
import TeacherProfile from "./pages/teacher/TeacherProfile.jsx";
import TeacherProfileEdit from "./pages/teacher/TeacherProfileEdit.jsx";
import TeacherSchedule from "./pages/teacher/TeacherSchedule.jsx";
import Bookings from "./pages/teacher/Bookings.jsx";

// Define constants for roles
const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
};

function App() {
  const location = useLocation();

  // Define routes where navbar should NOT be shown
  const noNavbarRoutes = [
    '/login',
    '/signup',
    '/student/dashboard',
    '/teacher/dashboard',
    '/student/profile-setup',
    '/teacher/profile-setup',
    '/student/profile',
    '/teacher/profile',
    '/teacher/profile/edit',
    '/teacher/profile/edit-availability',
    '/student/find-teachers',
    '/student/book-class',
    '/teacher/schedule',
    '/teacher/bookings'
  ];

  // Check if current route should show navbar
  const shouldShowNavbar = !noNavbarRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <Routes>
        {/* Payment Routes */}
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />

        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Student Routes */}
        <Route
          path="/student/profile-setup"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} profileCompleteRequired={false}>
              <StudentProfileForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} profileCompleteRequired={true}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/find-teachers"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} profileCompleteRequired={true}>
              <TeacherList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/book-class"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} profileCompleteRequired={true}>
              <BookClass />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/book-class/:teacherId"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} profileCompleteRequired={true}>
              <BookClass />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.STUDENT]} profileCompleteRequired={true}>
              <StudentProfile />
            </ProtectedRoute>
          }
        />

        {/* Teacher Routes */}
        <Route
          path="/teacher/profile-setup"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={null}>
              <TeacherProfileForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={true}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/schedule"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={true}>
              <TeacherSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/bookings"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={true}>
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/profile"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={true}>
              <TeacherProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/profile/edit"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={true}>
              <TeacherProfileEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/profile/edit-availability"
          element={
            <ProtectedRoute allowedRoles={[USER_ROLES.TEACHER]} profileCompleteRequired={true}>
              <TeacherProfileEdit />
            </ProtectedRoute>
          }
        />

        {/* Catch-all for undefined routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;