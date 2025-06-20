import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  Home,
  Trash2,
  ZoomIn,
  ZoomOut,
  Move,
  Tag,
  GripVertical,
} from 'lucide-react';

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

interface Hobby {
  id: string;
  name: string;
}

interface Language {
  id: string;
  name: string;
  level: string;
}

const CVCreator: React.FC = () => {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    profession: '',
    summary: '',
  });

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [showFullDates, setShowFullDates] = useState(true);
  const [languages, setLanguages] = useState<Language[]>([]);

  // CV Preview controls
  const [cvScale, setCvScale] = useState(0.8);
  const [cvPosition, setCvPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  

  // Section ordering
  const [sectionOrder, setSectionOrder] = useState([
    'profile',
    'experience',
    'education',
    'skills',
    'languages',
    'hobbies',
  ]);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  const addLanguage = () => {
    const newLanguage: Language = {
      id: Date.now().toString(),
      name: '',
      level: 'Beginner',
    };
    setLanguages([...languages, newLanguage]);
  };

  const updateLanguage = (id: string, field: keyof Language, value: string) => {
    setLanguages(languages.map((lang) => (lang.id === id ? { ...lang, [field]: value } : lang)));
  };

  const removeLanguage = (id: string) => {
    setLanguages(languages.filter((lang) => lang.id !== id));
  };

  // Section drag & drop handlers
  const handleSectionDragStart = (e: React.DragEvent, sectionId: string) => {
    setDraggedSection(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSection(sectionId);
  };

  const handleSectionDragLeave = () => {
    setDragOverSection(null);
  };

  const handleSectionDrop = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();

    if (!draggedSection || draggedSection === targetSectionId) {
      setDraggedSection(null);
      setDragOverSection(null);
      return;
    }

    const currentOrder = [...sectionOrder];
    const draggedIndex = currentOrder.indexOf(draggedSection);
    const targetIndex = currentOrder.indexOf(targetSectionId);

    // Remove dragged item and insert at new position
    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedSection);

    setSectionOrder(currentOrder);
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const handleSectionDragEnd = () => {
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
      isCurrent: false,
    };
    setExperiences([...experiences, newExp]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    setExperiences(experiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)));
  };

  const removeExperience = (id: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== id));
  };

  const addEducation = () => {
    const newEdu: Education = {
      id: Date.now().toString(),
      school: '',
      degree: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
    };
    setEducation([...education, newEdu]);
  };

  const updateEducation = (id: string, field: keyof Education, value: string | boolean) => {
    setEducation(education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu)));
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter((edu) => edu.id !== id));
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: '',
    };
    setSkills([...skills, newSkill]);
  };

  const updateSkill = (id: string, field: keyof Skill, value: string) => {
    setSkills(skills.map((skill) => (skill.id === id ? { ...skill, [field]: value } : skill)));
  };

  const removeSkill = (id: string) => {
    setSkills(skills.filter((skill) => skill.id !== id));
  };

  const addHobby = () => {
    const newHobby: Hobby = { id: Date.now().toString(), name: '' };
    setHobbies([...hobbies, newHobby]);
  };

  const updateHobby = (id: string, field: keyof Hobby, value: string) => {
    setHobbies(hobbies.map((hobby) => (hobby.id === id ? { ...hobby, [field]: value } : hobby)));
  };

  const removeHobby = (id: string) => {
    setHobbies(hobbies.filter((hobby) => hobby.id !== id));
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
    setCvScale((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setCvScale((prev) => Math.max(prev - 0.1, 0.3));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cvPosition.x,
      y: e.clientY - cvPosition.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setCvPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
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

  const renderSectionInForm = (sectionId: string) => {
  switch (sectionId) {
    case 'profile':
      return (
        <div
          key="profile"
          className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
            dragOverSection === 'profile' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
          } ${draggedSection === 'profile' ? 'opacity-50' : ''}`}
          draggable
          onDragStart={(e) => handleSectionDragStart(e, 'profile')}
          onDragOver={(e) => handleSectionDragOver(e, 'profile')}
          onDragLeave={handleSectionDragLeave}
          onDrop={(e) => handleSectionDrop(e, 'profile')}
          onDragEnd={handleSectionDragEnd}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center text-lg font-semibold text-gray-700">
              <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
              <User className="mr-2" size={20} />
              Dane osobowe
            </h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Krótka informacja na górze CV, która podsumowuje odpowiednie doświadczenie i
            kwalifikacje w 4-6 zdaniach.
          </p>
          <textarea
            placeholder="Kierownik projektu z ponad 5-letnim doświadczeniem poszukujący nowych możliwości."
            value={personalInfo.summary}
            onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })}
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      );

    case 'experience':
      return (
        <div
          key="experience"
          className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
            dragOverSection === 'experience' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
          } ${draggedSection === 'experience' ? 'opacity-50' : ''}`}
          draggable
          onDragStart={(e) => handleSectionDragStart(e, 'experience')}
          onDragOver={(e) => handleSectionDragOver(e, 'experience')}
          onDragLeave={handleSectionDragLeave}
          onDrop={(e) => handleSectionDrop(e, 'experience')}
          onDragEnd={handleSectionDragEnd}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center text-lg font-semibold text-gray-700">
              <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
              <Briefcase className="mr-2" size={20} />
              Doświadczenie zawodowe
            </h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Pochwal się swoimi osiągnięciami, opisując swoje codzienne obowiązki w 3-6 zdaniach,
            a następnie podaj co najmniej dwa kluczowe osiągnięcia.
          </p>
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="group mb-4 rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Firma"
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Stanowisko"
                      value={exp.position}
                      onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="date"
                      placeholder="Data rozpoczęcia"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        placeholder="Data zakończenia"
                        value={exp.endDate}
                        onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                        className="flex-1 rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => removeExperience(exp.id)}
                  className="ml-2 rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
                  title="Usuń doświadczenie"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addExperience}
            className="flex cursor-pointer items-center font-medium text-red-600 hover:text-red-700"
          >
            <span className="mr-2 text-xl">+</span>
            Dodaj doświadczenie zawodowe
          </button>
        </div>
      );

    case 'education':
      return (
        <div
          key="education"
          className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
            dragOverSection === 'education' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
          } ${draggedSection === 'education' ? 'opacity-50' : ''}`}
          draggable
          onDragStart={(e) => handleSectionDragStart(e, 'education')}
          onDragOver={(e) => handleSectionDragOver(e, 'education')}
          onDragLeave={handleSectionDragLeave}
          onDrop={(e) => handleSectionDrop(e, 'education')}
          onDragEnd={handleSectionDragEnd}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center text-lg font-semibold text-gray-700">
              <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
              <GraduationCap className="mr-2" size={20} />
              Edukacja
            </h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Dodaj swoje wykształcenie, niezależnie od tego, czy jest średnie, czy wyższe. W
            razie potrzeby dodaj odpowiednie kursy, projekty lub osiągnięcia (np. wyniki).
          </p>
          {education.map((edu) => (
            <div
              key={edu.id}
              className="group mb-4 rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Uczelnia/Szkoła"
                      value={edu.school}
                      onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Kierunek/Stopień"
                      value={edu.degree}
                      onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <input
                      type="date"
                      value={edu.startDate}
                      onChange={(e) => updateEducation(edu.id, 'startDate', e.target.value)}
                      className="rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={edu.endDate}
                        onChange={(e) => updateEducation(edu.id, 'endDate', e.target.value)}
                        className="flex-1 rounded border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="ml-2 rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
                  title="Usuń wykształcenie"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addEducation}
            className="flex cursor-pointer items-center font-medium text-red-600 hover:text-red-700"
          >
            <span className="mr-2 text-xl">+</span>
            Dodaj wykształcenie
          </button>
        </div>
      );

    case 'skills':
      return (
        <div
          key="skills"
          className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
            dragOverSection === 'skills' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
          } ${draggedSection === 'skills' ? 'opacity-50' : ''}`}
          draggable
          onDragStart={(e) => handleSectionDragStart(e, 'skills')}
          onDragOver={(e) => handleSectionDragOver(e, 'skills')}
          onDragLeave={handleSectionDragLeave}
          onDrop={(e) => handleSectionDrop(e, 'skills')}
          onDragEnd={handleSectionDragEnd}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center text-lg font-semibold text-gray-700">
              <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
              <Award className="mr-2" size={20} />
              Umiejętności
            </h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Opisz swoje obszary specjalizacji, koncentrując się na odpowiednich umiejętnościach
            twardych.
          </p>
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="group mb-3 rounded-md border border-gray-200 bg-white p-3"
            >
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  placeholder="Nazwa umiejętności"
                  value={skill.name}
                  onChange={(e) => updateSkill(skill.id, 'name', e.target.value)}
                  className="flex-1 focus:outline-none"
                />
                <button
                  onClick={() => removeSkill(skill.id)}
                  className="ml-2 rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
                  title="Usuń umiejętność"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addSkill}
            className="flex cursor-pointer items-center font-medium text-red-600 hover:text-red-700"
          >
            <span className="mr-2 text-xl">+</span>
            Dodaj umiejętności
          </button>
        </div>
      );

    case 'languages':
      return (
        <div
          key="languages"
          className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
            dragOverSection === 'languages' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
          } ${draggedSection === 'languages' ? 'opacity-50' : ''}`}
          draggable
          onDragStart={(e) => handleSectionDragStart(e, 'languages')}
          onDragOver={(e) => handleSectionDragOver(e, 'languages')}
          onDragLeave={handleSectionDragLeave}
          onDrop={(e) => handleSectionDrop(e, 'languages')}
          onDragEnd={handleSectionDragEnd}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center text-lg font-semibold text-gray-700">
              <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
              <Languages className="mr-2" size={20} />
              Języki
            </h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Dodaj języki które znasz wraz z poziomem ich znajomości.
          </p>
          {languages.map((language) => (
            <div
              key={language.id}
              className="group mb-3 rounded-lg border border-gray-200 bg-white/60 p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-1 gap-3">
                  <input
                    type="text"
                    placeholder="Nazwa języka"
                    value={language.name}
                    onChange={(e) => updateLanguage(language.id, 'name', e.target.value)}
                    className="flex-1 focus:outline-none"
                  />
                  <select
                    value={language.level}
                    onChange={(e) => updateLanguage(language.id, 'level', e.target.value)}
                    className="rounded-sm focus:outline-none border px-3 py-2"
                  >
                    <option value="Ogólny">Ogólny</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Conversational">Conversational</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Proficient">Proficient</option>
                    <option value="Native speaker">Native speaker</option>
                  </select>
                </div>
                <button
                  onClick={() => removeLanguage(language.id)}
                  className="ml-2 rounded p-2 text-red-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
                  title="Usuń język"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addLanguage}
            className="flex cursor-pointer items-center font-medium text-red-600 hover:text-red-700"
          >
            <span className="mr-2 text-xl">+</span>
            Dodaj język
          </button>
        </div>
      );

    case 'hobbies':
      return (
        <div
          key="hobbies"
          className={`mb-6 rounded-lg bg-gray-50 p-4 transition-all lg:p-6 ${
            dragOverSection === 'hobbies' ? 'bg-blue-50 ring-2 ring-blue-400' : ''
          } ${draggedSection === 'hobbies' ? 'opacity-50' : ''}`}
          draggable
          onDragStart={(e) => handleSectionDragStart(e, 'hobbies')}
          onDragOver={(e) => handleSectionDragOver(e, 'hobbies')}
          onDragLeave={handleSectionDragLeave}
          onDrop={(e) => handleSectionDrop(e, 'hobbies')}
          onDragEnd={handleSectionDragEnd}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center text-lg font-semibold text-gray-700">
              <GripVertical className="mr-2 cursor-grab text-gray-400" size={20} />
              <Tag className="mr-2" size={20} />
              Hobby
            </h2>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            Dodaj swoje zainteresowania i zajęcia pozazawodowe, które odzwierciedlają Twoją
            osobowość.
          </p>
          {hobbies.map((hobby) => (
            <div
              key={hobby.id}
              className="group mb-3 flex items-center rounded-lg border border-gray-200 bg-white p-3"
            >
              <input
                type="text"
                placeholder="Nazwa hobby"
                value={hobby.name}
                onChange={(e) => updateHobby(hobby.id, 'name', e.target.value)}
                className="flex-1 focus:outline-none"
              />
              <button
                onClick={() => removeHobby(hobby.id)}
                className="ml-2 rounded p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={addHobby}
            className="flex items-center font-medium text-red-600 hover:text-red-700"
          >
            <span className="mr-2 text-xl">+</span>
            Dodaj hobby
          </button>
        </div>
      );

    default:
      return null;
  }
};

  const renderSectionInPreview = (sectionId: string) => {
    switch (sectionId) {
      case 'profile':
return (personalInfo.firstName || personalInfo.lastName || personalInfo.email || personalInfo.phone || personalInfo.address || personalInfo.profession || personalInfo.summary) ? (
          <div className="mb-5" key="profile">
            <h3 className="mb-2 border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              Profil Osobisty
            </h3>
            <p className="text-sm leading-relaxed text-gray-700">{personalInfo.summary}</p>
          </div>
        ) : null;

      case 'experience':
        return experiences.length > 0 ? (
          <div className="mb-5" key="experience">
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <Briefcase size={16} className="mr-2" />
              Doświadczenie Zawodowe
            </h3>
            {experiences.map((exp) => (
              <div key={exp.id} className="mb-3">
                <div className="mb-1 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-gray-900">
                      {exp.position || 'Stanowisko'}
                    </h4>
                    <p className="truncate font-medium text-gray-700">
                      {exp.company || 'Nazwa firmy'}
                    </p>
                  </div>
                  <div className="ml-2 flex-shrink-0 text-xs text-gray-600">
                    {formatDate(exp.startDate)} -{' '}
                    {exp.isCurrent || !exp.endDate ? 'obecnie' : formatDate(exp.endDate)}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-xs leading-relaxed text-gray-700">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : null;

      case 'education':
        return education.length > 0 ? (
          <div className="mb-5" key="education">
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <GraduationCap size={16} className="mr-2" />
              Edukacja
            </h3>
            {education.map((edu) => (
              <div key={edu.id} className="mb-3">
                <div className="mb-1 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-gray-900">
                      {edu.degree || 'Kierunek/Stopień'}
                    </h4>
                    <p className="truncate text-gray-700">{edu.school || 'Nazwa uczelni/szkoły'}</p>
                  </div>
                  <div className="ml-2 flex-shrink-0 text-xs text-gray-600">
                    {formatDate(edu.startDate)} -{' '}
                    {edu.isCurrent || !edu.endDate ? 'obecnie' : formatDate(edu.endDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null;

      case 'skills':
        return skills.length > 0 ? (
          <div className="mb-5" key="skills">
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <Award size={16} className="mr-2" />
              Umiejętności
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                >
                  {skill.name || 'Umiejętność'}
                </span>
              ))}
            </div>
          </div>
        ) : null;

      case 'languages':
        return languages.length > 0 ? (
          <div className="mb-5" key="languages">
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <Languages size={16} className="mr-2" />
              Języki
            </h3>
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <span
                  key={language.id}
                  className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800"
                >
                  {language.name || 'Język'} - {language.level}
                </span>
              ))}
            </div>
          </div>
        ) : null;

      case 'hobbies':
        return hobbies.length > 0 ? (
          <div className="mb-5" key="hobbies">
            <h3 className="mb-2 flex items-center border-b border-gray-300 pb-1 text-lg font-semibold text-gray-800">
              <Tag size={16} className="mr-2" />
              Hobby
            </h3>
            <div className="flex flex-wrap gap-2">
              {hobbies.map((hobby) => (
                <span
                  key={hobby.id}
                  className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                >
                  {hobby.name || 'Hobby'}
                </span>
              ))}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="font-poppins flex h-screen flex-col overflow-hidden bg-gray-50 lg:flex-row lg:pt-6">
      {/* Top Navigation for Mobile */}
      <div className="mb-4 flex items-center justify-center bg-white py-4 shadow-lg lg:hidden">
        <button
          onClick={() => (window.location.href = '/')}
          className="rounded-lg p-3 transition-colors hover:bg-gray-100"
          title="Strona główna"
        >
          <Home size={24} className="text-gray-600" />
        </button>
      </div>

      {/* Sidebar for Desktop */}
      <div className="mx-3 hidden w-16 flex-col items-center rounded-lg bg-white py-6 shadow-lg lg:flex">
        <button
          onClick={() => (window.location.href = '/')}
          className="rounded-lg p-3 transition-colors hover:bg-gray-100"
          title="Strona główna"
        >
          <Home size={24} className="text-gray-600" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden px-3 lg:flex-row lg:px-0">
        {/* Left Panel - Form Inputs */}
        <div className="h-full overflow-y-auto rounded-lg bg-white shadow-lg lg:w-1/2">
          <div className="max-h-full overflow-y-auto p-4 lg:p-6">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h1 className="text-xl font-bold text-gray-800 lg:text-2xl">Kreator CV</h1>
              <div className="flex items-center space-x-3">
                <label className="text-sm text-gray-600">Format dat:</label>
                <select
                  value={showFullDates ? 'full' : 'year'}
                  onChange={(e) => setShowFullDates(e.target.value === 'full')}
                  className="rounded border border-gray-300 px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="full">Miesiąc i rok</option>
                  <option value="year">Tylko rok</option>
                </select>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4 lg:p-6">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-700">
                <User className="mr-2" size={20} />
                Dane osobowe
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Imię</label>
                    <input
                      type="text"
                      placeholder="Imię"
                      value={personalInfo.firstName}
                      onChange={(e) =>
                        setPersonalInfo({ ...personalInfo, firstName: e.target.value })
                      }
                      className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-gray-600">Nazwisko</label>
                    <input
                      type="text"
                      placeholder="Nazwisko"
                      value={personalInfo.lastName}
                      onChange={(e) =>
                        setPersonalInfo({ ...personalInfo, lastName: e.target.value })
                      }
                      className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-600">Adres e-mail</label>
                  <input
                    type="email"
                    placeholder="Email"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-600">Pozycja</label>
                  <input
                    type="text"
                    placeholder="np. Projektant serwisu"
                    value={personalInfo.profession}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, profession: e.target.value })
                    }
                    className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Collapsible Additional Fields */}
                <details className="group">
                  <summary className="cursor-pointer font-medium text-red-600">
                    Pokaż dodatkowe pola
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm text-gray-600">Numer telefonu</label>
                        <input
                          type="tel"
                          placeholder="np. +48 22 263 98 31"
                          value={personalInfo.phone}
                          onChange={(e) =>
                            setPersonalInfo({ ...personalInfo, phone: e.target.value })
                          }
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-gray-600">Adres</label>
                        <input
                          type="text"
                          placeholder="np. ul. Partyzantów 16"
                          value={personalInfo.address}
                          onChange={(e) =>
                            setPersonalInfo({ ...personalInfo, address: e.target.value })
                          }
                          className="w-full rounded-sm border border-gray-300 px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {sectionOrder.map((sectionId) => renderSectionInForm(sectionId))}

          </div>
        </div>

        {/* Right Panel - CV Preview */}
        <div className="flex flex-col overflow-hidden rounded-lg bg-gray-100 lg:w-1/2">
          {/* Preview Controls */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-gray-700">Podgląd CV</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleZoomOut}
                className="rounded p-2 transition-colors hover:bg-gray-100"
                title="Pomniejsz"
              >
                <ZoomOut size={18} />
              </button>
              <span className="min-w-12 text-center text-sm text-gray-600">
                {Math.round(cvScale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="rounded p-2 transition-colors hover:bg-gray-100"
                title="Powiększ"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={resetView}
                className="rounded p-2 text-sm transition-colors hover:bg-gray-100"
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
            className="relative flex-1 overflow-hidden bg-gray-100/20"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className={`absolute inset-0 flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{
                transform: `translate(${cvPosition.x}px, ${cvPosition.y}px)`,
              }}
              onMouseDown={handleMouseDown}
            >
              {/* A4 Paper with exact dimensions */}
              <div
                className="rounded-sm bg-white shadow-md"
                style={{
                  width: `${210 * cvScale}mm`,
                  height: `${297 * cvScale}mm`,
                  transform: `scale(${cvScale})`,
                  transformOrigin: 'center center',
                  fontSize: `${cvScale * 16}px`,
                }}
              >
                <div className="h-full overflow-hidden p-8">
                  {/* Header Section */}
                  <div className="mb-6">
                    <h1 className="mb-2 text-3xl leading-tight font-bold text-gray-900">
                      {personalInfo.firstName || personalInfo.lastName
                        ? `${personalInfo.firstName} ${personalInfo.lastName}`.trim()
                        : 'Twoje Imię i Nazwisko'}
                    </h1>
                    {personalInfo.profession && (
                      <h2 className="mb-4 text-xl text-gray-600">{personalInfo.profession}</h2>
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

                  {sectionOrder.map((sectionId) => renderSectionInPreview(sectionId))}


                  {/* Empty state message */}
                  {!personalInfo.firstName &&
                    !personalInfo.lastName &&
                    !personalInfo.email &&
                    experiences.length === 0 &&
                    skills.length === 0 &&
                    education.length === 0 && (
                      <div className="mt-20 text-center text-gray-500">
                        <p className="text-lg">
                          Rozpocznij wypełnianie formularza, aby zobaczyć podgląd CV
                        </p>
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
