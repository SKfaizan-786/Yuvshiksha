import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Check,
  X,
  Mail,
  Lock,
  Loader2,
  LogIn,
  Shield,
  AlertTriangle,
  Smartphone,
  Chrome,
  Globe,
  ArrowLeft,
  Home,
} from "lucide-react";

// --- IMPORT THE STORAGE UTILITIES ---
// Corrected path: storage.js is in client/src/utils/
import { setToLocalStorage, getFromLocalStorage } from "../../utils/storage";

// Define constants for roles to avoid magic strings
const USER_ROLES = {
  STUDENT: "student",
  TEACHER: "teacher",
};

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [uiState, setUiState] = useState({
    showPassword: false,
    isSubmitting: false,
    focusedField: null,
    showCapsLockWarning: false,
    loginAttempts: 0,
    isLocked: false,
    lockoutTime: 0,
    showBiometric: false,
    passwordStrength: 0,
    isOnline: true,
    lastLoginTime: null,
    emailValid: false,
    passwordValid: false,
    errorMessage: "",
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Derive form validity directly from state for better reactivity
  const isFormValid =
    uiState.emailValid &&
    uiState.passwordValid &&
    !uiState.isLocked &&
    uiState.isOnline;

  const inputBaseClasses = `w-full py-3 px-4 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200`;
  const themeSpecificClasses = `bg-white border-slate-300 text-slate-900`; // Always light theme styles

  const getPasswordStrengthColor = useCallback(() => {
    if (uiState.passwordStrength <= 1) return "bg-red-500 text-red-500";
    if (uiState.passwordStrength <= 2) return "bg-orange-500 text-orange-500";
    if (uiState.passwordStrength <= 3) return "bg-yellow-500 text-yellow-500";
    if (uiState.passwordStrength <= 4) return "bg-blue-500 text-blue-500";
    return "bg-green-500 text-green-500";
  }, [uiState.passwordStrength]);

  const getPasswordStrengthText = useCallback(() => {
    if (uiState.passwordStrength <= 1) return "Weak";
    if (uiState.passwordStrength <= 2) return "Fair";
    if (uiState.passwordStrength <= 3) return "Good";
    if (uiState.passwordStrength <= 4) return "Strong";
    return "Very Strong";
  }, [uiState.passwordStrength]);

  // Initial setup effects
  useEffect(() => {
    const biometricAvailable =
      "webauthn" in window || navigator.userAgent.includes("Mobile");
    const lastLogin = getFromLocalStorage("lastLoginTime", null);

    setUiState((u) => ({
      ...u,
      showBiometric: biometricAvailable,
      lastLoginTime: lastLogin ? new Date(lastLogin) : null,
    }));
  }, []);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setUiState((u) => ({ ...u, isOnline: true }));
    const handleOffline = () => setUiState((u) => ({ ...u, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handle Caps Lock warning
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (uiState.focusedField === "password") {
        // Only check for password field
        const capsLock = e.getModifierState && e.getModifierState("CapsLock");
        if (typeof capsLock === "boolean") {
          setUiState((u) => ({ ...u, showCapsLockWarning: capsLock }));
        }
      } else {
        setUiState((u) => ({ ...u, showCapsLockWarning: false }));
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [uiState.focusedField]); // Depend on focusedField

  // Account lockout timer
  useEffect(() => {
    if (uiState.lockoutTime > 0) {
      const timer = setTimeout(() => {
        setUiState((u) => ({ ...u, lockoutTime: u.lockoutTime - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (uiState.isLocked && uiState.lockoutTime === 0) {
      setUiState((u) => ({
        ...u,
        isLocked: false,
        loginAttempts: 0,
        errorMessage: "",
      }));
    }
  }, [uiState.lockoutTime, uiState.isLocked]);

  // Validate form data and calculate password strength
  useEffect(() => {
    const emailValid = emailRegex.test(formData.email);
    const passwordValid = formData.password.length >= 6;
    setUiState((u) => ({
      ...u,
      emailValid,
      passwordValid,
      passwordStrength: formData.password
        ? calculatePasswordStrength(formData.password)
        : 0,
    }));
  }, [formData.email, formData.password]);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleInputChange = useCallback(
    ({ target: { name, value, type, checked } }) => {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      setUiState((u) => ({ ...u, errorMessage: "" }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!isFormValid || uiState.isLocked || uiState.isSubmitting) {
        setUiState((u) => ({
          ...u,
          errorMessage:
            "Please ensure all fields are valid and account is not locked.",
        }));
        return;
      }

      setUiState((u) => ({ ...u, isSubmitting: true, errorMessage: "" }));

      try {
  const response = await fetch(import.meta.env.VITE_BACKEND_URL + '/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });

        const data = await response.json();

        if (response.ok) {
          // Save token and user data
          setToLocalStorage('token', data.token);
          setToLocalStorage('currentUser', data.user);
          setToLocalStorage('lastLoginTime', new Date());

          // Navigate based on profile completion
          if (data.user.role === 'student') {
            if (data.user.profileComplete) {
              navigate('/student/dashboard');
            } else {
              navigate('/student/profile');
            }
          } else if (data.user.role === 'teacher') {
            if (data.user.profileComplete) {
              navigate('/teacher/dashboard');
            } else {
              navigate('/teacher/profile');
            }
          } else {
            navigate('/');
          }

          // Reset form
          setFormData({ email: '', password: '', rememberMe: false });
        } else {
          const message = data.message || 'Login failed. Please try again.';
          throw new Error(message);
        }
      } catch (error) {
        const message = error.message || 'Login failed. Please try again.';
        console.error('Login error:', message);

        setUiState((u) => {
          const newAttempts = u.loginAttempts + 1;
          if (newAttempts >= 3) {
            return {
              ...u,
              isSubmitting: false,
              loginAttempts: newAttempts,
              isLocked: true,
              lockoutTime: 60,
              errorMessage: `Too many failed attempts. Account locked for 60 seconds.`,
            };
          } else {
            return {
              ...u,
              isSubmitting: false,
              loginAttempts: newAttempts,
              errorMessage:
                message + (newAttempts === 2 ? ' 1 attempt remaining.' : ''),
            };
          }
        });
      }
    },
    [formData, isFormValid, navigate, uiState.isLocked, uiState.isSubmitting]
  );

  const handleSocialLogin = useCallback(
    async (type, credentialResponse) => {
      if (
        type === "google" &&
        (!credentialResponse || !credentialResponse.credential)
      ) {
        setUiState((u) => ({
          ...u,
          isSubmitting: false,
          errorMessage: "Invalid Google login response",
        }));
        return;
      }

      setUiState((u) => ({ ...u, isSubmitting: true, errorMessage: "" }));

      try {
        if (type === "google") {
          // Send the Google credential to your backend
          const response = await axios.post(
            import.meta.env.VITE_BACKEND_URL + '/api/auth/google',
            {
              credential: credentialResponse.credential,
            }
          );

          const { token, user } = response.data;

          // Store user data and token
          setToLocalStorage("currentUser", user);
          setToLocalStorage("token", token);
          setToLocalStorage("lastLoginTime", new Date());

          // Redirect based on role and profile completion
          const redirectPath = user.profileComplete
            ? `/${user.role}/dashboard`
            : `/${user.role}/profile-setup`;

          navigate(redirectPath);
        } else if (type === "biometric") {
          // Keep existing biometric login logic
          await new Promise((r) => setTimeout(r, 1500));

          const mockUserData = {
            email: "biometric@example.com",
            role: USER_ROLES.STUDENT,
            profileComplete: false,
            firstName: "Biometric",
            lastName: "User",
            id: "biometric-user-" + Math.random().toString(36).substr(2, 9),
          };

          setToLocalStorage("currentUser", mockUserData);
          setToLocalStorage("lastLoginTime", new Date());

          navigate(`/${mockUserData.role}/profile-setup`);
        }
      } catch (error) {
        console.error(`${type} login error:`, error);
        setUiState((u) => ({
          ...u,
          isSubmitting: false,
          errorMessage: error.response?.data?.message || `${type} login failed`,
        }));
      }
    },
    [navigate]
  );

  const handleGoogleLogin = async (credentialResponse) => {
    if (!credentialResponse || !credentialResponse.credential) {
      setUiState((u) => ({
        ...u,
        isSubmitting: false,
        errorMessage: "Invalid Google login response",
      }));
      return;
    }

    try {
      setUiState((u) => ({ ...u, isSubmitting: true, errorMessage: "" }));

      const response = await axios.post(
        import.meta.env.VITE_BACKEND_URL + '/api/auth/google',
        {
          credential: credentialResponse.credential,
        }
      );

      const { token, user } = response.data;

      // Store user data and token
      setToLocalStorage("currentUser", user);
      setToLocalStorage("token", token);
      setToLocalStorage("lastLoginTime", new Date());

      // Redirect based on role and profile completion (match normal login)
      if (user.role === 'student') {
        if (user.profileComplete) {
          navigate('/student/dashboard');
        } else {
          navigate('/student/profile');
        }
      } else if (user.role === 'teacher') {
        if (user.profileComplete) {
          navigate('/teacher/dashboard');
        } else {
          navigate('/teacher/profile');
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      setUiState((u) => ({
        ...u,
        isSubmitting: false,
        errorMessage: error.response?.data?.message || "Google login failed",
      }));
    }
  };

  // Changed to directly navigate to a dedicated Forgot Password route
  const handleForgotPasswordClick = useCallback(() => {
    navigate("/forgot-password"); // Assuming you have a /forgot-password route
  }, [navigate]);

  const renderInput = useCallback(
    (label, name, type = "text", icon = null, toggleable = false) => {
      const val = formData[name];
      const isFocused = uiState.focusedField === name;
      const isValid =
        name === "email"
          ? uiState.emailValid
          : name === "password"
          ? uiState.passwordValid
          : true;
      const hasError = !isValid && val;

      const errorMessages = {
        email: "Please enter a valid email address",
        password: "Password must be at least 6 characters",
      };
      const errorMessage = hasError ? errorMessages[name] : "";

      return (
        <div className="space-y-2 transform hover:scale-[1.02] transition-all duration-300">
          <label
            className={`flex items-center gap-2 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:text-violet-600`}
          >
            {icon && (
              <span className="text-violet-500 transition-transform duration-200 hover:scale-110">
                {icon}
              </span>
            )}
            {label} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={
                toggleable ? (uiState.showPassword ? "text" : "password") : type
              }
              name={name}
              value={val}
              onChange={handleInputChange}
              onFocus={() => setUiState((u) => ({ ...u, focusedField: name }))}
              onBlur={() =>
                setUiState((u) => ({
                  ...u,
                  focusedField: null,
                  showCapsLockWarning: false,
                }))
              }
              className={`${inputBaseClasses} ${themeSpecificClasses} ${
                hasError
                  ? "border-red-400 bg-red-50 hover:shadow-red-100"
                  : isValid && val
                  ? "border-emerald-400 bg-emerald-50 hover:shadow-emerald-100"
                  : isFocused
                  ? "border-violet-400 bg-violet-50 shadow-violet-100"
                  : ""
              }`}
              placeholder={`Enter your ${label.toLowerCase()}`}
              disabled={uiState.isLocked || uiState.isSubmitting}
              aria-invalid={hasError ? "true" : "false"}
              aria-describedby={hasError ? `${name}-error` : undefined}
            />

            {toggleable && (
              <button
                type="button"
                onClick={() =>
                  setUiState((u) => ({ ...u, showPassword: !u.showPassword }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-all duration-200 transform hover:scale-110 hover:bg-violet-50 rounded-full p-1"
                disabled={uiState.isLocked || uiState.isSubmitting}
                aria-label={
                  uiState.showPassword ? "Hide password" : "Show password"
                }
              >
                {uiState.showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            )}
            {val && !toggleable && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 transform hover:scale-110 transition-transform duration-200">
                {isValid ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <X className="w-5 h-5 text-red-500" />
                )}
              </div>
            )}
          </div>

          {name === "password" && val && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getPasswordStrengthColor().split(" ")[0]
                    }`}
                    style={{
                      width: `${(uiState.passwordStrength / 5) * 100}%`,
                    }}
                  ></div>
                </div>
                <span
                  className={`text-xs font-medium ${
                    getPasswordStrengthColor().split(" ")[1]
                  }`}
                >
                  {getPasswordStrengthText()}
                </span>
              </div>
            </div>
          )}

          {name === "password" && uiState.showCapsLockWarning && isFocused && (
            <div
              className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 px-3 py-2 rounded-lg"
              aria-live="polite"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Caps Lock is on</span>
            </div>
          )}

          {errorMessage && (
            <p
              id={`${name}-error`}
              className="text-sm text-red-600 flex items-center gap-1"
              aria-live="assertive"
            >
              <X className="w-4 h-4" />
              {errorMessage}
            </p>
          )}
        </div>
      );
    },
    [
      formData,
      uiState,
      handleInputChange,
      getPasswordStrengthColor,
      getPasswordStrengthText,
      inputBaseClasses,
      themeSpecificClasses,
    ]
  );

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 px-4 py-8`}
    >
      <div
        className={`max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-500 hover:shadow-2xl`}
      >
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-8 text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/90 via-purple-600/90 to-indigo-600/90 group-hover:from-violet-700/90 group-hover:via-purple-700/90 group-hover:to-indigo-700/90 transition-all duration-500"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/10 rounded-full blur-lg group-hover:scale-110 transition-transform duration-500"></div>

          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                uiState.isOnline ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              <Globe
                className={`w-4 h-4 ${
                  uiState.isOnline ? "text-green-300" : "text-red-300"
                }`}
              />
            </div>
          </div>

          <div className="absolute bottom-4 right-4 z-20">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-xl text-white hover:bg-white/30 transition-all duration-300 transform hover:scale-105 group"
              title="Back to Home"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">Home</span>
            </Link>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <LogIn className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold transform group-hover:scale-105 transition-transform duration-300">
                  Welcome Back
                </h1>
                <p className="text-violet-200 text-sm">
                  Sign in to continue learning
                </p>
              </div>
            </div>

            {uiState.lastLoginTime && (
              <div className="text-violet-200 text-xs opacity-75">
                Last login: {uiState.lastLoginTime.toLocaleDateString()} at{" "}
                {uiState.lastLoginTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-8 space-y-6">
          {!uiState.isOnline && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <Globe className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-800 font-medium text-sm">
                  No internet connection
                </p>
                <p className="text-red-600 text-xs">
                  Please check your connection and try again
                </p>
              </div>
            </div>
          )}

          {uiState.isLocked && (
            <div
              className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
              aria-live="assertive"
            >
              <Shield className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-800 font-medium text-sm">
                  Account temporarily locked
                </p>
                <p className="text-red-600 text-xs">
                  Try again in {uiState.lockoutTime} seconds
                </p>
              </div>
            </div>
          )}

          {uiState.errorMessage && (
            <div
              className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
              aria-live="assertive"
            >
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-800 font-medium text-sm">
                  {uiState.errorMessage}
                </p>
                {uiState.loginAttempts > 0 && !uiState.isLocked && (
                  <p className="text-red-600 text-xs">
                    Attempts remaining: {3 - uiState.loginAttempts}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {/* Custom Google Button with Purple Gradient */}
            <div className="w-full">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  setUiState((u) => ({
                    ...u,
                    errorMessage: "Google login failed",
                  }));
                }}
                useOneTap
                theme="filled_blue"
                size="large"
                text="continue_with"
                shape="pill"
                width={300}
                render={({ onClick, disabled }) => (
                  <button
                    onClick={onClick}
                    disabled={disabled || uiState.isSubmitting || uiState.isLocked || !uiState.isOnline}
                    className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium flex justify-center items-center space-x-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Chrome className="w-5 h-5" />
                    <span>Continue with Google</span>
                  </button>
                )}
              />
            </div>

            {uiState.showBiometric && (
              <button
                onClick={() => handleSocialLogin("biometric")}
                disabled={
                  uiState.isSubmitting || uiState.isLocked || !uiState.isOnline
                }
                className="w-full py-3 px-4 border border-emerald-300 rounded-xl font-medium flex justify-center items-center space-x-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-700">Use Biometric Login</span>
              </button>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t border-slate-200`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 bg-white text-slate-500 font-medium`}>
                Or continue with email
              </span>
            </div>
          </div>

          {renderInput(
            "Email Address",
            "email",
            "email",
            <Mail className="w-4 h-4" />
          )}
          {renderInput(
            "Password",
            "password",
            "password",
            <Lock className="w-4 h-4" />,
            true
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                disabled={uiState.isLocked || uiState.isSubmitting}
                className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500 transition-all duration-200 group-hover:scale-110"
              />
              <span
                className={`text-sm text-slate-700 group-hover:text-violet-600 transition-colors duration-200`}
              >
                Remember me
              </span>
            </label>

            <button
              onClick={handleForgotPasswordClick}
              className="text-sm text-violet-600 font-medium hover:text-violet-800 transition-all duration-200 hover:underline decoration-2 underline-offset-2 transform hover:scale-105"
            >
              Forgot password?
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid || uiState.isSubmitting}
            className={`w-full py-4 rounded-xl font-semibold flex justify-center items-center space-x-2 transition-all duration-300 transform ${
              isFormValid && !uiState.isSubmitting
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
          >
            {uiState.isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : uiState.isLocked ? (
              <>
                <Shield className="w-5 h-5" />
                <span>Account Locked</span>
              </>
            ) : !uiState.isOnline ? (
              <>
                <Globe className="w-5 h-5" />
                <span>Offline</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                <span>Sign In</span>
              </>
            )}
          </button>

          <div className={`text-center pt-4 border-t border-slate-200`}>
            <p className={`text-sm text-slate-600`}>
              Don't have an account?
              <Link
                to="/signup"
                className="text-violet-600 font-medium hover:text-violet-800 transition-all duration-200 hover:underline decoration-2 underline-offset-2 transform hover:scale-105 ml-1"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;