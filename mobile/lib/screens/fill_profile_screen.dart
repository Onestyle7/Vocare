import 'package:flutter/material.dart';
import 'package:country_code_picker/country_code_picker.dart';
import 'package:vocare/screens/home_page_screen.dart';
import 'package:vocare/services/profile_api.dart';
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

  List<String> educationList = [
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
      Navigator.push(context, MaterialPageRoute(builder: (context) => HomePageScreen()));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Nie udało się zapisać danych')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Profil użytkownika"),actions: [ThemeToggleButton()]),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Positioned(
              left: 100,
              top: 928,
              child: Text(
                "Vocare",
                style: TextStyle(fontSize: 55),
              ),
            ),
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(labelText: "Name",border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),),
                
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _surnameController,
                decoration: InputDecoration(labelText: "Last name",border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),),
              ),
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
              SizedBox(height: 16),
              TextFormField(
                controller: _addressController,
                decoration: InputDecoration(labelText: "Address",border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),),
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                decoration: InputDecoration(labelText: "Phone number",border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),),
              ),
              SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectEducation,
                decoration: InputDecoration(labelText: "Wykształcenie",border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),),
                items: educationList.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectEducation = value;
                  });
                },
              ),
              SizedBox(height: 12),
              TextFormField(
                controller: _workExperienceController,
                decoration: InputDecoration(labelText: "Work expieriance", border: OutlineInputBorder(borderRadius: BorderRadius.circular(25),),),
                maxLines: 5,
              ),
              SizedBox(height: 12),
              TextFormField(
                controller: _skillController,
                decoration: InputDecoration(labelText: "Skill",border: OutlineInputBorder(borderRadius: BorderRadius.circular(25),)),
                maxLines: 5,
              ),
              SizedBox(height: 12),
              TextFormField(
                controller: _certicateController,
                decoration: InputDecoration(labelText: "Certicates",border: OutlineInputBorder(borderRadius: BorderRadius.circular(25),)),
                maxLines: 5,
                
              ),
              SizedBox(height: 12),
              TextFormField(
                controller: _languagesController,
                decoration: InputDecoration(labelText: "Languages",border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _aboutMeController,
                decoration: InputDecoration(labelText: "About Me", border: OutlineInputBorder(borderRadius: BorderRadius.circular(25),)),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _additionallInformationController,
                decoration: InputDecoration(labelText: "Additional Information", border: OutlineInputBorder(borderRadius: BorderRadius.circular(25),)),
                maxLines: 3,
              ),
              ElevatedButton(
                onPressed: _saveProfile,
                child: Text("Zapisz dane"),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
