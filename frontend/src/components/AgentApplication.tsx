import React, { useState } from 'react';
import apiService from '../services/api.service';

interface AgentFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  experience_years: string;
  specialization: string;
  languages_spoken: string;
  certification: string;
  additional_notes: string;
}

const AgentApplication: React.FC = () => {
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    experience_years: '',
    specialization: '',
    languages_spoken: '',
    certification: '',
    additional_notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Create FormData for form submission
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      const response = await apiService.submitAgentApplication(formDataToSend);

      if (response.success) {
        setSuccess(response.message);
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          experience_years: '',
          specialization: '',
          languages_spoken: '',
          certification: '',
          additional_notes: ''
        });
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('Application submission error:', err);
      setError('An error occurred while submitting your application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-purple-700 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl p-8 text-center">
          <h1 className="text-4xl font-bold mb-2">Become a Tour Agent</h1>
          <p className="text-xl opacity-90">Join our network of professional tour guides and agents</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-b-2xl shadow-2xl p-8">
          {/* Back Link */}
          <a
            href="/"
            className="inline-block mb-6 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </a>

          {/* Benefits Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Why Join Our Agent Network?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <span className="text-green-500 font-bold mr-3">✓</span>
                  Access to exclusive tour packages and destinations
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-green-500 font-bold mr-3">✓</span>
                  Competitive commission structure
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-green-500 font-bold mr-3">✓</span>
                  Professional training and support
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <span className="text-green-500 font-bold mr-3">✓</span>
                  Marketing and promotional assistance
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-green-500 font-bold mr-3">✓</span>
                  24/7 customer support for your clients
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-green-500 font-bold mr-3">✓</span>
                  Flexible working arrangements
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-lg mb-6">
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Application Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="+1-555-123-4567"
                />
              </div>

              <div>
                <label htmlFor="experience_years" className="block text-sm font-semibold text-gray-700 mb-2">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="experience_years"
                  name="experience_years"
                  value={formData.experience_years}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max="50"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-vertical"
                placeholder="Enter your complete address"
              />
            </div>

            <div>
              <label htmlFor="specialization" className="block text-sm font-semibold text-gray-700 mb-2">
                Specialization <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="e.g., Cultural Tours, Adventure Tourism, Wildlife, Photography Tours"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="languages_spoken" className="block text-sm font-semibold text-gray-700 mb-2">
                  Languages Spoken <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="languages_spoken"
                  name="languages_spoken"
                  value={formData.languages_spoken}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="e.g., English, Spanish, French"
                />
              </div>

              <div>
                <label htmlFor="certification" className="block text-sm font-semibold text-gray-700 mb-2">
                  Certifications/Licenses
                </label>
                <input
                  type="text"
                  id="certification"
                  name="certification"
                  value={formData.certification}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="e.g., Licensed Tour Guide, Tourism Certificate"
                />
              </div>
            </div>

            <div>
              <label htmlFor="additional_notes" className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Information
              </label>
              <textarea
                id="additional_notes"
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors resize-vertical"
                placeholder="Tell us about your experience, unique skills, or any additional information that would help us evaluate your application"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting Application...
                  </div>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="text-center text-gray-600 text-sm mt-8 pt-6 border-t border-gray-200">
            <p>&copy; 2024 Tour Management System. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentApplication;
