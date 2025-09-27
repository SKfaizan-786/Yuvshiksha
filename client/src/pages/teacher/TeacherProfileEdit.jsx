import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import Cookies from 'js-cookie';
import {
  User,
  GraduationCap,
  Save,
  Home,
  ArrowLeft,
  Loader2,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import { getFromLocalStorage, setToLocalStorage } from "../utils/storage";

const TeacherProfileEdit = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    location: "",
    pinCode: "",
    medium: "",
    bio: "",
    qualifications: "",
    experienceYears: "",
    currentOccupation: "",
    subjects: "",
    boards: "",
    classes: "",
    achievements: "", // add this line
  teachingMode: [],
    preferredSchedule: "",
    teachingApproach: "",
    hourlyRate: "",
    photoUrl: "",
    availability: [],
  });
  const [photoPreview, setPhotoPreview] = useState("");
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // State for new availability slot
  const [newSlot, setNewSlot] = useState({
    day: "",
    startTime: "",
    endTime: "",
  });

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  // Helper to convert array of objects to comma-separated string
  function arrayToString(arr) {
    if (!Array.isArray(arr)) return "";
    // Always extract .text if present, fallback to string value
    return arr
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          // Prefer .text, fallback to .value, fallback to stringified
          return item.text || item.value || "";
        }
        return "";
      })
      .filter(Boolean)
      .join(", ");
  }

  // Helper to convert comma-separated string to array of objects with id and text
  function stringToArray(str) {
    if (!str) return [];
    // FIX: Remove empty strings and ensure text is not empty
    return str
      .split(",")
      .map((s, idx) => {
        const text = s.trim();
        // Only include if text is not empty
        return text.length > 0 ? { id: idx + 1, text } : null;
      })
      .filter(Boolean);
  }

  // Image compression function
  const compressImage = (file, maxSizeKB = 600) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 800px width/height)
        const maxDimension = 800;
        let { width, height } = img;
        
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with high quality and reduce if needed
        let quality = 0.9;
        let compressedDataUrl;
        
        do {
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          const sizeKB = (compressedDataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75 / 1024;
          
          if (sizeKB <= maxSizeKB || quality <= 0.1) {
            break;
          }
          
          quality -= 0.1;
        } while (quality > 0.1);
        
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Delete photo function
  const handleDeletePhoto = async () => {
    if (window.confirm('Are you sure you want to delete your profile photo?')) {
      try {
        // Clear UI immediately for better UX
        setFormData((prev) => ({ ...prev, photoUrl: "" }));
        setPhotoPreview("");
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        
        // Send request to backend to remove photo from database
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile/teacher/delete-photo`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          setMessage({ 
            text: "✅ Profile photo deleted successfully!", 
            type: "success" 
          });
        } else {
          // Even if backend fails, keep UI cleared (better UX)
          setMessage({ 
            text: "⚠️ Photo removed from profile. Please save changes.", 
            type: "info" 
          });
        }
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
        
      } catch (error) {
        console.error('Error deleting photo:', error);
        setMessage({ 
          text: "⚠️ Photo removed from profile. Please save changes.", 
          type: "info" 
        });
        setTimeout(() => setMessage({ text: "", type: "" }), 3000);
      }
    }
  };

  // Main useEffect to initialize user and form data
  useEffect(() => {
    const loadProfileData = async () => {
      const user = getFromLocalStorage("currentUser");
      if (!user || user.role !== "teacher") {
        navigate("/login");
        return;
      }
      setCurrentUser(user);

      try {
        // Fetch fresh profile data from API
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/profile/teacher`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const profileData = await response.json();
          console.log('Fresh profile data from API:', profileData);
          
          const teacherData = profileData.teacherProfile || {};
          
          setFormData({
            firstName: profileData.firstName || teacherData.firstName || user.firstName || "",
            lastName: profileData.lastName || teacherData.lastName || user.lastName || "",
            phone: teacherData.phone || "",
            location: teacherData.location || "",
            pinCode: teacherData.pinCode || "",
            medium: teacherData.medium || "",
            bio: teacherData.bio || "",
            qualifications: teacherData.qualifications || "",
            experienceYears: teacherData.experienceYears || teacherData.experience || "",
            currentOccupation: teacherData.currentOccupation || "",
            subjects: arrayToString(teacherData.subjects),
            boards: arrayToString(teacherData.boards),
            classes: arrayToString(teacherData.classes),
            achievements: arrayToString(teacherData.achievements),
            teachingMode: Array.isArray(teacherData.teachingMode) ? teacherData.teachingMode : (teacherData.teachingMode ? [teacherData.teachingMode] : []),
            preferredSchedule: teacherData.preferredSchedule || "",
            teachingApproach: teacherData.teachingApproach || "",
            hourlyRate: teacherData.hourlyRate || "",
            photoUrl: teacherData.photoUrl || "",
            availability: teacherData.availability || [],
          });
          setPhotoPreview(teacherData.photoUrl || "");
        } else {
          // Fallback to localStorage if API fails
          console.log('API failed, falling back to localStorage');
          const teacherData = user.teacherProfile || user.teacherProfileData || {};
          
          setFormData({
            firstName: teacherData.firstName || user.firstName || "",
            lastName: teacherData.lastName || user.lastName || "",
            phone: teacherData.phone || "",
            location: teacherData.location || "",
            pinCode: teacherData.pinCode || "",
            medium: teacherData.medium || "",
            bio: teacherData.bio || "",
            qualifications: teacherData.qualifications || "",
            experienceYears: teacherData.experienceYears || teacherData.experience || "",
            currentOccupation: teacherData.currentOccupation || "",
            subjects: arrayToString(teacherData.subjects),
            boards: arrayToString(teacherData.boards),
            classes: arrayToString(teacherData.classes),
            achievements: arrayToString(teacherData.achievements),
            teachingMode: Array.isArray(teacherData.teachingMode) ? teacherData.teachingMode : (teacherData.teachingMode ? [teacherData.teachingMode] : []),
            preferredSchedule: teacherData.preferredSchedule || "",
            teachingApproach: teacherData.teachingApproach || "",
            hourlyRate: teacherData.hourlyRate || "",
            photoUrl: teacherData.photoUrl || "",
            availability: teacherData.availability || [],
          });
          setPhotoPreview(teacherData.photoUrl || "");
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        // Fallback to localStorage
        const teacherData = user.teacherProfile || user.teacherProfileData || {};
        
        setFormData({
          firstName: teacherData.firstName || user.firstName || "",
          lastName: teacherData.lastName || user.lastName || "",
          phone: teacherData.phone || "",
          location: teacherData.location || "",
          pinCode: teacherData.pinCode || "",
          medium: teacherData.medium || "",
          bio: teacherData.bio || "",
          qualifications: teacherData.qualifications || "",
          experienceYears: teacherData.experienceYears || teacherData.experience || "",
          currentOccupation: teacherData.currentOccupation || "",
          subjects: arrayToString(teacherData.subjects),
          boards: arrayToString(teacherData.boards),
          classes: arrayToString(teacherData.classes),
          achievements: arrayToString(teacherData.achievements),
          teachingMode: Array.isArray(teacherData.teachingMode) ? teacherData.teachingMode : (teacherData.teachingMode ? [teacherData.teachingMode] : []),
          preferredSchedule: teacherData.preferredSchedule || "",
          teachingApproach: teacherData.teachingApproach || "",
          hourlyRate: teacherData.hourlyRate || "",
          photoUrl: teacherData.photoUrl || "",
          availability: teacherData.availability || [],
        });
        setPhotoPreview(teacherData.photoUrl || "");
      }

      setLoading(false);
    };

    loadProfileData();
  }, [navigate]);

  // Additional useEffect to properly initialize availability
  useEffect(() => {
    const user = getFromLocalStorage("currentUser");
    if (user?.teacherProfile?.availability) {
      setFormData((prev) => ({
        ...prev,
        availability: user.teacherProfile.availability,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, files, checked } = e.target;
    if (name === "photo" && files && files[0]) {
      const file = files[0];
      
      // File size validation (accounting for Base64 expansion - ~33% larger)
      const maxRawSize = 750 * 1024; // 750KB raw file (becomes ~1MB as Base64)
      if (file.size > maxRawSize) {
        const maxSizeMB = (maxRawSize / 1024 / 1024).toFixed(1);
        const currentSizeMB = (file.size / 1024 / 1024).toFixed(2);
        setMessage({
          text: `File size too large! Please upload an image smaller than ${maxSizeMB}MB. Current size: ${currentSizeMB}MB\n\n💡 Note: Images are processed and may become larger during upload.`,
          type: "error"
        });
        // Clear the file input
        e.target.value = "";
        return;
      }
      
      // File type validation
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({
          text: "Please upload a valid image file (JPG, PNG, or GIF only)!",
          type: "error"
        });
        e.target.value = "";
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        // Calculate actual Base64 size (more accurate method)
        const base64Size = (base64String.length - 'data:image/jpeg;base64,'.length) * 0.75;
        const maxBase64Size = 1 * 1024 * 1024; // 1MB limit
        
        if (base64Size > maxBase64Size) {
          // Try automatic compression
          setMessage({ 
            text: "🔄 Image too large, attempting automatic compression...", 
            type: "info" 
          });
          
          try {
            const compressedDataUrl = await compressImage(file, 600);
            const compressedSize = (compressedDataUrl.length - 'data:image/jpeg;base64,'.length) * 0.75;
            
            if (compressedSize <= maxBase64Size) {
              setFormData((prev) => ({ ...prev, photoUrl: compressedDataUrl }));
              setPhotoPreview(compressedDataUrl);
              setMessage({
                text: `✅ Image compressed successfully!\nOriginal: ${(file.size / 1024).toFixed(1)}KB → Compressed: ${(compressedSize / 1024).toFixed(1)}KB`,
                type: "success"
              });
              setTimeout(() => setMessage({ text: "", type: "" }), 5000);
              return;
            }
          } catch (error) {
            console.error('Compression failed:', error);
          }
          
          // If compression failed or still too large
          setMessage({
            text: `❌ Image still too large after compression!\n\n💡 Please manually resize your image to under 600KB using:\n• TinyPNG.com\n• Photopea.com\n• Or any image editor`,
            type: "error"
          });
          
          // Clear the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
          return;
        }
        
        setFormData((prev) => ({ ...prev, photoUrl: base64String }));
        setPhotoPreview(base64String);
        // Show success with both original and processed sizes
        setMessage({ 
          text: `✅ Image ready! Size: ${(file.size / 1024).toFixed(1)}KB, Processed: ${(base64Size / 1024).toFixed(1)}KB`, 
          type: "success" 
        });
        // Clear success message after 4 seconds
        setTimeout(() => setMessage({ text: "", type: "" }), 4000);
      };
      reader.readAsDataURL(file);
    } else if (name === "teachingMode") {
      setFormData((prev) => {
        const newModes = checked
          ? [...prev.teachingMode, value]
          : prev.teachingMode.filter((m) => m !== value);
        return { ...prev, teachingMode: newModes };
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSlotChange = (e) => {
    const { name, value } = e.target;
    setNewSlot((prev) => ({ ...prev, [name]: value }));
  };

  const addAvailabilitySlot = () => {
    if (newSlot.day && newSlot.startTime && newSlot.endTime) {
      if (newSlot.startTime >= newSlot.endTime) {
        setMessage({
          text: "End time must be after start time",
          type: "error",
        });
        return;
      }

      // Check for overlapping slots
      const hasOverlap = formData.availability.some(
        (slot) =>
          slot.day === newSlot.day &&
          ((newSlot.startTime >= slot.startTime &&
            newSlot.startTime < slot.endTime) ||
            (newSlot.endTime > slot.startTime &&
              newSlot.endTime <= slot.endTime) ||
            (newSlot.startTime <= slot.startTime &&
              newSlot.endTime >= slot.endTime))
      );

      if (hasOverlap) {
        setMessage({
          text: "This time slot overlaps with an existing slot",
          type: "error",
        });
        return;
      }

      setFormData((prev) => ({
        ...prev,
        availability: [...prev.availability, newSlot],
      }));
      setNewSlot({ day: "", startTime: "", endTime: "" });
      setMessage({ text: "", type: "" }); // Clear any previous error messages
    } else {
      setMessage({ text: "Please fill all slot fields", type: "error" });
    }
  };

  const removeAvailabilitySlot = (index) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.filter((_, i) => i !== index),
    }));
  };

  // Updated handleSubmit to properly handle availability
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: "", type: "" });

    try {
      let response;
      const isPhotoFile = fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files[0];

      // Prepare the correct keys for backend
      const arrayPayload = {
        subjectsTaught: stringToArray(formData.subjects),
        boardsTaught: stringToArray(formData.boards),
        classesTaught: stringToArray(formData.classes),
        achievements: stringToArray(formData.achievements),
        availability: formData.availability,
        teachingMode: formData.teachingMode,
      };

      if (isPhotoFile) {
        const form = new FormData();
        // Use correct keys for backend
  form.append("subjectsTaught", JSON.stringify(arrayPayload.subjectsTaught));
  form.append("boardsTaught", JSON.stringify(arrayPayload.boardsTaught));
  form.append("classesTaught", JSON.stringify(arrayPayload.classesTaught));
  form.append("achievements", JSON.stringify(arrayPayload.achievements));
  form.append("availability", JSON.stringify(arrayPayload.availability));
  
  form.append("teachingMode", JSON.stringify(arrayPayload.teachingMode));
        Object.entries(formData).forEach(([key, value]) => {
          if (
            ["subjects", "boards", "classes", "achievements", "availability", "teachingMode"].includes(key)
          )
            return; // already handled above with JSON.stringify
          if (key === "photo" && isPhotoFile) {
            form.append("photo", fileInputRef.current.files[0]);
          } else if (value !== null && value !== undefined) {
            form.append(key, value);
          }
        });
        response = await fetch(
          import.meta.env.VITE_BACKEND_URL + "/api/profile/teacher",
          {
            method: "PUT",
            credentials: "include",
            body: form,
          }
        );
      } else {
        // Send as JSON (no file upload)
        const payload = {
          ...formData,
          ...arrayPayload,
        };
        // Remove the old keys so only the correct ones are sent
  delete payload.subjects;
  delete payload.boards;
  delete payload.classes;
        // NOTE: Do NOT delete payload.achievements here - it has been overwritten with the array version, which we need to send
        response = await fetch(
          import.meta.env.VITE_BACKEND_URL + "/api/profile/teacher",
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const result = await response.json();

      // Update local storage with the new data
      const updatedUser = {
        ...currentUser,
        ...result.user,
        teacherProfile: result.user.teacherProfile, // use backend's updated profile only
        teacherProfileData: result.user.teacherProfile, // keep in sync
      };

      setToLocalStorage("currentUser", updatedUser);
      setCurrentUser(updatedUser);

      setMessage({ text: "Profile updated successfully!", type: "success" });
      setTimeout(() => navigate("/teacher/profile"), 1500);
    } catch (error) {
      console.error('Profile update error:', error);
      
      let errorMessage = "Failed to save profile. Please try again.";
      
      // Handle specific error cases
      if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
        errorMessage = "🌐 Connection issue detected. This might be due to:\n• Network connectivity problems\n• Server maintenance\n• Browser security settings\n\n💡 Try refreshing the page or check your internet connection.";
      } else if (error.message.includes('413') || error.message.includes('Content Too Large')) {
        errorMessage = "📁 File size too large! Please upload an image smaller than 750KB.\n\n💡 Tip: Compress your image using TinyPNG, JPEG-Optimizer, or reduce image dimensions.";
      } else if (error.message.includes('400') && error.message.includes('image')) {
        errorMessage = "🖼️ Invalid file type! Please upload only JPG, PNG, or GIF images.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage({
        text: errorMessage,
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-delayed"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-slow"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/teacher/profile"
            className="flex items-center space-x-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/80 transition-all duration-200 shadow-sm text-slate-700 hover:text-blue-600 group"
          >
            <ArrowLeft className="w-5 h-5 transition-colors duration-200 group-hover:text-blue-600" />
            <span className="font-medium">Back to Profile</span>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900">Edit Profile</h1>
            <p className="text-slate-600">
              Update your personal and teaching details
            </p>
          </div>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Form Card */}
        <div className="max-w-6xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <form onSubmit={handleSubmit} className="p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column - Personal Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                    <User className="w-6 h-6" /> Personal Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="location"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        id="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Kolkata, West Bengal — please include your locality for better accuracy"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="pinCode"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Pin Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="pinCode"
                        id="pinCode"
                        value={formData.pinCode}
                        onChange={handleChange}
                        placeholder="e.g., 700001"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Preferred Teaching Mode
                      </label>
                      <div className="flex flex-col gap-2 p-3 border rounded-lg border-gray-300">
                        {[
                          { value: "Teacher's place", label: "Teacher's place" },
                          { value: "Student's place", label: "Student's place" },
                          { value: 'Online', label: 'Online' }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              name="teachingMode"
                              value={option.value}
                              checked={formData.teachingMode.includes(option.value)}
                              onChange={handleChange}
                              className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="medium"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Medium of Instruction{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="medium"
                        id="medium"
                        value={formData.medium}
                        onChange={handleChange}
                        placeholder="e.g., English, Hindi, Bengali"
                        required
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="bio"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        id="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      ></textarea>
                    </div>

                    {/* Profile Image Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Profile Image
                      </label>
                      
                      {/* File Size Warning Box */}
                      <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-800">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium">
                            Important: Maximum file size is 750KB (images expand during processing)
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {photoPreview ? (
                          <div className="relative">
                            <img
                              src={photoPreview}
                              alt="Profile Preview"
                              className="w-20 h-20 rounded-full object-cover border-2 border-blue-300 shadow-sm"
                            />
                            {/* Delete Photo Button */}
                            <button
                              type="button"
                              onClick={handleDeletePhoto}
                              className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors duration-200 group"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            name="photo"
                            accept="image/jpeg,image/jpg,image/png,image/gif"
                            onChange={handleChange}
                            ref={fileInputRef}
                            className="block text-sm text-slate-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            disabled={isSaving}
                          />
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-slate-600 font-medium">
                              📎 Supported: JPG, PNG, GIF (Max. 750KB)
                            </p>
                            <p className="text-xs text-slate-500">
                              💡 Status: {photoPreview ? '✅ Image ready for upload' : '❌ No image selected'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Teaching Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-purple-700 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6" /> Teaching Information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="qualifications"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Qualifications
                      </label>
                      <input
                        type="text"
                        name="qualifications"
                        id="qualifications"
                        value={formData.qualifications}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="experienceYears"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Experience (years)
                      </label>
                      <input
                        type="number"
                        name="experienceYears"
                        id="experienceYears"
                        value={formData.experienceYears}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="currentOccupation"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Current Occupation
                      </label>
                      <input
                        type="text"
                        name="currentOccupation"
                        id="currentOccupation"
                        value={formData.currentOccupation}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="subjects"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Subjects (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="subjects"
                        id="subjects"
                        value={formData.subjects}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="boards"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Boards (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="boards"
                        id="boards"
                        value={formData.boards}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="classes"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Classes/Courses Taught (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="classes"
                        id="classes"
                        value={formData.classes}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="teachingApproach"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Teaching Approach
                      </label>
                      <input
                        type="text"
                        name="teachingApproach"
                        id="teachingApproach"
                        value={formData.teachingApproach}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="achievements"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Achievements (comma-separated)
                      </label>
                      <input
                        type="text"
                        name="achievements"
                        id="achievements"
                        value={formData.achievements}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="hourlyRate"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Hourly Rate (INR)
                      </label>
                      <input
                        type="number"
                        name="hourlyRate"
                        id="hourlyRate"
                        value={formData.hourlyRate}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    {/* Availability Section */}
                    <div className="pt-4">
                      <h4 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5" /> Weekly Availability
                      </h4>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <select
                            name="day"
                            value={newSlot.day}
                            onChange={handleSlotChange}
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select day</option>
                            {daysOfWeek.map((day) => (
                              <option key={day} value={day}>
                                {day}
                              </option>
                            ))}
                          </select>

                          <input
                            type="time"
                            name="startTime"
                            value={newSlot.startTime}
                            onChange={handleSlotChange}
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />

                          <input
                            type="time"
                            name="endTime"
                            value={newSlot.endTime}
                            onChange={handleSlotChange}
                            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={addAvailabilitySlot}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Time Slot
                        </button>

                        {formData.availability.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h5 className="text-sm font-medium text-slate-700">
                              Current Availability:
                            </h5>
                            <div className="space-y-2">
                              {formData.availability.map((slot, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200"
                                >
                                  <span className="font-medium">
                                    {slot.day}: {slot.startTime} -{" "}
                                    {slot.endTime}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeAvailabilitySlot(index)
                                    }
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {message.text && (
                <div
                  className={`mt-6 p-4 rounded-lg font-medium ${
                    message.type === "success"
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}
                >
                  <div className="whitespace-pre-line text-sm leading-relaxed">
                    {message.text}
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfileEdit;