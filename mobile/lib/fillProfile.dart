import 'dart:ui_web';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:country_picker/country_picker.dart';
import 'package:country_code_picker/country_code_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vocare/homePageScreen.dart';

class FillProfile extends StatefulWidget {
  const FillProfile({super.key});
  @override
  State<FillProfile> createState() => _FillProfileState();
}

class _FillProfileState extends State<FillProfile> {
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

  Future<void> createUserPrifile(
    String name,
    String lastName,
    String country,
    String address,
    String phoneNumber,
    String education,
    String workExerience,
    String skill,
    String certyfycates,
    String languages,
    String additionalInformation,
    String aboutMe,
    
  ) async {
    final url = Uri.parse('https://localhost:5001/api/UserProfile/CreateCurrentUserProfile');
    final bodyEncode = jsonEncode({
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
    });

    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken') ?? '';
    print('TOKEN POBRANY Z PAMIĘCI: $token');
    print('BODY WYSYŁANY DO BACKENDU: $bodyEncode');

    try {
      print('BODY WYSYŁANY DO BACKENDU: $bodyEncode');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json',
                  'Authorization': 'Bearer $token'},
        body: bodyEncode
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final accessToken = data['accessToken'];
        print('Zapisałeś dane');
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => HomePageScreen()),
        );
      } else {
        print("Błąd połączenia ${response.statusCode}");
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Nie poprawne dane')));
      }
    } catch (e) {
      print('Błąd połączenia: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Nie można połączyć się z serwerem')),
      );
    }
  }

  Future<void> loadUserProfile() async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('accessToken') ?? '';

  final url = Uri.parse('https://localhost:5001/api/UserProfile/GetCurrentUserProfile');
  
  try {
    final response = await http.get(url, headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    });

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

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

    } else {
      print("Nie udało się pobrać danych: ${response.statusCode}");
    }
  } catch (e) {
    print("Błąd podczas pobierania danych: $e");
  }
}

@override
void initState() {
  super.initState();
  loadUserProfile();
}
      

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Profil użytkownika")),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(labelText: "Name"),
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _surnameController,
                decoration: InputDecoration(labelText: "Last name"),
              ),
              CountryCodePicker(
                onChanged: (country) {
                  setState(() {
                    selectedCountry = country.name ?? '';
                  });
                  print('Wybrano: $selectedCountry');
                },
                initialSelection: 'PL',
                showCountryOnly: true,
                showOnlyCountryWhenClosed: true,
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _addressController,
                decoration: InputDecoration(labelText: "Address"),
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _phoneController,
                decoration: InputDecoration(labelText: "Phone number"),
              ),
              SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectEducation,
                decoration: InputDecoration(labelText: "Wykształcenie"),
                items:
                    educationList.map((e) {
                      return DropdownMenuItem(value: e, child: Text(e));
                    }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectEducation = value;
                  });
                },
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _workExperienceController,
                decoration: InputDecoration(
                  labelText: "Work expieriance",
                  border: OutlineInputBorder(),
                ),
                maxLines: 5,
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _skillController,
                decoration: InputDecoration(labelText: "Skill"),
                maxLines: 5,
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _certicateController,
                decoration: InputDecoration(labelText: "Certicates"),
                maxLines: 5,
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _languagesController,
                decoration: InputDecoration(labelText: "Languages"),
              ),
              TextFormField(
                controller: _aboutMeController,
                decoration: InputDecoration(
                  labelText: "About Me",
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              TextFormField(
                controller: _additionallInformationController,
                decoration: InputDecoration(
                  labelText: "additionalInformation",
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              ElevatedButton(onPressed: () {createUserPrifile(_nameController.text,
            _surnameController.text,
            selectedCountry,
            _addressController.text,
            _phoneController.text,
            _selectEducation ?? '',
            _workExperienceController.text,
            _skillController.text,
            _certicateController.text,
            _languagesController.text,
            _additionallInformationController.text,
            _aboutMeController.text,);}, child: Text("Zapisz dane")),
            ],
          ),
        ),
      ),
    );
  }
}
