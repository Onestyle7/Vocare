import 'package:flutter/material.dart';
import 'package:country_code_picker/country_code_picker.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/custom_input.dart';
import 'package:vocare/services/profile_api.dart';
import 'package:vocare/screens/aI_asistent_screen.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';

class FillProfileScreen extends StatefulWidget {
  const FillProfileScreen({super.key});

  @override
  State<FillProfileScreen> createState() => _FillProfileScreenState();
}

class _FillProfileScreenState extends State<FillProfileScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  bool _isLoading = false;

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

  void _nextPage() {
    if (_currentPage < 2) {
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

  void _saveProfile() async {
    setState(() => _isLoading = true);

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
      appBar: AppBar(title: const Text('Uzupełnij profil')),
      body: SafeArea(
        child: Column(
          children: [
            LinearProgressIndicator(
              value: (_currentPage + 1) / 3,
              minHeight: 6,
            ),
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildPersonalDataPage(),
                  _buildEducationPage(),
                  _buildAdditionalInfoPage(),
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
                  if (_currentPage < 2)
                    CustomButton(text: 'Dalej', onPressed: _nextPage),
                  if (_currentPage == 2)
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

  Widget _buildPersonalDataPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
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
  }

  Widget _buildEducationPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          DropdownButtonFormField<String>(
            value: _selectEducation,
            decoration: _inputDecoration("Wykształcenie"),
            items:
                educationList
                    .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                    .toList(),
            onChanged: (value) {
              setState(() {
                _selectEducation = value;
              });
            },
          ),
          CustomInput(
            label: "Work experience",
            hintText: "Work experience",
            controller: _workExperienceController,
          ),
          CustomInput(
            label: "Skills",
            hintText: "Your skills",
            controller: _skillController,
          ),
          CustomInput(
            label: "Certificates",
            hintText: "Certificates",
            controller: _certicateController,
          ),
        ],
      ),
    );
  }

  Widget _buildAdditionalInfoPage() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          CustomInput(
            label: "Languages",
            hintText: "Languages",
            controller: _languagesController,
          ),
          CustomInput(
            label: "About Me",
            hintText: "About Me",
            controller: _aboutMeController,
          ),
          CustomInput(
            label: "Additional Information",
            hintText: "Additional Information",
            controller: _additionallInformationController,
          ),
        ],
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
