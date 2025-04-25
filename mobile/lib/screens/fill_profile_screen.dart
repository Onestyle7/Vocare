import 'package:flutter/material.dart';
import 'package:country_code_picker/country_code_picker.dart';
import 'package:vocare/screens/aI_asistent_screen.dart';
import 'package:vocare/services/profile_api.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/custom_input.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';

class FillProfileScreen extends StatefulWidget {
  const FillProfileScreen({super.key});

  @override
  State<FillProfileScreen> createState() => _FillProfileScreenState();
}

class _FillProfileScreenState extends State<FillProfileScreen> {
  final _nameController = TextEditingController();
  final _surnameController = TextEditingController();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _workExperienceController = TextEditingController();
  final _skillController = TextEditingController();
  final _certicateController = TextEditingController();
  final _languagesController = TextEditingController();
  final _additionallInformationController = TextEditingController();
  final _aboutMeController = TextEditingController();

  String selectedCountry = '';
  String? _selectEducation;
  int _currentStep = 0;

  final List<String> educationList = [
    'Wykształcenie podstawowe',
    'Wykształcenie gimnazjalne',
    'Wykształcenie średnie',
    'Wykształcenie policealne ',
    'Wykształcenie wyższe (licencjat)',
    'Wykształcenie wyższe (magister)',
    'Studia doktoranckie / doktorat',
    'Brak wykształcenia',
    'W trakcie studiów',
  ];

  @override
  void initState() {
    super.initState();
    loadUserProfile();
  }

  Future<void> loadUserProfile() async {
    final data = await ProfileApi.getUserProfile();
    if (data != null) {
      setState(() {
        _nameController.text = data['firstName'] ?? '';
        _surnameController.text = data['lastName'] ?? '';
        selectedCountry = data['country'] ?? '';
        _addressController.text = data['address'] ?? '';
        _phoneController.text = data['phoneNumber'] ?? '';
        _selectEducation = data['education'] ?? '';
        _workExperienceController.text = (data['workExperience'] as List).join(
          ', ',
        );
        _skillController.text = (data['skills'] as List).join(', ');
        _certicateController.text = (data['certificates'] as List).join(', ');
        _languagesController.text = (data['languages'] as List).join(', ');
        _additionallInformationController.text =
            data['additionalInformation'] ?? '';
        _aboutMeController.text = data['aboutMe'] ?? '';
      });
    }
  }

  void _saveProfile() async {
    final profileData = {
      "firstName": _nameController.text,
      "lastName": _surnameController.text,
      "country": selectedCountry,
      "address": _addressController.text,
      "phoneNumber": _phoneController.text,
      "education": _selectEducation,
      "workExperience":
          _workExperienceController.text
              .split(',')
              .map((e) => e.trim())
              .toList(),
      "skills": _skillController.text.split(',').map((e) => e.trim()).toList(),
      "certificates":
          _certicateController.text.split(',').map((e) => e.trim()).toList(),
      "languages":
          _languagesController.text.split(',').map((e) => e.trim()).toList(),
      "additionalInformation": _additionallInformationController.text,
      "aboutMe": _aboutMeController.text,
    };

    final success = await ProfileApi.createUserProfile(profileData);

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
      body: Stepper(
        currentStep: _currentStep,
        type: StepperType.vertical,
        onStepContinue: () {
          if (_currentStep < 3) {
            setState(() => _currentStep += 1);
          } else {
            _saveProfile();
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep -= 1);
          }
        },
        steps: [
          Step(
            title: const Text("Personal data"),
            content: Column(
              children: [
                CountryCodePicker(
                  onChanged: (country) {
                    setState(() {
                      selectedCountry = country.name ?? '';
                    });
                  },
                  initialSelection: 'PL',
                  showCountryOnly: true,
                  showOnlyCountryWhenClosed: true,
                ),
                CustomInput(
                  label: "Name",
                  hintText: "Type your Name",
                  controller: _nameController,
                  prefixIcon: Icon(Icons.person_3),
                ),
                CustomInput(
                  label: "Last name",
                  hintText: "Type your Last name",
                  controller: _surnameController,
                  prefixIcon: Icon(Icons.person_4),
                ),
                CustomInput(
                  label: "Adress",
                  hintText: "Type your address",
                  controller: _addressController,
                  prefixIcon: Icon(Icons.home_max),
                ),
                CustomInput(
                  label: "Phone number",
                  hintText: "Type yopur Phone number",
                  controller: _phoneController,
                  prefixIcon: Icon(Icons.phone),
                ),
              ],
            ),
            isActive: _currentStep >= 0,
          ),
          Step(
            title: const Text("Education and experience"),
            content: Column(
              children: [
                DropdownButtonFormField<String>(
                  value: _selectEducation,
                  decoration: _inputDecoration("Wykształcenie"),
                  items:
                      educationList
                          .map(
                            (e) => DropdownMenuItem(value: e, child: Text(e)),
                          )
                          .toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectEducation = value;
                    });
                  },
                ),

                CustomInput(
                  label: "certificate",
                  hintText: "Type your certificate",
                  controller: _certicateController,
                  prefixIcon: Icon(Icons.ac_unit),
                ),
                CustomInput(
                  label: "Skill",
                  hintText: "Type your skill",
                  controller: _skillController,
                  prefixIcon: Icon(Icons.screen_lock_landscape_outlined),
                ),
                CustomInput(
                  label: "Experience",
                  hintText: "Type your work experience",
                  controller: _workExperienceController,
                  prefixIcon: Icon(Icons.person_2),
                ),
              ],
            ),
            isActive: _currentStep >= 1,
          ),
          Step(
            title: const Text("Additional information"),
            content: Column(
              children: [
                CustomInput(
                  label: "Languages",
                  hintText: "Type languages",
                  controller: _languagesController,
                  prefixIcon: Icon(Icons.language),
                ),
                CustomInput(
                  label: "About Me",
                  hintText: "Type information about you",
                  controller: _aboutMeController,
                  prefixIcon: Icon(Icons.person_2),
                ),
                CustomInput(
                  label: "additional information",
                  hintText: "Type additional information",
                  controller: _additionallInformationController,
                  prefixIcon: Icon(Icons.info),
                ),
              ],
            ),
            isActive: _currentStep >= 2,
          ),
          Step(
            title: const Text("Save the data"),
            content: CustomButton(
              text: "Save the data",
              onPressed: _saveProfile,
            ),
            isActive: _currentStep >= 3,
          ),
        ],
      ),
      bottomNavigationBar: Container(
        height: 60,
        decoration: const BoxDecoration(
          color: Colors.black87,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
          ),
        ),
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

  Widget _buildMultilineField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: TextFormField(
        controller: controller,
        maxLines: 4,
        decoration: _inputDecoration(label),
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(25)),
    );
  }
}
