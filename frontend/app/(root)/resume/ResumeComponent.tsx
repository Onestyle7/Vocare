import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Languages, Home, Trash2, ZoomIn, ZoomOut, Move } from 'lucide-react';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  profession: string;
  summary: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrent: boolean;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface Skill {
  id: string;
  name: string;
}

const CVCreator: React.FC = () => {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    profession: '',
    summary: ''
  });

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showFullDates, setShowFullDates] = useState(true);
  
  // CV Preview controls
  const [cvScale, setCvScale] = useState(0.8);
  const [cvPosition, setCvPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      isCurrent: false
    };
    setExperiences([...experiences, newExp]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    setExperiences(experiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      school: '',
      degree: '',
      startDate: '',
      endDate: '',
      isCurrent: false
    };
    setEducation([...education, newEdu]);
  };

  const updateEducation = (id: string, field: keyof Education, value: string | boolean) => {
    setEducation(education.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id));
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: ''
    };
    setSkills([...skills, newSkill]);
  };

  const updateSkill = (id: string, field: keyof Skill, value: string) => {
    setSkills(skills.map(skill => 
      skill.id === id ? { ...skill, [field]: value } : skill
    ));
  };

  const removeSkill = (id: string) => {
    setSkills(skills.filter(skill => skill.id !== id));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (showFullDates) {
      return date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' });
    } else {
      return date.getFullYear().toString();
    }
  };

  const handleZoomIn = () => {
    setCvScale(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setCvScale(prev => Math.max(prev - 0.1, 0.3));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cvPosition.x,
      y: e.clientY - cvPosition.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setCvPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setCvScale(0.8);
    setCvPosition({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row lg:pt-6 font-poppins">
      {/* Top Navigation for Mobile */}
      <div className="lg:hidden bg-white shadow-lg flex justify-center items-center py-4 mb-4">
        <button
          onClick={() => window.location.href = '/'}
          className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
          title="Strona główna"
        >
          <Home size={24} className="text-gray-600" />
        </button>
      </div>

      {/* Sidebar for Desktop */}
      <div className="hidden lg:flex w-16 bg-white shadow-lg flex-col items-center py-6 mx-3 rounded-lg">
        <button
          onClick={() => window.location.href = '/'}
          className="p-3 hover:bg-gray-100 rounded-lg transition-colors"
          title="Strona główna"
        >
          <Home size={24} className="text-gray-600" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row flex-1 gap-3 px-3 lg:px-0">
        {/* Left Panel - Form Inputs */}
        <div className="lg:w-1/2 bg-white shadow-lg overflow-y-auto rounded-lg">
          <div className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Kreator CV</h1>
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-600">Format dat:</label>
                <select
                  value={showFullDates ? 'full' : 'year'}
                  onChange={(e) => setShowFullDates(e.target.value === 'full')}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full">Miesiąc i rok</option>
                  <option value="year">Tylko rok</option>
                </select>
              </div>
            </div>
            
            {/* Personal Information Section */}
            <div className="bg-gray-50 rounded-lg p-4 lg:p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <User className="mr-2" size={20} />
                Dane osobowe
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Imię</label>
                    <input
                      type="text"
                      placeholder="Imię"
                      value={personalInfo.firstName}
                      onChange={(e) => setPersonalInfo({...personalInfo, firstName: e.target.value})}
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Nazwisko</label>
                    <input
                      type="text"
                      placeholder="Nazwisko"
                      value={personalInfo.lastName}
                      onChange={(e) => setPersonalInfo({...personalInfo, lastName: e.target.value})}
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Adres e-mail</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Pozycja</label>
                  <input
                    type="text"
                    placeholder="np. Projektant serwisu"
                    value={personalInfo.profession}
                    onChange={(e) => setPersonalInfo({...personalInfo, profession: e.target.value})}
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Collapsible Additional Fields */}
                <details className="group">
                  <summary className="cursor-pointer text-red-600 font-medium">
                    Pokaż dodatkowe pola
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Numer telefonu</label>
                        <input
                          type="tel"
                          placeholder="np. +48 22 263 98 31"
                          value={personalInfo.phone}
                          onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
                          className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Adres</label>
                        <input
                          type="text"
                          placeholder="np. ul. Partyzantów 16"
                          value={personalInfo.address}
                          onChange={(e) => setPersonalInfo({...personalInfo, address: e.target.value})}
                          className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {/* Profile Section */}
            <div className="bg-gray-50 rounded-lg p-4 lg:p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Profil osobisty</h2>
              <p className="text-sm text-gray-600 mb-4">
                Krótka informacja na górze CV, która podsumowuje odpowiednie doświadczenie i kwalifikacje w 4-6 zdaniach.
              </p>
              <textarea
                placeholder="Kierownik projektu z ponad 5-letnim doświadczeniem poszukujący nowych możliwości."
                value={personalInfo.summary}
                onChange={(e) => setPersonalInfo({...personalInfo, summary: e.target.value})}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Experience Section */}
            <div className="bg-gray-50 rounded-lg p-4 lg:p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <Briefcase className="mr-2" size={20} />
                Doświadczenie zawodowe
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Pochwal się swoimi osiągnięciami, opisując swoje codzienne obowiązki w 3-6 zdaniach, a następnie podaj co najmniej dwa kluczowe osiągnięcia.
              </p>
              {experiences.map((exp) => (
                <div key={exp.id} className="mb-4 p-4 bg-white border border-gray-200 rounded-lg group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                        <input
                          type="text"
                          placeholder="Firma"
                          value={exp.company}
                          onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Stanowisko"
                          value={exp.position}
                          onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                        <input
                          type="date"
                          placeholder="Data rozpoczęcia"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="date"
                            placeholder="Data zakończenia"
                            value={exp.endDate}
                            onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={exp.isCurrent}
                          />
                          <label className="flex items-center text-sm text-gray-600">
                            <input
                              type="checkbox"
                              checked={exp.isCurrent}
                              onChange={(e) => {
                                updateExperience(exp.id, 'isCurrent', e.target.checked);
                                if (e.target.checked) {
                                  updateExperience(exp.id, 'endDate', '');
                                }
                              }}
                              className="mr-1"
                            />
                            Obecnie
                          </label>
                        </div>
                      </div>
                      <textarea
                        placeholder="Opis obowiązków"
                        value={exp.description}
                        onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                        rows={2}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={() => removeExperience(exp.id)}
                      className="ml-2 p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                      title="Usuń doświadczenie"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addExperience}
                className="text-red-600 font-medium flex items-center hover:text-red-700"
              >
                <span className="text-xl mr-2">+</span>
                Dodaj doświadczenie zawodowe
              </button>
            </div>

            {/* Skills Section */}
            <div className="bg-gray-50 rounded-lg p-4 lg:p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <Award className="mr-2" size={20} />
                Umiejętności
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Opisz swoje obszary specjalizacji, koncentrując się na odpowiednich umiejętnościach twardych.
              </p>
              {skills.map((skill) => (
                <div key={skill.id} className="mb-3 p-3 bg-white border border-gray-200 rounded-lg group">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      placeholder="Nazwa umiejętności"
                      value={skill.name}
                      onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeSkill(skill.id)}
                      className="ml-2 p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                      title="Usuń umiejętność"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addSkill}
                className="text-red-600 font-medium flex items-center hover:text-red-700"
              >
                <span className="text-xl mr-2">+</span>
                Dodaj umiejętności
              </button>
            </div>

            {/* Education Section */}
            <div className="bg-gray-50 rounded-lg p-4 lg:p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                <GraduationCap className="mr-2" size={20} />
                Edukacja
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Dodaj swoje wykształcenie, niezależnie od tego, czy jest średnie, czy wyższe. W razie potrzeby dodaj odpowiednie kursy, projekty lub osiągnięcia (np. wyniki).
              </p>
              {education.map((edu) => (
                <div key={edu.id} className="mb-4 p-4 bg-white border border-gray-200 rounded-lg group">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                        <input
                          type="text"
                          placeholder="Uczelnia/Szkoła"
                          value={edu.school}
                          onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Kierunek/Stopień"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="date"
                          value={edu.startDate}
                          onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="date"
                            value={edu.endDate}
                            onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={edu.isCurrent}
                          />
                          <label className="flex items-center text-sm text-gray-600">
                            <input
                              type="checkbox"
                              checked={edu.isCurrent}
                              onChange={(e) => {
                                updateEducation(edu.id, 'isCurrent', e.target.checked);
                                if (e.target.checked) {
                                  updateEducation(edu.id, 'endDate', '');
                                }
                              }}
                              className="mr-1"
                            />
                            Obecnie
                          </label>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="ml-2 p-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                      title="Usuń wykształcenie"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={addEducation}
                className="text-red-600 font-medium flex items-center hover:text-red-700"
              >
                <span className="text-xl mr-2">+</span>
                Dodaj wykształcenie
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - CV Preview */}
        <div className="lg:w-1/2 bg-gray-100 overflow-hidden rounded-lg flex flex-col">
          {/* Preview Controls */}
          <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Podgląd CV</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Pomniejsz"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-sm text-gray-600 min-w-12 text-center">
                {Math.round(cvScale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-100 rounded transition-colors"
                title="Powiększ"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={resetView}
                className="p-2 hover:bg-gray-100 rounded transition-colors text-sm"
                title="Resetuj widok"
              >
                Reset
              </button>
              <div className="flex items-center text-sm text-gray-500">
                <Move size={16} className="mr-1" />
                Przeciągnij
              </div>
            </div>
          </div>

          {/* CV Preview Container */}
          <div 
            className="flex-1 overflow-hidden bg-gray-100/20 relative"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className={`absolute inset-0 flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{
                transform: `translate(${cvPosition.x}px, ${cvPosition.y}px)`
              }}
              onMouseDown={handleMouseDown}
            >
              {/* A4 Paper with exact dimensions */}
              <div
                className="bg-white shadow-md rounded-sm"
                style={{
                  width: `${210 * cvScale}mm`,
                  height: `${297 * cvScale}mm`,
                  transform: `scale(${cvScale})`,
                  transformOrigin: 'center center',
                  fontSize: `${cvScale * 16}px`
                }}
              >
                <div className="h-full p-8 overflow-hidden">
                  {/* Header Section */}
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
                      {personalInfo.firstName || personalInfo.lastName 
                        ? `${personalInfo.firstName} ${personalInfo.lastName}`.trim()
                        : 'Twoje Imię i Nazwisko'
                      }
                    </h1>
                    {personalInfo.profession && (
                      <h2 className="text-xl text-gray-600 mb-4">{personalInfo.profession}</h2>
                    )}
                    
                    {/* Contact Information */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {personalInfo.email && (
                        <div className="flex items-center">
                          <Mail size={14} className="mr-2 flex-shrink-0" />
                          <span className="break-all">{personalInfo.email}</span>
                        </div>
                      )}
                      {personalInfo.phone && (
                        <div className="flex items-center">
                          <Phone size={14} className="mr-2 flex-shrink-0" />
                          {personalInfo.phone}
                        </div>
                      )}
                      {personalInfo.address && (
                        <div className="flex items-center">
                          <MapPin size={14} className="mr-2 flex-shrink-0" />
                          {personalInfo.address}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal Profile */}
                  {personalInfo.summary && (
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b border-gray-300 pb-1">
                        Profil Osobisty
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed">{personalInfo.summary}</p>
                    </div>
                  )}

                  {/* Experience Section */}
                  {experiences.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b border-gray-300 pb-1 flex items-center">
                        <Briefcase size={16} className="mr-2" />
                        Doświadczenie Zawodowe
                      </h3>
                      {experiences.map((exp) => (
                        <div key={exp.id} className="mb-3">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{exp.position || 'Stanowisko'}</h4>
                              <p className="text-gray-700 font-medium truncate">{exp.company || 'Nazwa firmy'}</p>
                            </div>
                            <div className="text-xs text-gray-600 ml-2 flex-shrink-0">
                              {formatDate(exp.startDate)} - {exp.isCurrent || !exp.endDate ? 'obecnie' : formatDate(exp.endDate)}
                            </div>
                          </div>
                          {exp.description && (
                            <p className="text-xs text-gray-700 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills Section */}
                  {skills.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b border-gray-300 pb-1 flex items-center">
                        <Award size={16} className="mr-2" />
                        Umiejętności
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <span 
                            key={skill.id} 
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {skill.name || 'Umiejętność'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education Section */}
                  {education.length > 0 && (
                    <div className="mb-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 border-b border-gray-300 pb-1 flex items-center">
                        <GraduationCap size={16} className="mr-2" />
                        Edukacja
                      </h3>
                      {education.map((edu) => (
                        <div key={edu.id} className="mb-3">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{edu.degree || 'Kierunek/Stopień'}</h4>
                              <p className="text-gray-700 truncate">{edu.school || 'Nazwa uczelni/szkoły'}</p>
                            </div>
                            <div className="text-xs text-gray-600 ml-2 flex-shrink-0">
                              {formatDate(edu.startDate)} - {edu.isCurrent || !edu.endDate ? 'obecnie' : formatDate(edu.endDate)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty state message */}
                  {!personalInfo.firstName && !personalInfo.lastName && !personalInfo.email && 
                   experiences.length === 0 && skills.length === 0 && education.length === 0 && (
                    <div className="text-center text-gray-500 mt-20">
                      <p className="text-lg">Rozpocznij wypełnianie formularza, aby zobaczyć podgląd CV</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVCreator;