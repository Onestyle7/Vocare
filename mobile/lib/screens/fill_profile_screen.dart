import 'package:flutter/material.dart';
import 'package:country_code_picker/country_code_picker.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/custom_input.dart';
import 'package:vocare/widgets/custom_date_input.dart';
import 'package:vocare/services/profile_api.dart';
import 'package:vocare/screens/aI_asistent_screen.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';
import 'package:vocare/models/personality_type.dart';
import 'profile_modals.dart'; // 🆕 IMPORT MODALI

enum RiskAppetite {
  low('Low'),
  medium('Medium'),
  high('High');

  final String label;
  const RiskAppetite(this.label);
}

class _Education {
  final TextEditingController institutionController = TextEditingController();
  final TextEditingController degreeController = TextEditingController();
  final TextEditingController fieldController = TextEditingController();
  final TextEditingController startDateController = TextEditingController();
  final TextEditingController endDateController = TextEditingController();
  bool isCurrentlyStudying = false;

  void dispose() {
    institutionController.dispose();
    degreeController.dispose();
    fieldController.dispose();
    startDateController.dispose();
    endDateController.dispose();
  }
}

class _WorkExperience {
  final TextEditingController positionController = TextEditingController();
  final TextEditingController companyController = TextEditingController();
  final TextEditingController descriptionController = TextEditingController();
  final TextEditingController responsibilitiesController =
      TextEditingController();
  final TextEditingController startDateController = TextEditingController();
  final TextEditingController endDateController = TextEditingController();
  bool isCurrentlyWorking = false;

  void dispose() {
    positionController.dispose();
    companyController.dispose();
    descriptionController.dispose();
    responsibilitiesController.dispose();
    startDateController.dispose();
    endDateController.dispose();
  }
}

class _Certificate {
  final TextEditingController nameController = TextEditingController();
  final TextEditingController dateController = TextEditingController();
  final TextEditingController issuerController = TextEditingController();

  void dispose() {
    nameController.dispose();
    dateController.dispose();
    issuerController.dispose();
  }
}

class _Language {
  final TextEditingController languageController = TextEditingController();
  final TextEditingController levelController = TextEditingController();

  void dispose() {
    languageController.dispose();
    levelController.dispose();
  }
}

class FillProfileScreen extends StatefulWidget {
  const FillProfileScreen({super.key});

  @override
  State<FillProfileScreen> createState() => _FillProfileScreenState();
}

class _FillProfileScreenState extends State<FillProfileScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  bool _isLoading = false;

  // Controllers
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _aboutMeController = TextEditingController();
  final _additionalInfoController = TextEditingController();
  final _currentSalaryController = TextEditingController();
  final _desiredSalaryController = TextEditingController();
  final _loanDetailsController = TextEditingController();

  // Lists
  List<_Education> _educationList = [_Education()];
  List<_WorkExperience> _workExperienceList = [_WorkExperience()];
  List<_Certificate> _certificatesList = [_Certificate()];
  List<_Language> _languagesList = [_Language()];
  List<String> _skills = [];
  List<String> _softSkills = [];

  // 🆕 NOWE LISTY dla danych z modali
  List<Map<String, String>> _addedLanguages = [];
  List<Map<String, dynamic>> _addedWorkExperience = [];
  List<Map<String, dynamic>> _addedEducation = [];
  List<Map<String, dynamic>> _addedCertificates = [];

  // 🔧 DODANE dla przycisków +
  String _currentSkillInput = '';
  String _currentSoftSkillInput = '';

  // Selections
  String selectedCountry = '';
  PersonalityType? _selectedPersonalityType;
  RiskAppetite? _selectedRiskAppetite;
  bool _willingToRebrand = false;
  bool _hasLoans = false;
  bool _willingToRelocate = false;

  final List<String> _stepTitles = [
    'Basic Info',
    'Contact',
    'Experience',
    'Additional',
    'Financial',
  ];

  @override
  void initState() {
    super.initState();
    // 🔧 OPÓŹNIJ ŁADOWANIE PROFILU o frame żeby UI się zainicjalizowało
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadUserProfile();
    });
  }

  Future<void> _loadUserProfile() async {
    final data = await ProfileApi.getUserProfile();
    if (data == null) return;

    setState(() {
      // Personal info
      _firstNameController.text = data['firstName'] ?? '';
      _lastNameController.text = data['lastName'] ?? '';

      // 🔧 NAPRAW COUNTRY - mapuj backend value na frontend value
      final backendCountry = data['country'] ?? '';
      selectedCountry = _mapBackendCountryToFrontend(backendCountry);

      _addressController.text = data['address'] ?? '';
      _phoneController.text = data['phoneNumber'] ?? '';
      _aboutMeController.text = data['aboutMe'] ?? '';
      _additionalInfoController.text = data['additionalInformation'] ?? '';
      _willingToRebrand = data['willingToRebrand'] ?? false;

      // 🔧 NAPRAW PERSONALITY - sprawdź czy value istnieje
      final personality =
          (data['personalityType'] ?? '').toString().toLowerCase();
      _selectedPersonalityType = PersonalityType.values.firstWhere(
        (e) => e.name.toLowerCase() == personality,
        orElse: () => PersonalityType.unknown,
      );

      _skills = List<String>.from(data['skills'] ?? []);
      _softSkills = List<String>.from(data['softSkills'] ?? []);

      // Financial Survey
      final financial = data['financialSurvey'] as Map<String, dynamic>?;
      if (financial != null) {
        _currentSalaryController.text =
            financial['currentSalary']?.toString() ?? '';
        _desiredSalaryController.text =
            financial['desiredSalary']?.toString() ?? '';
        _hasLoans = financial['hasLoans'] ?? false;
        _loanDetailsController.text = financial['loanDetails'] ?? '';
        _willingToRelocate = financial['willingToRelocate'] ?? false;

        final risk = financial['riskAppetite']?.toString().toLowerCase();
        _selectedRiskAppetite = RiskAppetite.values.firstWhere(
          (e) => e.name.toLowerCase() == risk,
          orElse: () => RiskAppetite.low,
        );
      }
    });
  }

  // 🔧 HELPER do mapowania krajów z backend na frontend
  String _mapBackendCountryToFrontend(String backendCountry) {
    final mapping = {
      'polska': 'Poland',
      'poland': 'Poland',
      'niemcy': 'Germany',
      'germany': 'Germany',
      'uk': 'United Kingdom',
      'united kingdom': 'United Kingdom',
      'usa': 'United States',
      'united states': 'United States',
      'francja': 'France',
      'france': 'France',
      'włochy': 'Italy',
      'italy': 'Italy',
      'hiszpania': 'Spain',
      'spain': 'Spain',
      'holandia': 'Netherlands',
      'netherlands': 'Netherlands',
    };

    return mapping[backendCountry.toLowerCase()] ?? backendCountry;
  }

  void _nextPage() {
    if (_currentPage < 4) {
      setState(() => _currentPage++);
      _pageController.animateToPage(
        _currentPage,
        duration: const Duration(milliseconds: 300),
        curve: Curves.ease,
      );
    }
  }

  void _prevPage() {
    if (_currentPage > 0) {
      setState(() => _currentPage--);
      _pageController.animateToPage(
        _currentPage,
        duration: const Duration(milliseconds: 300),
        curve: Curves.ease,
      );
    }
  }

  Future<void> _saveProfile() async {
    setState(() => _isLoading = true);

    // 🔧 WALIDACJA PRZED ZAPISEM
    if (_firstNameController.text.trim().isEmpty) {
      _showError('Please enter your first name');
      setState(() => _isLoading = false);
      return;
    }

    if (_lastNameController.text.trim().isEmpty) {
      _showError('Please enter your last name');
      setState(() => _isLoading = false);
      return;
    }

    if (selectedCountry.trim().isEmpty) {
      _showError('Please select your country');
      setState(() => _isLoading = false);
      return;
    }

    final profileData = {
      "firstName": _firstNameController.text.trim(),
      "lastName": _lastNameController.text.trim(),
      "country": selectedCountry.trim(), // 🔧 Używaj frontend value
      "address": _addressController.text.trim(),
      "phoneNumber": _phoneController.text.trim(),
      "personalityType": _selectedPersonalityType?.name ?? "unknown",
      "aboutMe": _aboutMeController.text.trim(),
      "additionalInformation": _additionalInfoController.text.trim(),
      "willingToRebrand": _willingToRebrand,
      "skills": _skills,
      "softSkills": _softSkills,

      // Edukacja - z modali albo starych kontrolerów
      "education": [
        ..._addedEducation,
        ..._educationList
            .where((edu) => edu.institutionController.text.trim().isNotEmpty)
            .map(
              (edu) => {
                "institution": edu.institutionController.text.trim(),
                "degree": edu.degreeController.text.trim(),
                "field": edu.fieldController.text.trim(),
                "startDate": edu.startDateController.text.trim(),
                "endDate":
                    edu.isCurrentlyStudying
                        ? ""
                        : edu.endDateController.text.trim(),
                "isCurrentlyStudying": edu.isCurrentlyStudying,
              },
            ),
      ],

      // Doświadczenie zawodowe - z modali albo starych kontrolerów
      "workExperience": [
        ..._addedWorkExperience,
        ..._workExperienceList
            .where((exp) => exp.companyController.text.trim().isNotEmpty)
            .map(
              (exp) => {
                "company": exp.companyController.text.trim(),
                "position": exp.positionController.text.trim(),
                "description": exp.descriptionController.text.trim(),
                "responsibilities":
                    exp.responsibilitiesController.text
                        .split(',')
                        .map((e) => e.trim())
                        .where((e) => e.isNotEmpty)
                        .toList(),
                "startDate": exp.startDateController.text.trim(),
                "endDate":
                    exp.isCurrentlyWorking
                        ? ""
                        : exp.endDateController.text.trim(),
                "isCurrentlyWorking": exp.isCurrentlyWorking,
              },
            ),
      ],

      // Certyfikaty - z modali albo starych kontrolerów
      "certificates": [
        ..._addedCertificates,
        ..._certificatesList
            .where((cert) => cert.nameController.text.trim().isNotEmpty)
            .map(
              (cert) => {
                "name": cert.nameController.text.trim(),
                "date": cert.dateController.text.trim(),
                "issuer": cert.issuerController.text.trim(),
              },
            ),
      ],

      // Języki - z modali albo starych kontrolerów
      "languages": [
        ..._addedLanguages,
        ..._languagesList
            .where((lang) => lang.languageController.text.trim().isNotEmpty)
            .map(
              (lang) => {
                "language": lang.languageController.text.trim(),
                "level": lang.levelController.text.trim(),
              },
            ),
      ],
      "financialSurvey": {
        "currentSalary":
            int.tryParse(_currentSalaryController.text.trim()) ?? 0,
        "desiredSalary":
            int.tryParse(_desiredSalaryController.text.trim()) ?? 0,
        "hasLoans": _hasLoans,
        "loanDetails": _loanDetailsController.text.trim(),
        "riskAppetite": _selectedRiskAppetite?.name ?? "low",
        "willingToRelocate": _willingToRelocate,
      },
    };

    print('🔍 SAVING PROFILE DATA: $profileData'); // Debug

    final success = await ProfileApi.createUserProfile(profileData);
    setState(() => _isLoading = false);

    if (success) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const AIAsistentPageScreen()),
      );
    } else {
      _showError('Failed to save profile. Please try again.');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  // Funkcje obsługi modali
  void _showAddLanguageModal() {
    showDialog(
      context: context,
      builder:
          (context) => AddLanguageModal(
            onAdd: (language, level) {
              setState(() {
                _addedLanguages.add({'language': language, 'level': level});
              });
            },
          ),
    );
  }

  void _showAddWorkExperienceModal() {
    showDialog(
      context: context,
      builder:
          (context) => AddWorkExperienceModal(
            onAdd: (data) {
              setState(() {
                _addedWorkExperience.add(data);
              });
            },
          ),
    );
  }

  void _showAddEducationModal() {
    showDialog(
      context: context,
      builder:
          (context) => AddEducationModal(
            onAdd: (data) {
              setState(() {
                _addedEducation.add(data);
              });
            },
          ),
    );
  }

  void _showAddCertificateModal() {
    showDialog(
      context: context,
      builder:
          (context) => AddCertificateModal(
            onAdd: (data) {
              setState(() {
                _addedCertificates.add(data);
              });
            },
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F0F),
      body: SafeArea(
        child: Column(
          children: [
            // Progress Header
            _buildProgressHeader(),

            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildBasicInfoPage(),
                  _buildContactPage(),
                  _buildExperiencePage(),
                  _buildAdditionalPage(),
                  _buildFinancialPage(),
                ],
              ),
            ),

            // Bottom Navigation
            _buildBottomNavigation(),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          for (int i = 0; i < 5; i++) ...[
            // Step Circle
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color:
                    i <= _currentPage
                        ? const Color(0xFF915EFF)
                        : const Color(0xFF2A2A2A),
                border: Border.all(
                  color:
                      i <= _currentPage
                          ? const Color(0xFF915EFF)
                          : const Color(0xFF444444),
                  width: 2,
                ),
              ),
              child: Center(
                child:
                    i < _currentPage
                        ? const Icon(Icons.check, color: Colors.white, size: 20)
                        : Text(
                          '${i + 1}',
                          style: TextStyle(
                            color:
                                i <= _currentPage
                                    ? Colors.white
                                    : const Color(0xFF666666),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
              ),
            ),

            // Step Label
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _stepTitles[i],
                    style: TextStyle(
                      color:
                          i <= _currentPage
                              ? const Color(0xFF915EFF)
                              : const Color(0xFF666666),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),

            // Connector Line
            if (i < 4) ...[
              const SizedBox(width: 8),
              Container(
                height: 2,
                width: 20,
                color:
                    i < _currentPage
                        ? const Color(0xFF915EFF)
                        : const Color(0xFF2A2A2A),
              ),
              const SizedBox(width: 8),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildBasicInfoPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Basic Information',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 30),

          _buildWebInput(
            label: 'Name',
            controller: _firstNameController,
            placeholder: 'Enter your first name',
          ),

          _buildWebInput(
            label: 'Surname',
            controller: _lastNameController,
            placeholder: 'Enter your surname',
          ),

          _buildDropdownField(
            label: 'Personality type',
            value: _selectedPersonalityType?.label,
            items:
                PersonalityType.values
                    .where(
                      (type) => type != PersonalityType.unknown,
                    ) // 🔧 Usuń "Unknown" z listy
                    .map((e) => e.label)
                    .toSet() // 🔧 Usuń duplikaty
                    .toList(),
            onChanged: (value) {
              setState(() {
                _selectedPersonalityType = PersonalityType.values.firstWhere(
                  (e) => e.label == value,
                  orElse: () => PersonalityType.unknown,
                );
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildContactPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Contact Information',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 30),

          _buildDropdownField(
            label: 'Country',
            value: selectedCountry.isEmpty ? null : selectedCountry,
            items: const [
              'Poland',
              'Germany',
              'United Kingdom',
              'United States',
              'France',
              'Italy',
              'Spain',
              'Netherlands',
            ], // 🔧 Unikalne wartości krajów
            onChanged: (value) => setState(() => selectedCountry = value ?? ''),
          ),

          _buildWebInput(
            label: 'Address',
            controller: _addressController,
            placeholder: 'Enter your address',
          ),

          _buildPhoneInput(),
        ],
      ),
    );
  }

  Widget _buildExperiencePage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Experience and Skills',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 30),

          _buildSkillsSection(),
          const SizedBox(height: 30),
          _buildSoftSkillsSection(),
          const SizedBox(height: 30),
          _buildLanguagesSection(),
          const SizedBox(height: 30),
          _buildProfessionalExperienceSection(),
        ],
      ),
    );
  }

  Widget _buildAdditionalPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Additional',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 30),

          _buildEducationSection(),
          const SizedBox(height: 30),
          _buildCertificatesSection(),
          const SizedBox(height: 30),

          _buildWebTextArea(
            label: 'About me',
            controller: _aboutMeController,
            placeholder: 'Tell us about yourself...',
          ),

          _buildWebTextArea(
            label: 'Additional Information',
            controller: _additionalInfoController,
            placeholder: 'Any additional information...',
          ),
        ],
      ),
    );
  }

  Widget _buildFinancialPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Financial',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 30),

          _buildWebInput(
            label: 'Current salary',
            controller: _currentSalaryController,
            placeholder: 'Enter amount',
            keyboardType: TextInputType.number,
          ),

          _buildWebInput(
            label: 'Desired salary',
            controller: _desiredSalaryController,
            placeholder: 'Enter amount',
            keyboardType: TextInputType.number,
          ),

          _buildYesNoQuestion(
            'Do you have any loans?',
            _hasLoans,
            (value) => setState(() => _hasLoans = value),
          ),

          _buildYesNoQuestion(
            'Willing to relocate?',
            _willingToRelocate,
            (value) => setState(() => _willingToRelocate = value),
          ),

          _buildYesNoQuestion(
            'Willing to rebrand?',
            _willingToRebrand,
            (value) => setState(() => _willingToRebrand = value),
          ),

          _buildDropdownField(
            label: 'Risk appetite',
            value: _selectedRiskAppetite?.label,
            items:
                RiskAppetite.values
                    .map((e) => e.label)
                    .toSet() // 🔧 Usuń duplikaty
                    .toList(),
            onChanged: (value) {
              setState(() {
                _selectedRiskAppetite = RiskAppetite.values.firstWhere(
                  (e) => e.label == value,
                  orElse: () => RiskAppetite.low,
                );
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildWebInput({
    required String label,
    required TextEditingController controller,
    required String placeholder,
    TextInputType? keyboardType,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF333333)),
            ),
            child: TextField(
              controller: controller,
              keyboardType: keyboardType,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: placeholder,
                hintStyle: const TextStyle(color: Color(0xFF666666)),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWebTextArea({
    required String label,
    required TextEditingController controller,
    required String placeholder,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF333333)),
            ),
            child: TextField(
              controller: controller,
              maxLines: 4,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: placeholder,
                hintStyle: const TextStyle(color: Color(0xFF666666)),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String? value,
    required List<String> items,
    required Function(String?) onChanged,
  }) {
    // 🔧 NAPRAW DROPDOWN - upewnij się że value istnieje w items
    final String? safeValue = items.contains(value) ? value : null;

    // 🔍 DEBUG
    if (value != null && !items.contains(value)) {
      print(
        '⚠️ DROPDOWN WARNING: "$label" value "$value" not found in items: $items',
      );
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF333333)),
            ),
            child: DropdownButtonFormField<String>(
              value: safeValue, // 🔧 Używaj bezpiecznej wartości
              dropdownColor: const Color(0xFF1A1A1A),
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                border: InputBorder.none,
                contentPadding: EdgeInsets.all(16),
              ),
              hint: Text(
                'Select $label',
                style: const TextStyle(color: Color(0xFF666666)),
              ),
              items:
                  items
                      .where((item) => item.isNotEmpty) // 🔧 Usuń puste stringi
                      .toSet() // 🔧 Usuń duplikaty
                      .map(
                        (item) => DropdownMenuItem(
                          value: item,
                          child: Text(
                            item,
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                      )
                      .toList(),
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildYesNoQuestion(
    String question,
    bool value,
    Function(bool) onChanged,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            question,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: CustomButton(
                  text: 'Yes',
                  onPressed: () => onChanged(true),
                  backgroundColor:
                      value ? const Color(0xFF915EFF) : const Color(0xFF2A2A2A),
                  textColor: value ? Colors.white : const Color(0xFF666666),
                  borderRadius: 8,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: CustomButton(
                  text: 'No',
                  onPressed: () => onChanged(false),
                  backgroundColor:
                      !value
                          ? const Color(0xFF915EFF)
                          : const Color(0xFF2A2A2A),
                  textColor: !value ? Colors.white : const Color(0xFF666666),
                  borderRadius: 8,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPhoneInput() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Phone number',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF333333)),
            ),
            child: TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'Enter your phone number',
                hintStyle: TextStyle(color: Color(0xFF666666)),
                border: InputBorder.none,
                contentPadding: EdgeInsets.all(16),
                prefixIcon: Icon(Icons.phone, color: Color(0xFF666666)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSkillsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Skills',
          style: TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF333333)),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'Add a skill (e.g. JavaScript)',
                    hintStyle: TextStyle(color: Color(0xFF666666)),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(16),
                  ),
                  onSubmitted: (value) {
                    if (value.trim().isNotEmpty) {
                      setState(() {
                        _skills.add(value.trim());
                      });
                    }
                  },
                  onChanged: (value) {
                    // Store current input for the + button
                    _currentSkillInput = value;
                  },
                ),
              ),
              GestureDetector(
                // 🔧 DODANO GESTURE DETECTOR
                onTap: () {
                  if (_currentSkillInput.trim().isNotEmpty) {
                    setState(() {
                      _skills.add(_currentSkillInput.trim());
                      _currentSkillInput = '';
                    });
                    // Clear the text field
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      FocusScope.of(context).unfocus();
                    });
                  }
                },
                child: Container(
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF915EFF),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Padding(
                    padding: EdgeInsets.all(8),
                    child: Icon(Icons.add, color: Colors.white, size: 20),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children:
              _skills
                  .map(
                    (skill) => _buildSkillTag(skill, () {
                      setState(() => _skills.remove(skill));
                    }),
                  )
                  .toList(),
        ),
      ],
    );
  }

  Widget _buildSoftSkillsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Soft Skills',
          style: TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF333333)),
          ),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'Add a soft skill (e.g. Teamwork)',
                    hintStyle: TextStyle(color: Color(0xFF666666)),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(16),
                  ),
                  onSubmitted: (value) {
                    if (value.trim().isNotEmpty) {
                      setState(() {
                        _softSkills.add(value.trim());
                      });
                    }
                  },
                  onChanged: (value) {
                    _currentSoftSkillInput = value;
                  },
                ),
              ),
              GestureDetector(
                // 🔧 DODANO GESTURE DETECTOR
                onTap: () {
                  if (_currentSoftSkillInput.trim().isNotEmpty) {
                    setState(() {
                      _softSkills.add(_currentSoftSkillInput.trim());
                      _currentSoftSkillInput = '';
                    });
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      FocusScope.of(context).unfocus();
                    });
                  }
                },
                child: Container(
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF915EFF),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Padding(
                    padding: EdgeInsets.all(8),
                    child: Icon(Icons.add, color: Colors.white, size: 20),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children:
              _softSkills
                  .map(
                    (skill) => _buildSkillTag(skill, () {
                      setState(() => _softSkills.remove(skill));
                    }),
                  )
                  .toList(),
        ),
      ],
    );
  }

  Widget _buildSkillTag(String skill, VoidCallback onRemove) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF2A2A2A),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF444444)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 12, top: 6, bottom: 6),
            child: Text(
              skill,
              style: const TextStyle(color: Colors.white, fontSize: 12),
            ),
          ),
          GestureDetector(
            onTap: onRemove,
            child: const Padding(
              padding: EdgeInsets.all(6),
              child: Icon(Icons.close, color: Color(0xFF666666), size: 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLanguagesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Languages',
          style: TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 12),

        // Wyświetl dodane języki z modala
        ...(_addedLanguages.asMap().entries.map((entry) {
          final index = entry.key;
          final language = entry.value;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _buildLanguageTag(
              '${language['language']} (${language['level']})',
              true,
              onRemove: () {
                setState(() {
                  _addedLanguages.removeAt(index);
                });
              },
            ),
          );
        }).toList()),

        // Domyślne języki (jeśli są)
        if (_addedLanguages.isEmpty) ...[
          _buildLanguageTag('Polish (Native)', false),
          const SizedBox(height: 8),
          _buildLanguageTag('English (Advanced)', false),
        ],

        const SizedBox(height: 12),
        CustomButton(
          text: '+ Add language',
          onPressed: _showAddLanguageModal,
          backgroundColor: Colors.transparent,
          textColor: const Color(0xFF915EFF),
          borderRadius: 8,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ),
      ],
    );
  }

  Widget _buildLanguageTag(
    String language,
    bool removable, {
    VoidCallback? onRemove,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF2A2A2A),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF444444)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 12, top: 6, bottom: 6),
            child: Text(
              language,
              style: const TextStyle(color: Colors.white, fontSize: 12),
            ),
          ),
          if (removable && onRemove != null)
            GestureDetector(
              onTap: onRemove,
              child: const Padding(
                padding: EdgeInsets.all(6),
                child: Icon(Icons.close, color: Color(0xFF666666), size: 16),
              ),
            )
          else if (!removable)
            const SizedBox(width: 12),
        ],
      ),
    );
  }

  Widget _buildProfessionalExperienceSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Professional Experience',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),

        // Wyświetl dodane doświadczenia z modala
        ...(_addedWorkExperience.asMap().entries.map((entry) {
          final index = entry.key;
          final work = entry.value;
          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF333333)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        work['position'] ?? 'Position',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        work['company'] ?? 'Company',
                        style: const TextStyle(
                          color: Color(0xFF915EFF),
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${work['startDate'] ?? ''} - ${work['isCurrentlyWorking'] == true ? "Present" : work['endDate'] ?? ''}',
                        style: const TextStyle(
                          color: Color(0xFF666666),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap:
                      () => setState(() {
                        _addedWorkExperience.removeAt(index);
                      }),
                  child: const Icon(Icons.close, color: Color(0xFF666666)),
                ),
              ],
            ),
          );
        }).toList()),

        // Stare doświadczenia (z kontrolerów) - jeśli nie ma nowych
        if (_addedWorkExperience.isEmpty) ...[
          for (int i = 0; i < _workExperienceList.length; i++)
            _buildExperienceCard(_workExperienceList[i], i),
        ],

        CustomButton(
          text: '+ Add Work Experience',
          onPressed: _showAddWorkExperienceModal,
          backgroundColor: Colors.transparent,
          textColor: const Color(0xFF915EFF),
          borderRadius: 8,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ),
      ],
    );
  }

  Widget _buildExperienceCard(_WorkExperience exp, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1A),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF333333)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  exp.positionController.text.isEmpty
                      ? 'E-mail marketing specialist'
                      : exp.positionController.text,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              if (index > 0)
                GestureDetector(
                  onTap:
                      () => setState(() {
                        exp.dispose();
                        _workExperienceList.removeAt(index);
                      }),
                  child: const Icon(Icons.close, color: Color(0xFF666666)),
                ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            exp.companyController.text.isEmpty
                ? 'Webimpact'
                : exp.companyController.text,
            style: const TextStyle(color: Color(0xFF915EFF), fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            '${exp.startDateController.text.isEmpty ? "2022-09-30" : exp.startDateController.text} - ${exp.isCurrentlyWorking ? "Present" : exp.endDateController.text}',
            style: const TextStyle(color: Color(0xFF666666), fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildEducationSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Education',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),

        // Wyświetl dodane edukacje z modala
        ...(_addedEducation.asMap().entries.map((entry) {
          final index = entry.key;
          final education = entry.value;
          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF333333)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${education['degree']} in ${education['field']}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        education['institution'] ?? 'Institution',
                        style: const TextStyle(
                          color: Color(0xFF915EFF),
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${education['startDate'] ?? ''} - ${education['isCurrentlyStudying'] == true ? "Present" : education['endDate'] ?? ''}',
                        style: const TextStyle(
                          color: Color(0xFF666666),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap:
                      () => setState(() {
                        _addedEducation.removeAt(index);
                      }),
                  child: const Icon(Icons.close, color: Color(0xFF666666)),
                ),
              ],
            ),
          );
        }).toList()),

        // Przykładowa edukacja - jeśli nie ma nowych
        if (_addedEducation.isEmpty) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF333333)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Master in Engineer\'s Degree in Computer Science',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Wyższa Szkoła Ekonomii i Informatyki w Krakowie',
                        style: TextStyle(
                          color: Color(0xFF915EFF),
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        '2022-09-30 - Present',
                        style: TextStyle(
                          color: Color(0xFF666666),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.close, color: Color(0xFF666666)),
              ],
            ),
          ),
        ],

        const SizedBox(height: 12),
        CustomButton(
          text: '+ Add Education',
          onPressed: _showAddEducationModal,
          backgroundColor: Colors.transparent,
          textColor: const Color(0xFF915EFF),
          borderRadius: 8,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ),
      ],
    );
  }

  Widget _buildCertificatesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Certificates',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),

        // Wyświetl dodane certyfikaty z modala
        ...(_addedCertificates.asMap().entries.map((entry) {
          final index = entry.key;
          final certificate = entry.value;
          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1A1A1A),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF333333)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        certificate['name'] ?? 'Certificate',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        certificate['organization'] ?? 'Organization',
                        style: const TextStyle(
                          color: Color(0xFF915EFF),
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Issued: ${certificate['issueDate'] ?? ''} ${certificate['noExpiration'] == true
                            ? '(No expiration)'
                            : certificate['expiryDate'] != null && certificate['expiryDate'].isNotEmpty
                            ? '• Expires: ${certificate['expiryDate']}'
                            : ''}',
                        style: const TextStyle(
                          color: Color(0xFF666666),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap:
                      () => setState(() {
                        _addedCertificates.removeAt(index);
                      }),
                  child: const Icon(Icons.close, color: Color(0xFF666666)),
                ),
              ],
            ),
          );
        }).toList()),

        if (_addedCertificates.isEmpty) ...[
          const Text(
            'No certificates added yet',
            style: TextStyle(color: Color(0xFF666666), fontSize: 14),
          ),
          const SizedBox(height: 16),
        ],

        CustomButton(
          text: '+ Add Certificate',
          onPressed: _showAddCertificateModal,
          backgroundColor: Colors.transparent,
          textColor: const Color(0xFF915EFF),
          borderRadius: 8,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ),
      ],
    );
  }

  Widget _buildBottomNavigation() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: const BoxDecoration(
        color: Color(0xFF0F0F0F),
        border: Border(top: BorderSide(color: Color(0xFF333333))),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Main navigation buttons
          Row(
            children: [
              if (_currentPage > 0) ...[
                Expanded(
                  child: CustomButton(
                    text: '← Back',
                    onPressed: _prevPage,
                    backgroundColor: const Color(0xFF2A2A2A),
                    textColor: Colors.white,
                    borderRadius: 8,
                  ),
                ),
                const SizedBox(width: 16),
              ],

              Expanded(
                child:
                    _isLoading
                        ? const Center(child: CircularProgressIndicator())
                        : CustomButton(
                          text: _currentPage == 4 ? 'Save →' : 'Continue →',
                          onPressed:
                              _currentPage == 4 ? _saveProfile : _nextPage,
                          borderRadius: 8,
                        ),
              ),
            ],
          ),

          // Delete Profile button (only on last page)
          if (_currentPage == 4) ...[
            const SizedBox(height: 16),
            CustomButton(
              text: 'Delete Profile →',
              onPressed: () {
                // Show confirmation dialog
                showDialog(
                  context: context,
                  builder:
                      (context) => AlertDialog(
                        backgroundColor: const Color(0xFF1A1A1A),
                        title: const Text(
                          'Delete Profile',
                          style: TextStyle(color: Colors.white),
                        ),
                        content: const Text(
                          'Are you sure you want to delete your profile? This action cannot be undone.',
                          style: TextStyle(color: Colors.white70),
                        ),
                        actions: [
                          Row(
                            children: [
                              Expanded(
                                child: CustomButton(
                                  text: 'Cancel',
                                  onPressed: () => Navigator.of(context).pop(),
                                  backgroundColor: const Color(0xFF2A2A2A),
                                  textColor: Colors.white,
                                  borderRadius: 8,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: CustomButton(
                                  text: 'Delete',
                                  onPressed: () {
                                    // Delete profile logic
                                    Navigator.of(context).pop();
                                  },
                                  backgroundColor: Colors.red,
                                  textColor: Colors.white,
                                  borderRadius: 8,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                );
              },
              backgroundColor: Colors.transparent,
              textColor: Colors.white,
              borderRadius: 8,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
          ],
        ],
      ),
    );
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _addressController.dispose();
    _phoneController.dispose();
    _aboutMeController.dispose();
    _additionalInfoController.dispose();
    _currentSalaryController.dispose();
    _desiredSalaryController.dispose();
    _loanDetailsController.dispose();

    for (var edu in _educationList) {
      edu.dispose();
    }
    for (var work in _workExperienceList) {
      work.dispose();
    }
    for (var cert in _certificatesList) {
      cert.dispose();
    }
    for (var lang in _languagesList) {
      lang.dispose();
    }

    super.dispose();
  }
}
