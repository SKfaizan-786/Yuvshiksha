import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Check,
  X,
  User,
  Mail,
  Lock,
  Loader2,
  Shield,
  CheckCircle2,
  UserCheck,
  GraduationCap,
  Globe,
  AlertTriangle,
  ArrowLeft,
  Home,
} from "lucide-react";

import { setToLocalStorage, getFromLocalStorage } from "../utils/storage";

const passwordStrengthLevels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
const passwordStrengthColors = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-green-500",
];

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  role: "",
  gender: "",
};

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [ui, setUi] = useState({
    showPassword: false,
    showConfirmPassword: false,
    isSubmitting: false,
    submitSuccess: false,
    focusedField: null,
    passwordStrength: 0,
    isOnline: true,
    showCapsLockWarning: false,
    signupError: "",
  });
  const [validation, setValidation] = useState({
    firstName: { valid: false, message: "" },
    lastName: { valid: true, message: "" },
    email: { valid: false, message: "" },
    password: { valid: false, message: "", strength: 0 },
    confirmPassword: { valid: false, message: "" },
    role: { valid: false, message: "" },
    gender: { valid: true, message: "" },
  });

  // Network status effect
  useEffect(() => {
    const handleOnline = () => setUi((u) => ({ ...u, isOnline: true }));
    const handleOffline = () => setUi((u) => ({ ...u, isOnline: false }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setUi((u) => ({ ...u, isOnline: navigator.onLine }));

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Caps lock detection effect
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (
        ui.focusedField === "password" ||
        ui.focusedField === "confirmPassword"
      ) {
        const capsLock = e.getModifierState && e.getModifierState("CapsLock");
        if (typeof capsLock === "boolean") {
          setUi((u) => ({ ...u, showCapsLockWarning: capsLock }));
        }
      } else {
        setUi((u) => ({ ...u, showCapsLockWarning: false }));
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [ui.focusedField]);

  const handleInputChange = useCallback(
    ({ target: { name, value, type, checked } }) => {
      setFormData((p) => ({
        ...p,
        [name]: type === "checkbox" ? checked : value,
      }));
      if (ui.signupError) setUi((u) => ({ ...u, signupError: "" }));
    },
    [ui.signupError]
  );

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const validateField = useCallback(
    (field, value) => {
      const nameRegex = /^[a-zA-Z\s]+$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      let isValid = false;
      let message = "";
      let strength = 0;

      switch (field) {
        case "firstName":
          isValid = value.length >= 2 && nameRegex.test(value);
          message =
            value && (!nameRegex.test(value) || value.length < 2)
              ? "First name must be at least 2 characters, letters only."
              : "";
          break;
        case "lastName":
          isValid =
            value === "" || (value.length >= 2 && nameRegex.test(value));
          message =
            value && (!nameRegex.test(value) || value.length < 2)
              ? "Last name must be at least 2 characters, letters only."
              : "";
          break;
        case "email":
          isValid = emailRegex.test(value);
          message =
            value && !emailRegex.test(value)
              ? "Please enter a valid email address."
              : "";
          break;
        case "password":
          strength = calculatePasswordStrength(value);
          isValid = strength >= 3;
          message =
            value && strength < 3
              ? "Password needs to be stronger (min 8 chars, mixed case, numbers, symbols recommended)."
              : "";
          break;
        case "confirmPassword":
          isValid = value === formData.password && value.length > 0;
          message =
            value && value !== formData.password
              ? "Passwords do not match."
              : "";
          break;
        case "role":
          isValid = value === "student" || value === "teacher";
          message = !value ? "Please select a role." : "";
          if (value === "student") {
            setFormData((p) => ({ ...p, gender: "" }));
            setValidation((v) => ({
              ...v,
              gender: { valid: true, message: "" },
            }));
          }
          break;
        case "gender":
          isValid =
            formData.role !== "teacher" ||
            value === "male" ||
            value === "female";
          message =
            formData.role === "teacher" && !value
              ? "Please select your gender."
              : "";
          break;
        default:
          break;
      }

      setValidation((prev) => ({
        ...prev,
        [field]: {
          valid: isValid,
          message,
          strength: field === "password" ? strength : prev[field]?.strength,
        },
      }));
      if (field === "password") {
        setUi((u) => ({ ...u, passwordStrength: strength }));
      }
    },
    [formData.password, formData.role]
  );

  // Optimized validation effect
  useEffect(() => {
    const fieldsToValidate = [
      "firstName",
      "lastName",
      "email",
      "password",
      "confirmPassword",
      "role",
    ].filter(field => formData[field] !== initialForm[field]);

    if (fieldsToValidate.length > 0) {
      fieldsToValidate.forEach((field) => {
        validateField(field, formData[field]);
      });
    }
  }, [
    formData.firstName,
    formData.lastName,
    formData.email,
    formData.password,
    formData.confirmPassword,
    formData.role,
    validateField
  ]);

  const isFormFullyValid = useCallback(() => {
    return (
      validation.firstName.valid &&
      (formData.lastName === "" || validation.lastName.valid) &&
      validation.email.valid &&
      validation.password.valid &&
      validation.confirmPassword.valid &&
      validation.role.valid &&
      (formData.role !== "teacher" || validation.gender.valid) &&
      formData.acceptTerms &&
      ui.isOnline
    );
  }, [validation, formData, ui.isOnline]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormFullyValid()) {
      setUi(prev => ({
        ...prev,
        signupError: "Please complete all required fields correctly."
      }));
      return;
    }

    setUi((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await response.json();

      if (data.token) {
        setToLocalStorage("token", data.token);
      }
      if (data.user) {
        setToLocalStorage("currentUser", data.user);
      }

      // Ensure state updates complete before navigation
      setTimeout(() => {
        if (formData.role === "student") {
          navigate("/student/profile-setup");
        } else if (formData.role === "teacher") {
          navigate("/teacher/profile-setup");
        }
      }, 100);

    } catch (error) {
      console.error("Signup submission error:", error);
      setUi((prev) => ({
        ...prev,
        isSubmitting: false,
        signupError: error.message || "Registration failed. Please try again.",
      }));
    }
  };

  const inputBase = "w-full py-3 px-4 border rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200 bg-white border-slate-300 text-slate-900 placeholder-slate-400";

  const renderInput = (
    label,
    name,
    type = "text",
    icon = null,
    toggleable = false
  ) => {
    const val = formData[name];
    const error = validation[name]?.message;
    const valid = validation[name]?.valid;
    const isFocused = ui.focusedField === name;
    const isRequired = [
      "firstName",
      "email",
      "password",
      "confirmPassword",
      "role",
    ].includes(name);

    return (
      <div className="space-y-2 transform hover:scale-[1.02] transition-all duration-300">
        <label
          className="text-sm font-semibold text-slate-700 flex items-center gap-2 transition-colors duration-200 hover:text-violet-600"
        >
          {icon && (
            <span className="text-violet-500 transition-transform duration-200 hover:scale-110">
              {icon}
            </span>
          )}
          {label} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          {name === "role" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                    formData.role === "student"
                      ? "border-violet-500 shadow-violet-100 bg-violet-50"
                      : "border-slate-200 hover:border-violet-300 bg-white hover:bg-violet-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === "student"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-violet-600 border-slate-300 focus:ring-violet-500"
                  />
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5 text-violet-500 transition-transform duration-200 hover:scale-110" />
                    <span
                      className="font-medium transition-colors duration-200 hover:text-violet-700 text-slate-700"
                    >
                      Student
                    </span>
                  </div>
                </label>
                <label
                  className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                    formData.role === "teacher"
                      ? "border-violet-500 shadow-violet-100 bg-violet-50"
                      : "border-slate-200 hover:border-violet-300 bg-white hover:bg-violet-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === "teacher"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-violet-600 border-slate-300 focus:ring-violet-500"
                  />
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-5 h-5 text-violet-500 transition-transform duration-200 hover:scale-110" />
                    <span
                      className="font-medium transition-colors duration-200 hover:text-violet-700 text-slate-700"
                    >
                      Teacher
                    </span>
                  </div>
                </label>
              </div>
              {formData.role === "teacher" && (
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <label
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                      formData.gender === "male"
                        ? "border-violet-500 shadow-violet-100 bg-violet-50"
                        : "border-slate-200 hover:border-violet-300 bg-white hover:bg-violet-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === "male"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-violet-600 border-slate-300 focus:ring-violet-500"
                    />
                    <span
                      className="font-medium transition-colors duration-200 hover:text-violet-700 text-slate-700"
                    >
                      Male
                    </span>
                  </label>
                  <label
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                      formData.gender === "female"
                        ? "border-violet-500 shadow-violet-100 bg-violet-50"
                        : "border-slate-200 hover:border-violet-300 bg-white hover:bg-violet-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === "female"}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-violet-600 border-slate-300 focus:ring-violet-500"
                    />
                    <span
                      className="font-medium transition-colors duration-200 hover:text-violet-700 text-slate-700"
                    >
                      Female
                    </span>
                  </label>
                </div>
              )}
            </div>
          ) : name !== "gender" ? (
            <>
              <input
                type={
                  toggleable
                    ? ui[`show${name.charAt(0).toUpperCase() + name.slice(1)}`]
                      ? "text"
                      : "password"
                    : type
                }
                name={name}
                value={val}
                onChange={handleInputChange}
                onFocus={() => setUi((u) => ({ ...u, focusedField: name }))}
                onBlur={() => setUi((u) => ({ ...u, focusedField: null }))}
                className={`${inputBase} transform hover:scale-[1.01] transition-all duration-200 hover:shadow-lg ${
                  error
                    ? "border-red-400 bg-red-50 hover:shadow-red-100"
                    : valid && val !== ""
                    ? "border-emerald-400 bg-emerald-50 hover:shadow-emerald-100"
                    : isFocused
                    ? "border-violet-400 bg-violet-50 shadow-violet-100"
                    : ""
                }`}
                placeholder={`Enter your ${label.toLowerCase()}`}
              />
              {val && !toggleable && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {valid ? (
                    <Check className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <X className="w-5 h-5 text-red-500" />
                  )}
                </div>
              )}

              {toggleable && (
                <button
                  type="button"
                  onClick={() =>
                    setUi((u) => ({
                      ...u,
                      [`show${name.charAt(0).toUpperCase() + name.slice(1)}`]:
                        !u[
                          `show${name.charAt(0).toUpperCase() + name.slice(1)}`
                        ],
                    }))
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-all duration-200 transform hover:scale-110 hover:bg-violet-50 rounded-full p-1"
                >
                  {ui[`show${name.charAt(0).toUpperCase() + name.slice(1)}`] ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              )}
            </>
          ) : null}
        </div>
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <X className="w-4 h-4" />
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden transform hover:scale-[1.02] transition-all duration-500 hover:shadow-2xl">
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-8 text-white relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/90 via-purple-600/90 to-indigo-600/90 group-hover:from-violet-700/90 group-hover:via-purple-700/90 group-hover:to-indigo-700/90 transition-all duration-500"></div>
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/10 rounded-full blur-lg group-hover:scale-110 transition-transform duration-500"></div>

          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                ui.isOnline ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              <Globe
                className={`w-4 h-4 ${
                  ui.isOnline ? "text-green-300" : "text-red-300"
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
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold transform group-hover:scale-105 transition-transform duration-300">
                  Create Account
                </h1>
                <p className="text-violet-200 text-sm">
                  Join our vibrant learning community
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {!ui.isOnline && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
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

          {ui.signupError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <p className="text-red-800 font-medium text-sm">
                {ui.signupError}
              </p>
            </div>
          )}
          {renderInput(
            "Select Role",
            "role",
            "text",
            <UserCheck className="w-4 h-4" />
          )}
          <div className="grid grid-cols-2 gap-4">
            {renderInput(
              "First Name",
              "firstName",
              "text",
              <User className="w-4 h-4" />
            )}
            {renderInput(
              "Last Name",
              "lastName",
              "text",
              <User className="w-4 h-4" />
            )}
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

          {formData.password && (
            <div className="p-4 rounded-xl border transform hover:scale-[1.01] transition-all duration-200 hover:shadow-md bg-slate-50 border-slate-200 hover:bg-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">
                  Password Strength
                </span>
                <span
                  className={`text-sm font-semibold transition-colors duration-200 ${
                    ui.passwordStrength >= 4
                      ? "text-emerald-600"
                      : ui.passwordStrength >= 3
                      ? "text-blue-600"
                      : ui.passwordStrength >= 2
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {passwordStrengthLevels[ui.passwordStrength]}
                </span>
              </div>
              <div className="w-full rounded-full h-2 overflow-hidden bg-slate-200">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    passwordStrengthColors[ui.passwordStrength]
                  }`}
                  style={{ width: `${(ui.passwordStrength / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {renderInput(
            "Confirm Password",
            "confirmPassword",
            "password",
            <Shield className="w-4 h-4" />,
            true
          )}

          <div className="flex items-start space-x-3 p-4 rounded-xl border transform hover:scale-[1.01] transition-all duration-200 hover:shadow-md bg-slate-50 border-slate-200 hover:bg-slate-100">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms}
              onChange={handleInputChange}
              className="mt-1 w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500 transition-all duration-200 hover:scale-110"
            />
            <label className="text-sm text-slate-700">
              I agree to the{" "}
              <a
                href="#"
                className="text-violet-600 font-medium hover:text-violet-800 transition-all duration-200 hover:underline decoration-2 underline-offset-2"
              >
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-violet-600 font-medium hover:text-violet-800 transition-all duration-200 hover:underline decoration-2 underline-offset-2"
              >
                Privacy Policy
              </a>
            </label>
          </div>

          <button
            type="submit"
            disabled={!isFormFullyValid() || ui.isSubmitting}
            className={`w-full py-4 rounded-xl font-semibold flex justify-center items-center space-x-2 transition-all duration-300 transform ${
              isFormFullyValid() && !ui.isSubmitting
                ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
          >
            {ui.isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : !ui.isOnline ? (
              <>
                <Globe className="w-5 h-5" />
                <span>Offline</span>
              </>
            ) : (
              <>
                <UserCheck className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
                <span>Create Account</span>
              </>
            )}
          </button>

          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Already have an account?
              <Link
                to="/login"
                className="text-violet-600 font-medium hover:text-violet-800 ml-1 transition-all duration-200 hover:underline decoration-2 underline-offset-2 transform hover:scale-105 inline-block"
              >
                Log in here
              </Link>
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <div className="text-center text-xs text-slate-500 space-y-1">
              <div className="flex justify-center items-center gap-4">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Secure Registration
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  SSL Protected
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;