import React from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            Yuvsiksha
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last Updated: December 26, 2024</p>

          <div className="prose prose-indigo max-w-none">
            <p className="text-gray-700 leading-relaxed mb-6">
              Yuvsiksha ("we", "our", "us") respects your privacy and is committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
              our mobile application, website, and services ("Platform"), in accordance with applicable Indian laws, including:
            </p>

            <ul className="list-disc pl-6 mb-6 text-gray-700 space-y-2">
              <li>Information Technology Act, 2000 (IT Act)</li>
              <li>Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</li>
              <li>Digital Personal Data Protection Act, 2023 (DPDP Act)</li>
              <li>Consumer Protection (E-Commerce) Rules, 2020</li>
            </ul>

            <p className="text-gray-700 leading-relaxed mb-8">
              By using our Platform, you consent to this Privacy Policy.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mb-3">a) Personal Information</h3>
              <p className="text-gray-700 mb-3">(as defined under IT Rules, 2011 & DPDP Act, 2023)</p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
                <li>Name, email address, phone number</li>
                <li>Teacher qualifications, certifications, experience</li>
                <li>Payment details (processed securely by third-party gateways)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">b) Sensitive Personal Data</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
                <li>Financial information (bank/UPI/payment details)</li>
                <li>Authentication information (passwords, OTPs)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">c) Usage & Technical Data</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
                <li>Device details, operating system, IP address</li>
                <li>Location data (if enabled by you)</li>
                <li>App usage analytics</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">d) Content Information</h3>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
                <li>Profile photos, documents, resumes uploaded by Teachers</li>
                <li>Messages, reviews, ratings exchanged on the Platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Data</h2>
              <p className="text-gray-700 mb-3">We process personal data for lawful purposes under the DPDP Act, 2023:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>To create and manage your account</li>
                <li>To connect Teachers and Students</li>
                <li>To process payments (in line with RBI guidelines)</li>
                <li>To provide customer support</li>
                <li>To send important updates, notifications, and promotional offers (with your consent)</li>
                <li>To detect fraud, ensure safety, and comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Legal Basis for Processing</h2>
              <p className="text-gray-700 mb-3">We process your data on the following grounds:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Consent:</strong> You agree when signing up</li>
                <li><strong>Contractual necessity:</strong> To provide services</li>
                <li><strong>Legal obligation:</strong> To comply with Indian laws</li>
                <li><strong>Legitimate interests:</strong> To improve services and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing & Disclosure</h2>
              <p className="text-gray-700 mb-3">We do not sell or rent your data. However, data may be shared with:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Teachers & Students:</strong> Limited details for session purposes</li>
                <li><strong>Payment Gateways:</strong> For transaction processing under RBI/Payment Act, 2007</li>
                <li><strong>Service Providers:</strong> Hosting, analytics, communication services</li>
                <li><strong>Legal Authorities:</strong> If required under the IT Act, 2000 or other laws</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700">
                We implement reasonable security practices under the IT Rules, 2011. Encryption, firewalls, and secure 
                servers protect your information. However, no system is 100% secure; you use the Platform at your own risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700">
                Data will be retained only as long as necessary for providing services or as required under law 
                (e.g., tax & compliance laws). Upon account deletion, personal data will be removed, except where 
                retention is required by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights (Under DPDP Act, 2023)</h2>
              <p className="text-gray-700 mb-3">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Access your personal data</li>
                <li>Correct or update your data</li>
                <li>Request data deletion (subject to legal retention)</li>
                <li>Withdraw consent for specific processing</li>
                <li>Opt-out of promotional communications</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Requests can be sent to: <a href="mailto:yuvsiksha@gmail.com" className="text-indigo-600 hover:text-indigo-800 font-medium">yuvsiksha@gmail.com</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700">
                Our services are for users 18 years and above. Students under 18 require parental/guardian consent, 
                as per the Indian Contract Act, 1872.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies & Tracking</h2>
              <p className="text-gray-700">
                We use cookies and analytics tools in compliance with the IT Act, 2000. Users may disable cookies 
                via browser/device settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700">
                If your data is stored or processed outside India, it will comply with the DPDP Act, 2023, and any 
                applicable Government of India cross-border data transfer regulations.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Policy</h2>
              <p className="text-gray-700">
                We may revise this Privacy Policy as required by law or business needs. Updates will be published 
                on the Platform, and continued use means acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-3">
                For any questions or concerns regarding this Privacy Policy, please contact us:
              </p>
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-gray-700"><strong>Email:</strong> <a href="mailto:yuvsiksha@gmail.com" className="text-indigo-600 hover:text-indigo-800">yuvsiksha@gmail.com</a></p>
                <p className="text-gray-700"><strong>Website:</strong> <a href="https://yuvsiksha.in" className="text-indigo-600 hover:text-indigo-800">https://yuvsiksha.in</a></p>
              </div>
            </section>
          </div>

          {/* Back to Home Button */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link 
              to="/" 
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>© 2024 Yuvsiksha. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
