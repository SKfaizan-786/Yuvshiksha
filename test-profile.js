// Quick test script to check profile update issue
const axios = require('axios');

async function testStudentProfileUpdate() {
  try {
    console.log('Testing student profile update...');
    
    // First, let's login as the student
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'faizanuddinsk@gmail.com',
      password: 'your-password-here' // You'll need to provide the actual password
    });
    
    const { token } = loginResponse.data;
    console.log('Login successful, profileComplete:', loginResponse.data.profileComplete);
    
    // Now update the profile
    const profileUpdateData = {
      firstName: "SK",
      lastName: "Abbasuddin",
      studentProfile: {
        phone: "+91 9876543210",
        location: "Kolkata, West Bengal",
        grade: "Class 12",
        subjects: ["Mathematics", "Physics"],
        learningGoals: ["Improve problem solving", "Prepare for entrance exams"],
        bio: "I am a dedicated student looking to improve my math skills."
      }
    };
    
    const updateResponse = await axios.put('http://localhost:5000/api/profile/student', profileUpdateData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Profile update response:', updateResponse.data);
    console.log('Updated profileComplete:', updateResponse.data.user.profileComplete);
    
    // Now let's fetch the profile to verify
    const fetchResponse = await axios.get('http://localhost:5000/api/profile/student', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Fetched profile data:', fetchResponse.data);
    console.log('Fetched profileComplete:', fetchResponse.data.profileComplete);
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testStudentProfileUpdate();
