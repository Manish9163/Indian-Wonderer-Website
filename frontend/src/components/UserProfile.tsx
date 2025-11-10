import React, { useState, useRef, useEffect } from 'react';
import { User, Camera, Edit3, Save, X, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import * as avatars from '@dicebear/avatars';
import * as style from '@dicebear/avatars-avataaars-sprites';

type UserProfileData = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  location: string | null;
  bio: string | null;
  profilePhoto: string | null;
  avatar: string | null;
  avatarSvg: string | null;
  travelPreferences: string[] | null;
  emergencyContact: {
    name: string | null;
    phone: string | null;
    relationship: string | null;
  } | null;
};

type UserProfileProps = {
  darkMode: boolean;
  userDetails: UserProfileData | null;
  onUpdateProfile: (data: UserProfileData) => void;
  onClose: () => void;
};

const UserProfile: React.FC<UserProfileProps> = ({ darkMode, userDetails, onUpdateProfile, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const initializeProfileData = (): UserProfileData => {
    const defaultData: UserProfileData = {
      firstName: null,
      lastName: null,
      email: null,
      phone: null,
      dateOfBirth: null,
      location: null,
      bio: null,
      profilePhoto: null,
      avatar: 'traveler',
      avatarSvg: null,
      travelPreferences: null,
      emergencyContact: null
    };
    
    if (!userDetails) return defaultData;
    
    return {
      ...defaultData,
      ...userDetails,
      firstName: userDetails.firstName || defaultData.firstName,
      lastName: userDetails.lastName || defaultData.lastName,
      email: userDetails.email || defaultData.email,
      phone: userDetails.phone || defaultData.phone
    };
  };
  
  const [profileData, setProfileData] = useState<UserProfileData>(initializeProfileData());
  const [previewPhoto, setPreviewPhoto] = useState<string>(profileData.profilePhoto || '');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  

  useEffect(() => {
    setPreviewPhoto(profileData.profilePhoto || '');
  }, [profileData.profilePhoto]);

  useEffect(() => {
    if (userDetails) {
      setProfileData(initializeProfileData());
    }
  }, [userDetails]);

  useEffect(() => {
    if (profileData.avatar && !profileData.avatarSvg) {
      setProfileData(prev => ({
        ...prev,
        avatarSvg: getAvatarSvg(profileData.avatar!)
      }));
    }
  }, [profileData.avatar]);

  const avatarOptions = [
    { name: 'Explorer', seed: 'explorer' },
    { name: 'Adventurer', seed: 'adventurer' },
    { name: 'Traveler', seed: 'traveler' },
    { name: 'Wanderer', seed: 'wanderer' },
    { name: 'Nomad', seed: 'nomad' },
    { name: 'Tourist', seed: 'tourist' },
    { name: 'Backpacker', seed: 'backpacker' },
    { name: 'Pilgrim', seed: 'pilgrim' },
    { name: 'Voyager', seed: 'voyager' },
    { name: 'Navigator', seed: 'navigator' },
    
    { name: 'Mountain', seed: 'mountain' },
    { name: 'Ocean', seed: 'ocean' },
    { name: 'Forest', seed: 'forest' },
    { name: 'Desert', seed: 'desert' },
    { name: 'Valley', seed: 'valley' },
    { name: 'Sunrise', seed: 'sunrise' },
    { name: 'Sunset', seed: 'sunset' },
    { name: 'River', seed: 'river' },
    { name: 'Lake', seed: 'lake' },
    { name: 'Waterfall', seed: 'waterfall' },
    { name: 'Canyon', seed: 'canyon' },
    { name: 'Beach', seed: 'beach' },
    { name: 'Island', seed: 'island' },
    { name: 'Jungle', seed: 'jungle' },
    { name: 'Rainforest', seed: 'rainforest' },
    
    { name: 'Journey', seed: 'journey' },
    { name: 'Discovery', seed: 'discovery' },
    { name: 'Adventure', seed: 'adventure' },
    { name: 'Quest', seed: 'quest' },
    { name: 'Expedition', seed: 'expedition' },
    { name: 'Safari', seed: 'safari' },
    { name: 'Trek', seed: 'trek' },
    { name: 'Cruise', seed: 'cruise' },
    { name: 'Roadtrip', seed: 'roadtrip' },
    
    { name: 'Eagle', seed: 'eagle' },
    { name: 'Tiger', seed: 'tiger' },
    { name: 'Lion', seed: 'lion' },
    { name: 'Elephant', seed: 'elephant' },
    { name: 'Dolphin', seed: 'dolphin' },
    { name: 'Panda', seed: 'panda' },
    { name: 'Wolf', seed: 'wolf' },
    { name: 'Bear', seed: 'bear' },
    { name: 'Fox', seed: 'fox' },
    { name: 'Deer', seed: 'deer' },
    
    { name: 'Taj Mahal', seed: 'tajmahal' },
    { name: 'Rajasthan', seed: 'rajasthan' },
    { name: 'Kerala', seed: 'kerala' },
    { name: 'Goa', seed: 'goa' },
    { name: 'Himalayas', seed: 'himalayas' },
    { name: 'Mumbai', seed: 'mumbai' },
    { name: 'Delhi', seed: 'delhi' },
    { name: 'Jaipur', seed: 'jaipur' },
    { name: 'Varanasi', seed: 'varanasi' },
    { name: 'Kashmir', seed: 'kashmir' },
    
    { name: 'Spring', seed: 'spring' },
    { name: 'Summer', seed: 'summer' },
    { name: 'Autumn', seed: 'autumn' },
    { name: 'Winter', seed: 'winter' },
    { name: 'Monsoon', seed: 'monsoon' },
    { name: 'Rainbow', seed: 'rainbow' },
    { name: 'Thunder', seed: 'thunder' },
    { name: 'Breeze', seed: 'breeze' },
    
    { name: 'Hiking', seed: 'hiking' },
    { name: 'Camping', seed: 'camping' },
    { name: 'Swimming', seed: 'swimming' },
    { name: 'Skiing', seed: 'skiing' },
    { name: 'Surfing', seed: 'surfing' },
    { name: 'Climbing', seed: 'climbing' },
    { name: 'Diving', seed: 'diving' },
    { name: 'Kayaking', seed: 'kayaking' },
    
    { name: 'Star', seed: 'star' },
    { name: 'Moon', seed: 'moon' },
    { name: 'Sky', seed: 'sky' },
    { name: 'Cloud', seed: 'cloud' },
    { name: 'Aurora', seed: 'aurora' },
    { name: 'Comet', seed: 'comet' },
    
    { name: 'Phoenix', seed: 'phoenix' },
    { name: 'Dragon', seed: 'dragon' },
    { name: 'Unicorn', seed: 'unicorn' },
    { name: 'Pegasus', seed: 'pegasus' },
    { name: 'Griffin', seed: 'griffin' },
    
    { name: 'Amber', seed: 'amber' },
    { name: 'Azure', seed: 'azure' },
    { name: 'Crimson', seed: 'crimson' },
    { name: 'Emerald', seed: 'emerald' },
    { name: 'Golden', seed: 'golden' },
    { name: 'Indigo', seed: 'indigo' },
    { name: 'Violet', seed: 'violet' },
    { name: 'Coral', seed: 'coral' }
  ];

  const getAvatarSvg = (seed: string) => avatars.createAvatar(style, { seed });

  const handleAvatarChange = (newSeed: string) => {
    const newAvatarSvg = getAvatarSvg(newSeed);
    setProfileData(prev => ({
      ...prev,
      avatar: newSeed,
      avatarSvg: newAvatarSvg
    }));
  };

  const saveToDatabase = async (data: UserProfileData) => {
    try {
      const response = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save profile to database');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Database save error:', error);
      localStorage.setItem('userProfile', JSON.stringify(data));
      return data;
    }
  };

  const handleInputChange = (field: keyof UserProfileData, value: string | string[] | null) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value === '' ? null : value
    }));
  };

  const handleEmergencyContactChange = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        name: prev.emergencyContact?.name || null,
        phone: prev.emergencyContact?.phone || null,
        relationship: prev.emergencyContact?.relationship || null,
        [field]: value === '' ? null : value
      }
    }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewPhoto(result);
        setProfileData(prev => ({
          ...prev,
          profilePhoto: result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTravelPreferencesChange = (preferences: string[]) => {
    const filteredPrefs = preferences.filter(pref => pref.trim() !== '');
    setProfileData(prev => ({
      ...prev,
      travelPreferences: filteredPrefs.length > 0 ? filteredPrefs : null
    }));
  };

  const handleSave = async () => {
    try {
      const updatedProfileData = {
        ...profileData,
        avatarSvg: profileData.avatar ? getAvatarSvg(profileData.avatar) : profileData.avatarSvg
      };
      
      await saveToDatabase(updatedProfileData);
      onUpdateProfile(updatedProfileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const travelOptions = [
    'Adventure', 'Beach', 'Culture', 'Food', 'History', 
    'Nature', 'Photography', 'Relaxation', 'Shopping', 'Sports'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`max-w-4xl w-full max-h-screen overflow-y-auto rounded-xl shadow-2xl ${
        darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
      }`}>
        <div className={`sticky top-0 z-10 px-6 py-4 border-b ${
          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } flex justify-between items-center`}>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="w-6 h-6" />
            User Profile
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${
                darkMode ? 'border-orange-400' : 'border-orange-400'
              } bg-white shadow-lg`}>
                {previewPhoto ? (
                  <img src={previewPhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : profileData.avatar ? (
                  <div 
                    dangerouslySetInnerHTML={{ __html: profileData.avatarSvg || getAvatarSvg(profileData.avatar) }} 
                    className="w-full h-full flex items-center justify-center"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-500 to-green-600">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
              {isEditing && (
                <div className="absolute bottom-0 right-0 space-x-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                    title="Upload Photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                    className="p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors shadow-lg ml-1"
                    title="Choose Avatar"
                  >
                    <User className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            {isEditing && showAvatarSelector && (
              <div className="w-full max-w-md">
                <div className="flex items-center gap-4 mb-3">
                  <div 
                    dangerouslySetInnerHTML={{ __html: getAvatarSvg(profileData.avatar || 'traveler') }} 
                    className="w-16 h-16 rounded-full border-2 border-orange-400 shadow-lg bg-white"
                  />
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={profileData.avatar || ''} 
                      onChange={e => handleAvatarChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Custom avatar name..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-3 border rounded-xl bg-gray-50 dark:bg-gray-800">
                  {avatarOptions.map((option) => (
                    <button
                      key={option.seed}
                      type="button"
                      onClick={() => {
                        handleAvatarChange(option.seed);
                        setShowAvatarSelector(false);
                      }}
                      className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-md ${
                        profileData.avatar === option.seed ? 'bg-orange-100 border-2 border-orange-400' : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div dangerouslySetInnerHTML={{ __html: getAvatarSvg(option.seed) }} className="w-10 h-10 rounded-full border shadow-sm bg-white mb-1" />
                      <span className="text-xs font-medium text-center leading-tight">{option.name}</span>
                    </button>
                  ))}
                </div>
                
                <div className="flex justify-between mt-3">
                  <button
                    onClick={() => {
                      setPreviewPhoto('');
                      setProfileData(prev => ({ ...prev, profilePhoto: null }));
                    }}
                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Remove Photo
                  </button>
                  <button
                    onClick={() => setShowAvatarSelector(false)}
                    className="px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            {isEditing && (
              <p className="text-sm text-gray-500">Click the camera icon to upload a new photo</p>
            )}
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-semibold border-b pb-2">Personal Information</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter your first name"
                  />
                ) : (
                  <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {profileData.firstName || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter your last name"
                  />
                ) : (
                  <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {profileData.lastName || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <label className=" text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profileData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter your email"
                  />
                ) : (
                  <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {profileData.email || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <label className=" text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {profileData.phone || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <label className=" text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={profileData.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                ) : (
                  <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {profileData.dateOfBirth || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <label className=" text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Enter your location"
                  />
                ) : (
                  <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {profileData.location || 'Not specified'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              {isEditing ? (
                <textarea
                  value={profileData.bio || ''}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {profileData.bio || 'No bio added yet'}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">Travel Preferences</h3>
            {isEditing ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {travelOptions.map((option) => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.travelPreferences?.includes(option) || false}
                      onChange={(e) => {
                        const currentPrefs = profileData.travelPreferences || [];
                        const newPrefs = e.target.checked
                          ? [...currentPrefs, option]
                          : currentPrefs.filter(pref => pref !== option);
                        handleTravelPreferencesChange(newPrefs);
                      }}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm">{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profileData.travelPreferences && profileData.travelPreferences.length > 0 ? (
                  profileData.travelPreferences.map((preference, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
                    >
                      {preference}
                    </span>
                  ))
                ) : (
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No travel preferences selected
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b pb-2">Emergency Contact</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.emergencyContact?.name || ''}
                    onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Emergency contact name"
                  />
                ) : (
                  <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {profileData.emergencyContact?.name || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={profileData.emergencyContact?.phone || ''}
                    onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="Emergency contact phone"
                  />
                ) : (
                  <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {profileData.emergencyContact?.phone || 'Not specified'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Relationship</label>
                {isEditing ? (
                  <select
                    value={profileData.emergencyContact?.relationship || ''}
                    onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select relationship</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className={`px-3 py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {profileData.emergencyContact?.relationship || 'Not specified'}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className={`px-4 py-2 rounded-lg border ${
                    darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  } transition-colors`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
