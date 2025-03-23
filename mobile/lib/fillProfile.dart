import 'package:flutter/material.dart';

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
  final _educationController = TextEditingController();
  final _workExperienceController = TextEditingController();
  final _skillController = TextEditingController();
  final _certicateController = TextEditingController();
  final _languagesController = TextEditingController();
  final _additionallInformationController = TextEditingController();
  final _aboutMeController = TextEditingController();
  final _countryController = TextEditingController();
  final _birthDateController = TextEditingController();

  Future<void> _selectBirthDate() async {
    DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _birthDateController.text =
            "${picked.day.toString().padLeft(2, '0')}.${picked.month.toString().padLeft(2, '0')}.${picked.year}";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          children: [
            TextFormField(
              controller: _nameController,
              decoration: InputDecoration(labelText: "Name")),
            TextFormField(
              controller: _surnameController,
              decoration: InputDecoration(labelText: "Surname")),
            TextFormField(
              controller: _phoneController,
              decoration: InputDecoration(labelText: "Number")),
            TextFormField(
              controller: _addressController,
              decoration: InputDecoration(labelText: "Adress")),
            TextFormField(
              controller: _birthDateController,
              decoration: InputDecoration(
                labelText: "Data urodzenia",
                suffix: Icon(Icons.calendar_today),
              ),
              readOnly: true,
              onTap: _selectBirthDate,
            ),
            TextFormField(
              controller: _languagesController,
              decoration: InputDecoration(labelText: "Languages"),),
              TextFormField(
                controller: _skillController,
                decoration: InputDecoration(labelText: 'Skill'),
              )
          ],
        ),
      ),
    );
  }
}
