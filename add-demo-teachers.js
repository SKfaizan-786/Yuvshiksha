// Demo teachers to add to localStorage for testing
const demoTeachers = [
  {
    _id: "teacher1",
    firstName: "Anita",
    lastName: "Sharma",
    email: "anita.sharma@example.com",
    role: "teacher",
    profileComplete: true,
    rating: 4.8,
    totalStudents: 150,
    teacherProfile: {
      isListed: true,
      experienceYears: 8,
      hourlyRate: 800,
      subjectsTaught: ["Mathematics", "Physics"],
      boardsTaught: ["CBSE", "ICSE"],
      bio: "Experienced mathematics teacher with a passion for making complex concepts simple.",
      location: "Delhi, India",
      teachingMode: "both",
      photoUrl: "https://images.unsplash.com/photo-1494790108755-2616b332-1-1/crop=faces&fit=crop&w=256&h=256",
      phone: "+91-9876543210",
      qualifications: "M.Sc Mathematics, B.Ed",
      availability: [
        { day: "Monday", slots: ["9:00 AM", "2:00 PM"] },
        { day: "Wednesday", slots: ["10:00 AM", "3:00 PM"] },
        { day: "Friday", slots: ["11:00 AM", "4:00 PM"] }
      ]
    }
  },
  {
    _id: "teacher2",
    firstName: "Rajesh",
    lastName: "Kumar",
    email: "rajesh.kumar@example.com",
    role: "teacher",
    profileComplete: true,
    rating: 4.6,
    totalStudents: 120,
    teacherProfile: {
      isListed: true,
      experienceYears: 6,
      hourlyRate: 650,
      subjectsTaught: ["Chemistry", "Biology"],
      boardsTaught: ["CBSE", "NCERT"],
      bio: "Dedicated science teacher helping students excel in chemistry and biology.",
      location: "Mumbai, India",
      teachingMode: "online",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d/crop=faces&fit=crop&w=256&h=256",
      phone: "+91-9876543211",
      qualifications: "M.Sc Chemistry, B.Ed",
      availability: [
        { day: "Tuesday", slots: ["9:00 AM", "2:00 PM"] },
        { day: "Thursday", slots: ["10:00 AM", "3:00 PM"] },
        { day: "Saturday", slots: ["11:00 AM", "4:00 PM"] }
      ]
    }
  },
  {
    _id: "teacher3",
    firstName: "Priya",
    lastName: "Patel",
    email: "priya.patel@example.com",
    role: "teacher",
    profileComplete: true,
    rating: 4.9,
    totalStudents: 200,
    teacherProfile: {
      isListed: true,
      experienceYears: 10,
      hourlyRate: 900,
      subjectsTaught: ["English", "Literature"],
      boardsTaught: ["CBSE", "ICSE", "IB"],
      bio: "English language expert with a decade of experience in literature and creative writing.",
      location: "Bangalore, India",
      teachingMode: "both",
      photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80/crop=faces&fit=crop&w=256&h=256",
      phone: "+91-9876543212",
      qualifications: "M.A English Literature, B.Ed",
      availability: [
        { day: "Monday", slots: ["8:00 AM", "1:00 PM"] },
        { day: "Wednesday", slots: ["9:00 AM", "2:00 PM"] },
        { day: "Friday", slots: ["10:00 AM", "3:00 PM"] }
      ]
    }
  }
];

// Function to add teachers to localStorage
function addDemoTeachers() {
  // Get existing users
  const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
  
  // Add demo teachers if they don't exist
  demoTeachers.forEach(teacher => {
    const exists = existingUsers.find(user => user.email === teacher.email);
    if (!exists) {
      existingUsers.push(teacher);
    }
  });
  
  // Save back to localStorage
  localStorage.setItem('users', JSON.stringify(existingUsers));
  console.log('Demo teachers added successfully!');
  console.log('Total users:', existingUsers.length);
}

// Add teachers when this script runs
addDemoTeachers();
