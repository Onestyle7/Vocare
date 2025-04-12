import 'package:flutter/material.dart';
import 'package:country_code_picker/country_code_picker.dart';
import 'package:vocare/screens/aI_asistent_screen.dart';
import 'package:vocare/services/profile_api.dart';
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
        _workExperienceController.text = (data['workExperience'] as List).join(', ');
        _skillController.text = (data['skills'] as List).join(', ');
        _certicateController.text = (data['certificates'] as List).join(', ');
        _languagesController.text = (data['languages'] as List).join(', ');
        _additionallInformationController.text = data['additionalInformation'] ?? '';
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
      "workExperience": _workExperienceController.text.split(',').map((e) => e.trim()).toList(),
      "skills": _skillController.text.split(',').map((e) => e.trim()).toList(),
      "certificates": _certicateController.text.split(',').map((e) => e.trim()).toList(),
      "languages": _languagesController.text.split(',').map((e) => e.trim()).toList(),
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
      bottomNavigationBar:(Text("Test")) ,
       appBar: AppBar(
      backgroundColor: Colors.black87,
  automaticallyImplyLeading: false, // usuwa strzałkę "wstecz"
  toolbarHeight: 60,
 
  flexibleSpace: SafeArea(
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


      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Text(
                  "Vocare",
                  style: TextStyle(
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              _buildTextField("Name", _nameController),
              _buildTextField("Last name", _surnameController),
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
              _buildTextField("Address", _addressController),
              _buildTextField("Phone number", _phoneController),
              DropdownButtonFormField<String>(
                value: _selectEducation,
                decoration: _inputDecoration("Wykształcenie"),
                items: educationList.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectEducation = value;
                  });
                },
              ),
              const SizedBox(height: 12),
              _buildMultilineField("Work experience", _workExperienceController),
              _buildMultilineField("Skills", _skillController),
              _buildMultilineField("Certificates", _certicateController),
              _buildTextField("Languages", _languagesController),
              _buildMultilineField("About Me", _aboutMeController),
              _buildMultilineField("Additional Information", _additionallInformationController),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _saveProfile,
                child: const Text("Zapisz dane"),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: TextFormField(
        controller: controller,
        decoration: _inputDecoration(label),
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
      
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(25),
      ),
    );
  }
}
