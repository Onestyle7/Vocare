import 'package:flutter/material.dart';
import 'package:country_code_picker/country_code_picker.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/custom_input.dart';
import 'package:vocare/widgets/custom_date_input.dart'; // 🆕 NOWY IMPORT
import 'package:vocare/services/profile_api.dart';
import 'package:vocare/screens/aI_asistent_screen.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';
import 'package:vocare/models/personality_type.dart';

// 🆕 Nowy enum dla ankiety finansowej
enum RiskAppetite {
  low('Low'),
  medium('Medium'),
  high('High');

  final String label;
  const RiskAppetite(this.label);
}

// 🔄 Rozszerzone klasy dla złożonych struktur z checkboxami
class _Education {
  final TextEditingController institutionController = TextEditingController();
  final TextEditingController degreeController = TextEditingController();
  final TextEditingController fieldController = TextEditingController();
  final TextEditingController startDateController = TextEditingController();
  final TextEditingController endDateController = TextEditingController();

  // 🆕 Nowe pole dla checkbox "Currently studying here"
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

  // 🆕 Nowe pole dla checkbox "Currently working here"
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

// 🆕 Nowe klasy dla certificates i languages
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

  // 🔄 Zmienione nazwy kontrolerów na bardziej precyzyjne
  final _firstNameController = TextEditingController(); // firstName
  final _lastNameController = TextEditingController(); // lastName
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _aboutMeController = TextEditingController();
  final _additionalInfoController = TextEditingController();

  // 🆕 Nowe kontrolery
  final _softSkillsController = TextEditingController(); // softSkills

  // 🆕 Financial Survey kontrolery
  final _currentSalaryController = TextEditingController();
  final _desiredSalaryController = TextEditingController();
  final _loanDetailsController = TextEditingController();

  // 🔄 Zmienione listy na bardziej strukturalne
  List<_Education> _educationList = [_Education()]; // Rozszerzone
  List<_WorkExperience> _workExperienceList = [
    _WorkExperience(),
  ]; // Rozszerzone
  List<_Certificate> _certificatesList = [_Certificate()]; // 🆕 Nowa struktura
  List<_Language> _languagesList = [_Language()]; // 🆕 Nowa struktura

  // Selections i boolean values
  String selectedCountry = '';
  PersonalityType? _selectedPersonalityType;
  RiskAppetite? _selectedRiskAppetite; // 🆕
  bool _willingToRebrand = false; // 🆕
  bool _hasLoans = false; // 🆕
  bool _willingToRelocate = false; // 🆕

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  // 🔄 ZAKTUALIZOWANA METODA ŁADOWANIA PROFILU Z OBSŁUGĄ CHECKBOXÓW
  Future<void> _loadUserProfile() async {
    final data = await ProfileApi.getUserProfile();
    if (data == null) return;

    setState(() {
      // Personal info
      _firstNameController.text = data['firstName'] ?? '';
      _lastNameController.text = data['lastName'] ?? '';
      selectedCountry = data['country'] ?? '';
      _addressController.text = data['address'] ?? '';
      _phoneController.text = data['phoneNumber'] ?? '';
      _aboutMeController.text = data['aboutMe'] ?? '';
      _additionalInfoController.text = data['additionalInformation'] ?? '';
      _softSkillsController.text =
          (data['softSkills'] as List?)?.join(', ') ?? '';
      _willingToRebrand = data['willingToRebrand'] ?? false;

      // Personality
      final personality =
          (data['personalityType'] ?? '').toString().toLowerCase();
      _selectedPersonalityType = PersonalityType.values.firstWhere(
        (e) => e.name == personality,
        orElse: () => PersonalityType.unknown,
      );

      // 🔄 Education z obsługą checkbox
      final eduList = (data['education'] as List?) ?? [];
      if (eduList.isNotEmpty) {
        _educationList.clear();
        for (var eduData in eduList) {
          final edu = _Education();
          edu.institutionController.text = eduData['institution'] ?? '';
          edu.degreeController.text = eduData['degree'] ?? '';
          edu.fieldController.text = eduData['field'] ?? '';
          edu.startDateController.text = eduData['startDate'] ?? '';
          edu.endDateController.text = eduData['endDate'] ?? '';

          // 🆕 Ustaw checkbox na podstawie endDate lub dodatkowego pola
          edu.isCurrentlyStudying =
              eduData['isCurrentlyStudying'] ??
              (eduData['endDate'] == null ||
                  eduData['endDate'].toString().trim().isEmpty);

          _educationList.add(edu);
        }
      }

      // 🔄 Work Experience z obsługą checkbox
      final workList = (data['workExperience'] as List?) ?? [];
      if (workList.isNotEmpty) {
        _workExperienceList.clear();
        for (var workData in workList) {
          final work = _WorkExperience();
          work.companyController.text = workData['company'] ?? '';
          work.positionController.text = workData['position'] ?? '';
          work.descriptionController.text = workData['description'] ?? '';
          work.responsibilitiesController.text =
              (workData['responsibilities'] as List?)?.join(', ') ?? '';
          work.startDateController.text = workData['startDate'] ?? '';
          work.endDateController.text = workData['endDate'] ?? '';

          // 🆕 Ustaw checkbox na podstawie endDate lub dodatkowego pola
          work.isCurrentlyWorking =
              workData['isCurrentlyWorking'] ??
              (workData['endDate'] == null ||
                  workData['endDate'].toString().trim().isEmpty);

          _workExperienceList.add(work);
        }
      }

      // 🆕 Certificates (nowa struktura)
      final certList = (data['certificates'] as List?) ?? [];
      if (certList.isNotEmpty) {
        _certificatesList.clear();
        for (var certData in certList) {
          final cert = _Certificate();
          cert.nameController.text = certData['name'] ?? '';
          cert.dateController.text = certData['date'] ?? '';
          cert.issuerController.text = certData['issuer'] ?? '';
          _certificatesList.add(cert);
        }
      }

      // 🆕 Languages (nowa struktura)
      final langList = (data['languages'] as List?) ?? [];
      if (langList.isNotEmpty) {
        _languagesList.clear();
        for (var langData in langList) {
          final lang = _Language();
          lang.languageController.text = langData['language'] ?? '';
          lang.levelController.text = langData['level'] ?? '';
          _languagesList.add(lang);
        }
      }

      // 🆕 Financial Survey
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
          (e) => e.name == risk,
          orElse: () => RiskAppetite.low,
        );
      }
    });
  }

  void _nextPage() {
    if (_currentPage < 5) {
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

  // 🔄 ZAKTUALIZOWANA METODA ZAPISYWANIA PROFILU Z OBSŁUGĄ CHECKBOXÓW
  Future<void> _saveProfile() async {
    setState(() => _isLoading = true);

    if (selectedCountry.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Wybierz kraj')));
      setState(() => _isLoading = false);
      return;
    }

    final profileData = {
      "firstName": _firstNameController.text.trim(),
      "lastName": _lastNameController.text.trim(),
      "country": selectedCountry.trim(),
      "address": _addressController.text.trim(),
      "phoneNumber": _phoneController.text.trim(),
      "personalityType": _selectedPersonalityType?.name ?? "unknown",
      "aboutMe": _aboutMeController.text.trim(),
      "additionalInformation": _additionalInfoController.text.trim(),
      "willingToRebrand": _willingToRebrand,

      // 🔄 Education z obsługą checkbox
      "education":
          _educationList
              .where((edu) => edu.institutionController.text.trim().isNotEmpty)
              .map(
                (edu) => {
                  "institution": edu.institutionController.text.trim(),
                  "degree": edu.degreeController.text.trim(),
                  "field": edu.fieldController.text.trim(),
                  "startDate": edu.startDateController.text.trim(),
                  // Jeśli obecnie studiuje, endDate jest pustą stringą
                  "endDate":
                      edu.isCurrentlyStudying
                          ? ""
                          : edu.endDateController.text.trim(),
                  "isCurrentlyStudying":
                      edu.isCurrentlyStudying, // 🆕 Dodatkowe pole
                },
              )
              .toList(),

      // 🔄 Work Experience z obsługą checkbox
      "workExperience":
          _workExperienceList
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
                  // Jeśli obecnie pracuje, endDate jest pustą stringą
                  "endDate":
                      exp.isCurrentlyWorking
                          ? ""
                          : exp.endDateController.text.trim(),
                  "isCurrentlyWorking":
                      exp.isCurrentlyWorking, // 🆕 Dodatkowe pole
                },
              )
              .toList(),

      "skills": _getSkillsList(),
      "softSkills":
          _softSkillsController.text
              .split(',')
              .map((e) => e.trim())
              .where((e) => e.isNotEmpty)
              .toList(),

      "certificates":
          _certificatesList
              .where((cert) => cert.nameController.text.trim().isNotEmpty)
              .map(
                (cert) => {
                  "name": cert.nameController.text.trim(),
                  "date": cert.dateController.text.trim(),
                  "issuer": cert.issuerController.text.trim(),
                },
              )
              .toList(),

      "languages":
          _languagesList
              .where((lang) => lang.languageController.text.trim().isNotEmpty)
              .map(
                (lang) => {
                  "language": lang.languageController.text.trim(),
                  "level": lang.levelController.text.trim(),
                },
              )
              .toList(),

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

    final success = await ProfileApi.createUserProfile(profileData);
    setState(() => _isLoading = false);

    if (success) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const AIAsistentPageScreen()),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nie udało się zapisać danych')),
      );
    }
  }

  List<String> _getSkillsList() {
    return [];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Uzupełnij profil'),
        backgroundColor: Colors.black87,
      ),
      body: SafeArea(
        child: Column(
          children: [
            LinearProgressIndicator(
              value: (_currentPage + 1) / 6,
              minHeight: 6,
            ),
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildPersonalPage(),
                  _buildEducationPage(),
                  _buildWorkExperiencePage(),
                  _buildSkillsPage(),
                  _buildLanguagesAndCertificatesPage(),
                  _buildFinancialSurveyPage(),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  if (_currentPage > 0)
                    CustomButton(text: 'Wstecz', onPressed: _prevPage),
                  if (_currentPage < 5)
                    CustomButton(text: 'Dalej', onPressed: _nextPage),
                  if (_currentPage == 5)
                    _isLoading
                        ? const CircularProgressIndicator()
                        : CustomButton(
                          text: 'Zapisz profil',
                          onPressed: _saveProfile,
                        ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        height: 60,
        color: Colors.black87,
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                ThemeToggleButton(),
                NavBarButtons(
                  destinations: [
                    NavDestination.home,
                    NavDestination.profile,
                    NavDestination.logout,
                    NavDestination.assistent,
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // 🔄 Rozszerzona strona personal (dodano willingToRebrand)
  Widget _buildPersonalPage() => SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: Column(
      children: [
        Center(
          child: Image.asset(
            'assets/img/vocare.png',
            height: 80,
            fit: BoxFit.contain,
          ),
        ),
        const SizedBox(height: 16),
        CountryCodePicker(
          onChanged: (c) => setState(() => selectedCountry = c.name ?? ''),
          initialSelection: 'PL',
          showCountryOnly: true,
          showOnlyCountryWhenClosed: true,
        ),
        CustomInput(
          label: "Imię",
          hintText: "Wpisz swoje imię",
          controller: _firstNameController,
        ),
        CustomInput(
          label: "Nazwisko",
          hintText: "Wpisz swoje nazwisko",
          controller: _lastNameController,
        ),
        CustomInput(
          label: "Adres",
          hintText: "Wpisz swój adres",
          controller: _addressController,
        ),
        CustomInput(
          label: "Numer telefonu",
          hintText: "Wpisz swój numer telefonu",
          controller: _phoneController,
          keyboardType: TextInputType.phone,
        ),

        Container(
          margin: const EdgeInsets.all(16),
          child: DropdownButtonFormField<PersonalityType>(
            value: _selectedPersonalityType,
            decoration: _inputDecoration("Typ osobowości"),
            dropdownColor: const Color(0xFF191A23),
            style: const TextStyle(color: Colors.white),
            icon: const Icon(Icons.keyboard_arrow_down, color: Colors.white),
            items:
                PersonalityType.values
                    .map(
                      (t) => DropdownMenuItem(
                        value: t,
                        child: Text(
                          t.label,
                          style: const TextStyle(color: Colors.white),
                        ),
                      ),
                    )
                    .toList(),
            onChanged: (v) => setState(() => _selectedPersonalityType = v),
          ),
        ),
        const SizedBox(height: 16),
        CheckboxListTile(
          title: const Text("Chcę się przebrandować"),
          value: _willingToRebrand,
          onChanged: (v) => setState(() => _willingToRebrand = v ?? false),
        ),
        CustomInput(
          label: "O mnie",
          hintText: "Opowiedz coś o sobie",
          controller: _aboutMeController,
        ),
        CustomInput(
          label: "Dodatkowe informacje",
          hintText: "Wszelkie dodatkowe informacje",
          controller: _additionalInfoController,
        ),
      ],
    ),
  );

  // 🔄 ZAKTUALIZOWANA STRONA EDUCATION Z DATE PICKERAMI I CHECKBOXAMI
  Widget _buildEducationPage() => SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: Column(
      children: [
        Center(
          child: Image.asset(
            'assets/img/vocare.png',
            height: 80,
            fit: BoxFit.contain,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          "Wykształcenie",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        const SizedBox(height: 16),
        ..._educationList.asMap().entries.map((entry) {
          final idx = entry.key;
          final edu = entry.value;
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  if (idx > 0)
                    Align(
                      alignment: Alignment.topRight,
                      child: IconButton(
                        icon: const Icon(Icons.delete),
                        onPressed:
                            () => setState(() {
                              edu.dispose();
                              _educationList.removeAt(idx);
                            }),
                      ),
                    ),
                  CustomInput(
                    label: "Instytucja",
                    hintText: "np. Uniwersytet Warszawski",
                    controller: edu.institutionController,
                  ),
                  CustomInput(
                    label: "Stopień",
                    hintText: "np. Licencjat, Magister",
                    controller: edu.degreeController,
                  ),
                  CustomInput(
                    label: "Kierunek",
                    hintText: "np. Informatyka",
                    controller: edu.fieldController,
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: CustomDateInput(
                          // 🔄 ZMIENIONE NA DATE PICKER
                          label: "Data rozpoczęcia",
                          hintText: "Wybierz datę",
                          controller: edu.startDateController,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: CustomDateInput(
                          // 🔄 ZMIENIONE NA DATE PICKER
                          label: "Data zakończenia",
                          hintText: "Wybierz datę",
                          controller: edu.endDateController,
                          enabled:
                              !edu.isCurrentlyStudying, // 🆕 WYŁĄCZ JEŚLI OBECNIE STUDIUJE
                        ),
                      ),
                    ],
                  ),
                  // 🆕 NOWY CHECKBOX
                  CurrentlyHereCheckbox(
                    label: "Currently studying ",
                    value: edu.isCurrentlyStudying,
                    onChanged: (value) {
                      setState(() {
                        edu.isCurrentlyStudying = value ?? false;
                        if (edu.isCurrentlyStudying) {
                          edu.endDateController
                              .clear(); // Wyczyść datę zakończenia
                        }
                      });
                    },
                  ),
                ],
              ),
            ),
          );
        }),
        CustomButton(
          text: "Dodaj wykształcenie",
          onPressed: () => setState(() => _educationList.add(_Education())),
        ),
      ],
    ),
  );

  // 🆕 NOWA STRONA - Work Experience z date pickerami i checkboxami
  Widget _buildWorkExperiencePage() => SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: Column(
      children: [
        Center(
          child: Image.asset(
            'assets/img/vocare.png',
            height: 80,
            fit: BoxFit.contain,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          "Doświadczenie zawodowe",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        const SizedBox(height: 16),
        ..._workExperienceList.asMap().entries.map((entry) {
          final idx = entry.key;
          final work = entry.value;
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  if (idx > 0)
                    Align(
                      alignment: Alignment.topRight,
                      child: IconButton(
                        icon: const Icon(Icons.delete),
                        onPressed:
                            () => setState(() {
                              work.dispose();
                              _workExperienceList.removeAt(idx);
                            }),
                      ),
                    ),
                  CustomInput(
                    label: "Stanowisko",
                    hintText: "np. QA Engineer",
                    controller: work.positionController,
                  ),
                  CustomInput(
                    label: "Firma",
                    hintText: "np. Allegro",
                    controller: work.companyController,
                  ),
                  CustomInput(
                    label: "Opis pracy",
                    hintText: "Krótki opis Twojej roli",
                    controller: work.descriptionController,
                  ),
                  CustomInput(
                    label: "Obowiązki",
                    hintText: "Główne obowiązki, oddzielone przecinkami",
                    controller: work.responsibilitiesController,
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: CustomDateInput(
                          // 🔄 ZMIENIONE NA DATE PICKER
                          label: "Data rozpoczęcia",
                          hintText: "Wybierz datę",
                          controller: work.startDateController,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: CustomDateInput(
                          // 🔄 ZMIENIONE NA DATE PICKER
                          label: "Data zakończenia",
                          hintText: "Wybierz datę",
                          controller: work.endDateController,
                          enabled:
                              !work
                                  .isCurrentlyWorking, // 🆕 WYŁĄCZ JEŚLI OBECNIE PRACUJE
                        ),
                      ),
                    ],
                  ),
                  // 🆕 NOWY CHECKBOX
                  CurrentlyHereCheckbox(
                    label: "I currently work here",
                    value: work.isCurrentlyWorking,
                    onChanged: (value) {
                      setState(() {
                        work.isCurrentlyWorking = value ?? false;
                        if (work.isCurrentlyWorking) {
                          work.endDateController
                              .clear(); // Wyczyść datę zakończenia
                        }
                      });
                    },
                  ),
                ],
              ),
            ),
          );
        }),
        CustomButton(
          text: "Dodaj doświadczenie",
          onPressed:
              () => setState(() => _workExperienceList.add(_WorkExperience())),
        ),
      ],
    ),
  );

  // 🔄 Rozszerzona strona skills (dodano softSkills)
  Widget _buildSkillsPage() => SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: Column(
      children: [
        Center(
          child: Image.asset(
            'assets/img/vocare.png',
            height: 80,
            fit: BoxFit.contain,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          "Umiejętności",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        const SizedBox(height: 16),
        const Text("TODO: Dodać skills input"),
        const SizedBox(height: 16),
        CustomInput(
          label: "Umiejętności miękkie",
          hintText: "np. komunikacja, praca w zespole (oddzielone przecinkami)",
          controller: _softSkillsController,
        ),
      ],
    ),
  );

  // 🆕 Nowa strona - Languages i Certificates z date pickerem dla certyfikatów
  Widget _buildLanguagesAndCertificatesPage() => SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: Column(
      children: [
        Center(
          child: Image.asset(
            'assets/img/vocare.png',
            height: 80,
            fit: BoxFit.contain,
          ),
        ),
        const SizedBox(height: 16),

        // Languages section
        const Text(
          "Języki",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        const SizedBox(height: 16),
        ..._languagesList.asMap().entries.map((entry) {
          final idx = entry.key;
          final lang = entry.value;
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  if (idx > 0)
                    Align(
                      alignment: Alignment.topRight,
                      child: IconButton(
                        icon: const Icon(Icons.delete),
                        onPressed:
                            () => setState(() {
                              lang.dispose();
                              _languagesList.removeAt(idx);
                            }),
                      ),
                    ),
                  Row(
                    children: [
                      Expanded(
                        child: CustomInput(
                          label: "Język",
                          hintText: "np. Angielski",
                          controller: lang.languageController,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: CustomInput(
                          label: "Poziom",
                          hintText: "np. B2, C1",
                          controller: lang.levelController,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }),
        CustomButton(
          text: "Dodaj język",
          onPressed: () => setState(() => _languagesList.add(_Language())),
        ),

        const SizedBox(height: 32),

        // 🔄 ZAKTUALIZOWANA SEKCJA CERTIFICATES Z DATE PICKEREM
        const Text(
          "Certyfikaty",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        const SizedBox(height: 16),
        ..._certificatesList.asMap().entries.map((entry) {
          final idx = entry.key;
          final cert = entry.value;
          return Card(
            margin: const EdgeInsets.only(bottom: 16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  if (idx > 0)
                    Align(
                      alignment: Alignment.topRight,
                      child: IconButton(
                        icon: const Icon(Icons.delete),
                        onPressed:
                            () => setState(() {
                              cert.dispose();
                              _certificatesList.removeAt(idx);
                            }),
                      ),
                    ),
                  CustomInput(
                    label: "Nazwa certyfikatu",
                    hintText: "np. AWS Certified Developer",
                    controller: cert.nameController,
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: CustomDateInput(
                          // 🔄 ZMIENIONE NA DATE PICKER
                          label: "Data uzyskania",
                          hintText: "Wybierz datę",
                          controller: cert.dateController,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: CustomInput(
                          label: "Wydawca",
                          hintText: "np. Amazon Web Services",
                          controller: cert.issuerController,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }),
        CustomButton(
          text: "Dodaj certyfikat",
          onPressed:
              () => setState(() => _certificatesList.add(_Certificate())),
        ),
      ],
    ),
  );

  // 🆕 Nowa strona - Financial Survey
  Widget _buildFinancialSurveyPage() => SingleChildScrollView(
    padding: const EdgeInsets.all(16),
    child: Column(
      children: [
        Center(
          child: Image.asset(
            'assets/img/vocare.png',
            height: 80,
            fit: BoxFit.contain,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          "Ankieta finansowa",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        const SizedBox(height: 16),
        CustomInput(
          label: "Obecne wynagrodzenie",
          hintText: "Kwota w PLN (np. 5000)",
          controller: _currentSalaryController,
          keyboardType: TextInputType.number,
        ),
        CustomInput(
          label: "Oczekiwane wynagrodzenie",
          hintText: "Kwota w PLN (np. 7000)",
          controller: _desiredSalaryController,
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 16),
        CheckboxListTile(
          title: const Text("Mam kredyty lub pożyczki"),
          value: _hasLoans,
          onChanged: (v) => setState(() => _hasLoans = v ?? false),
        ),
        if (_hasLoans)
          CustomInput(
            label: "Szczegóły kredytów",
            hintText: "Opisz swoje zobowiązania finansowe",
            controller: _loanDetailsController,
          ),
        const SizedBox(height: 16),
        DropdownButtonFormField<RiskAppetite>(
          value: _selectedRiskAppetite,
          decoration: _inputDecoration("Skłonność do ryzyka"),
          items:
              RiskAppetite.values
                  .map((r) => DropdownMenuItem(value: r, child: Text(r.label)))
                  .toList(),
          onChanged: (v) => setState(() => _selectedRiskAppetite = v),
        ),
        const SizedBox(height: 16),
        CheckboxListTile(
          title: const Text("Chcę się przeprowadzić dla pracy"),
          value: _willingToRelocate,
          onChanged: (v) => setState(() => _willingToRelocate = v ?? false),
        ),
      ],
    ),
  );

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.white),
      filled: true,
      fillColor: const Color(0xFF191A23),
      hintStyle: const TextStyle(color: Colors.white70),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(25),
        borderSide: const BorderSide(color: Color(0xFF915EFF), width: 2),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(25),
        borderSide: const BorderSide(color: Color(0xFF915EFF), width: 2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(25),
        borderSide: const BorderSide(color: Color(0xFF915EFF), width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    );
  }

  @override
  void dispose() {
    // Personal controllers
    _firstNameController.dispose();
    _lastNameController.dispose();
    _addressController.dispose();
    _phoneController.dispose();
    _aboutMeController.dispose();
    _additionalInfoController.dispose();
    _softSkillsController.dispose();

    // Financial controllers
    _currentSalaryController.dispose();
    _desiredSalaryController.dispose();
    _loanDetailsController.dispose();

    // Dispose education list
    for (var edu in _educationList) {
      edu.dispose();
    }

    // Dispose work experience list
    for (var work in _workExperienceList) {
      work.dispose();
    }

    // Dispose certificates list
    for (var cert in _certificatesList) {
      cert.dispose();
    }

    // Dispose languages list
    for (var lang in _languagesList) {
      lang.dispose();
    }

    super.dispose();
  }
}
