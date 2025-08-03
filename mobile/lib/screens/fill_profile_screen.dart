import 'package:flutter/material.dart';
import 'package:country_code_picker/country_code_picker.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/custom_input.dart';
import 'package:vocare/services/profile_api.dart';
import 'package:vocare/screens/aI_asistent_screen.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';

enum PersonalityType {
  mediator('Mediator'),
  advocate('Advocate'),
  logician('Logician'),
  architect('Architect'),
  campaigner('Campaigner'),
  protagonist('Protagonist'),
  debater('Debater'),
  commander('Commander'),
  adventurer('Adventurer'),
  defender('Defender'),
  virtuoso('Virtuoso'),
  logistician('Logistician'),
  entertainer('Entertainer'),
  consul('Consul'),
  entrepreneur('Entrepreneur'),
  executive('Executive'),
  unknown('Unknown');

  final String label;
  const PersonalityType(this.label);
}

class _WorkExperience {
  final TextEditingController positionController = TextEditingController();
  final TextEditingController companyController = TextEditingController();
  final TextEditingController yearsController = TextEditingController();
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

  // Controllers:
  final _nameController = TextEditingController();
  final _surnameController = TextEditingController();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _educationInstitutionController = TextEditingController();
  final _educationYearController = TextEditingController();
  final _skillController = TextEditingController();
  final _certificateController = TextEditingController();
  final _languagesController = TextEditingController();
  final _aboutMeController = TextEditingController();
  final _additionalInfoController = TextEditingController();

  List<_WorkExperience> _workExperienceList = [_WorkExperience()];

  String selectedCountry = '';
  String? _selectEducation;
  PersonalityType? _selectedPersonalityType;

  final List<String> educationList = [
    'Wykształcenie podstawowe',
    'Wykształcenie gimnazjalne',
    'Wykształcenie średnie',
    'Wykształcenie policealne',
    'Wykształcenie wyższe (licencjat)',
    'Wykształcenie wyższe (magister)',
    'Studia doktoranckie / doktorat',
    'Brak wykształcenia',
    'W trakcie studiów',
  ];

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    final data = await ProfileApi.getUserProfile();
    if (data == null) return;

    setState(() {
      // personal
      _nameController.text = data['firstName'] ?? '';
      _surnameController.text = data['lastName'] ?? '';
      selectedCountry = data['country'] ?? '';
      _addressController.text = data['address'] ?? '';
      _phoneController.text = data['phoneNumber'] ?? '';

      // education & work
      // EDUCATION (pierwszy wpis)
      final List eduList = (data['education'] as List?) ?? [];
      if (eduList.isNotEmpty) {
        final edu = eduList.first as Map<String, dynamic>;
        _selectEducation = edu['degree'] as String?;
        _educationInstitutionController.text =
            edu['institution'] as String? ?? '';
        final String start = edu['startDate'] as String? ?? '';
        if (start.length >= 4) {
          _educationYearController.text = start.substring(0, 4);
        }
      }

      final personality =
          (data['personalityType'] ?? '').toString().toLowerCase();
      _selectedPersonalityType = PersonalityType.values.firstWhere(
        (e) => e.name == personality,
        orElse: () => PersonalityType.unknown,
      );
      final workList =
          (data['workExperience'] as List?)
              ?.where((w) => w['company'] != null && w['position'] != null)
              .toList() ??
          [];
      if (workList.isNotEmpty) {
        _workExperienceList =
            workList.map((entry) {
              final w = _WorkExperience();
              w.companyController.text = entry['company'] ?? '';
              w.positionController.text = entry['position'] ?? '';
              final match = RegExp(
                r'(\d+)',
              ).firstMatch(entry['description'] ?? '');
              w.yearsController.text = match?.group(1) ?? '';
              return w;
            }).toList();
      }

      // skills & certificates & languages
      _skillController.text = (data['skills'] as List?)?.join(', ') ?? '';
      _certificateController.text =
          (data['certificates'] as List?)
              ?.map((e) => e['name'])
              .whereType<String>()
              .join(', ') ??
          '';
      _languagesController.text =
          (data['languages'] as List?)
              ?.map((e) => e['language'])
              .whereType<String>()
              .join(', ') ??
          '';

      // about & additional
      _aboutMeController.text = data['aboutMe'] ?? '';
      _additionalInfoController.text = data['additionalInformation'] ?? '';
    });
  }

  void _nextPage() {
    if (_currentPage < 3) {
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

    if (selectedCountry.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Wybierz kraj')));
      setState(() => _isLoading = false);
      return;
    }

    final profileData = {
      "firstName": _nameController.text.trim(),
      "lastName": _surnameController.text.trim(),
      "country": selectedCountry.trim(),
      "address": _addressController.text.trim(),
      "phoneNumber": _phoneController.text.trim(),
      "personalityType": _selectedPersonalityType?.name ?? "unknown",
      "education": [
        {
          "degree": _selectEducation,
          "institution": _educationInstitutionController.text.trim(),
          "field": "",
          "startDate": _educationYearController.text.trim(),
          "endDate": "",
        },
      ],
      "workExperience":
          _workExperienceList
              .where(
                (exp) =>
                    exp.positionController.text.trim().isNotEmpty &&
                    exp.companyController.text.trim().isNotEmpty,
              )
              .map(
                (exp) => {
                  "company": exp.companyController.text.trim(),
                  "position": exp.positionController.text.trim(),
                  "description":
                      "Pracował(a) przez ${exp.yearsController.text.trim()} lata",
                  "responsibilities": [],
                  "startDate": "",
                  "endDate": "",
                },
              )
              .toList(),
      "skills":
          _skillController.text
              .split(',')
              .map((e) => e.trim())
              .where((e) => e.isNotEmpty)
              .toList(),
      "certificates":
          _certificateController.text
              .split(',')
              .map((e) => {"name": e.trim(), "date": null, "issuer": ""})
              .toList(),
      "languages":
          _languagesController.text
              .split(',')
              .map((e) => {"language": e.trim(), "level": ""})
              .toList(),
      "aboutMe": _aboutMeController.text.trim(),
      "additionalInformation": _additionalInfoController.text.trim(),
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
              value: (_currentPage + 1) / 4,
              minHeight: 6,
            ),
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildPersonalPage(),
                  _buildEducationPage(),
                  _buildSkillsPage(),
                  _buildAdditionalPage(),
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
                  if (_currentPage < 3)
                    CustomButton(text: 'Dalej', onPressed: _nextPage),
                  if (_currentPage == 3)
                    _isLoading
                        ? const CircularProgressIndicator()
                        : CustomButton(
                          text: 'Zapisz dane',
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
          label: "Name",
          hintText: "Type your name",
          controller: _nameController,
        ),
        CustomInput(
          label: "Last name",
          hintText: "Type your last name",
          controller: _surnameController,
        ),
        CustomInput(
          label: "Address",
          hintText: "Type your address",
          controller: _addressController,
        ),
        CustomInput(
          label: "Phone number",
          hintText: "Type your phone number",
          controller: _phoneController,
        ),
      ],
    ),
  );

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
        DropdownButtonFormField<String>(
          value: _selectEducation,
          decoration: _inputDecoration("Poziom wykształcenia"),
          items:
              educationList
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
          onChanged: (v) => setState(() => _selectEducation = v),
        ),
        CustomInput(
          label: "Institution",
          hintText: "e.g. Uniwersytet Warszawski",
          controller: _educationInstitutionController,
        ),
        CustomInput(
          label: "Year of graduation",
          hintText: "e.g. 2024",
          controller: _educationYearController,
          keyboardType: TextInputType.number,
        ),
        DropdownButtonFormField<PersonalityType>(
          value: _selectedPersonalityType,
          decoration: _inputDecoration("Personality Type"),
          items:
              PersonalityType.values
                  .map((t) => DropdownMenuItem(value: t, child: Text(t.label)))
                  .toList(),
          onChanged: (v) => setState(() => _selectedPersonalityType = v),
        ),
        const SizedBox(height: 16),
        const Text(
          "Work Experience",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        ..._workExperienceList.asMap().entries.map((e) {
          final idx = e.key, exp = e.value;
          return Column(
            children: [
              CustomInput(
                label: "Position",
                hintText: "e.g. QA Engineer",
                controller: exp.positionController,
              ),
              CustomInput(
                label: "Company",
                hintText: "e.g. Allegro",
                controller: exp.companyController,
              ),
              CustomInput(
                label: "Years",
                hintText: "e.g. 3",
                controller: exp.yearsController,
                keyboardType: TextInputType.number,
              ),
              if (idx == _workExperienceList.length - 1)
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed:
                        () => setState(
                          () => _workExperienceList.add(_WorkExperience()),
                        ),
                    child: const Text("Add another"),
                  ),
                ),
            ],
          );
        }),
      ],
    ),
  );

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
        CustomInput(
          label: "Skills",
          hintText: "Your skills, comma separated",
          controller: _skillController,
        ),
        CustomInput(
          label: "Certificates",
          hintText: "Your certificates, comma separated",
          controller: _certificateController,
        ),
        CustomInput(
          label: "Languages",
          hintText: "Languages, comma separated",
          controller: _languagesController,
        ),
      ],
    ),
  );

  Widget _buildAdditionalPage() => SingleChildScrollView(
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
        CustomInput(
          label: "About Me",
          hintText: "Tell us about yourself",
          controller: _aboutMeController,
        ),
        CustomInput(
          label: "Additional Information",
          hintText: "Any extra info",
          controller: _additionalInfoController,
        ),
      ],
    ),
  );

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(25)),
    );
  }
}
