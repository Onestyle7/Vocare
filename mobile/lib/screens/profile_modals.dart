import 'package:flutter/material.dart';
import 'package:vocare/widgets/custom_button.dart';

// Language Modal
class AddLanguageModal extends StatefulWidget {
  final Function(String language, String level) onAdd;

  const AddLanguageModal({super.key, required this.onAdd});

  @override
  State<AddLanguageModal> createState() => _AddLanguageModalState();
}

class _AddLanguageModalState extends State<AddLanguageModal> {
  final _languageController = TextEditingController();
  String? _selectedLevel;

  final List<String> _levels = [
    'Beginner (A1)',
    'Elementary (A2)',
    'Intermediate (B1)',
    'Upper-Intermediate (B2)',
    'Advanced (C1)',
    'Proficient (C2)',
    'Native',
  ];

  @override
  void dispose() {
    _languageController.dispose();
    super.dispose();
  }

  void _handleAdd() {
    if (_languageController.text.trim().isNotEmpty && _selectedLevel != null) {
      widget.onAdd(_languageController.text.trim(), _selectedLevel!);
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFF1A1A1A),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        width: 400,
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Add Language',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),

            // Language Input
            const Text(
              'Language',
              style: TextStyle(color: Colors.white, fontSize: 14),
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF2A2A2A),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF444444)),
              ),
              child: TextField(
                controller: _languageController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'e.g. English',
                  hintStyle: TextStyle(color: Color(0xFF666666)),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.all(16),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Level Dropdown
            const Text(
              'Level',
              style: TextStyle(color: Colors.white, fontSize: 14),
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF2A2A2A),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF444444)),
              ),
              child: DropdownButtonFormField<String>(
                value: _selectedLevel,
                dropdownColor: const Color(0xFF2A2A2A),
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.all(16),
                ),
                hint: const Text(
                  'Select level',
                  style: TextStyle(color: Color(0xFF666666)),
                ),
                items:
                    _levels
                        .map(
                          (level) => DropdownMenuItem(
                            value: level,
                            child: Text(
                              level,
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                        )
                        .toList(),
                onChanged: (value) => setState(() => _selectedLevel = value),
              ),
            ),

            const SizedBox(height: 24),

            // Add Button
            SizedBox(
              width: double.infinity,
              child: CustomButton(
                text: 'Add',
                onPressed: _handleAdd,
                borderRadius: 8,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Work Experience Modal
class AddWorkExperienceModal extends StatefulWidget {
  final Function(Map<String, dynamic>) onAdd;

  const AddWorkExperienceModal({super.key, required this.onAdd});

  @override
  State<AddWorkExperienceModal> createState() => _AddWorkExperienceModalState();
}

class _AddWorkExperienceModalState extends State<AddWorkExperienceModal> {
  final _companyController = TextEditingController();
  final _positionController = TextEditingController();
  final _startDateController = TextEditingController();
  final _endDateController = TextEditingController();
  final _descriptionController = TextEditingController();
  bool _currentlyWorking = false;

  @override
  void dispose() {
    _companyController.dispose();
    _positionController.dispose();
    _startDateController.dispose();
    _endDateController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  void _handleAdd() {
    if (_companyController.text.trim().isNotEmpty &&
        _positionController.text.trim().isNotEmpty) {
      widget.onAdd({
        'company': _companyController.text.trim(),
        'position': _positionController.text.trim(),
        'startDate': _startDateController.text.trim(),
        'endDate': _currentlyWorking ? '' : _endDateController.text.trim(),
        'description': _descriptionController.text.trim(),
        'isCurrentlyWorking': _currentlyWorking,
      });
      Navigator.of(context).pop();
    }
  }

  Widget _buildDateInput(
    String label,
    TextEditingController controller, {
    bool enabled = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white, fontSize: 14)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: enabled ? const Color(0xFF2A2A2A) : const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF444444)),
          ),
          child: TextField(
            controller: controller,
            enabled: enabled,
            readOnly: true,
            style: TextStyle(
              color: enabled ? Colors.white : const Color(0xFF666666),
            ),
            onTap: enabled ? () => _selectDate(controller) : null,
            decoration: const InputDecoration(
              hintText: 'yyyy-mm-dd',
              hintStyle: TextStyle(color: Color(0xFF666666)),
              border: InputBorder.none,
              contentPadding: EdgeInsets.all(16),
              suffixIcon: Icon(Icons.calendar_today, color: Color(0xFF666666)),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _selectDate(TextEditingController controller) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1950),
      lastDate: DateTime.now().add(const Duration(days: 365 * 10)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF915EFF),
              onPrimary: Colors.white,
              surface: Color(0xFF1C1C1E),
              onSurface: Colors.white,
            ),
            dialogBackgroundColor: const Color(0xFF1C1C1E),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      // Format ISO: yyyy-mm-dd (backend compatible)
      controller.text =
          "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFF1A1A1A),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        width: 500,
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Add Work Experience',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),

              // Company
              const Text(
                'Company',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF2A2A2A),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF444444)),
                ),
                child: TextField(
                  controller: _companyController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'Company name',
                    hintStyle: TextStyle(color: Color(0xFF666666)),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(16),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Position
              const Text(
                'Position',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF2A2A2A),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF444444)),
                ),
                child: TextField(
                  controller: _positionController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'Your job title',
                    hintStyle: TextStyle(color: Color(0xFF666666)),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(16),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Date inputs
              Row(
                children: [
                  Expanded(
                    child: _buildDateInput('Start Date', _startDateController),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildDateInput(
                      'End Date',
                      _endDateController,
                      enabled: !_currentlyWorking,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Currently working checkbox
              Row(
                children: [
                  Checkbox(
                    value: _currentlyWorking,
                    onChanged:
                        (value) => setState(() {
                          _currentlyWorking = value ?? false;
                          if (_currentlyWorking) {
                            _endDateController.clear();
                          }
                        }),
                    activeColor: const Color(0xFF915EFF),
                  ),
                  const Text(
                    'I currently work here',
                    style: TextStyle(color: Colors.white),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Description
              const Text(
                'Description',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF2A2A2A),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF444444)),
                ),
                child: TextField(
                  controller: _descriptionController,
                  maxLines: 4,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'Describe your role and responsibilities',
                    hintStyle: TextStyle(color: Color(0xFF666666)),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(16),
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Add Button
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: 'Add',
                  onPressed: _handleAdd,
                  borderRadius: 8,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Education Modal
class AddEducationModal extends StatefulWidget {
  final Function(Map<String, dynamic>) onAdd;

  const AddEducationModal({super.key, required this.onAdd});

  @override
  State<AddEducationModal> createState() => _AddEducationModalState();
}

class _AddEducationModalState extends State<AddEducationModal> {
  final _institutionController = TextEditingController();
  final _fieldController = TextEditingController();
  final _startDateController = TextEditingController();
  final _endDateController = TextEditingController();
  String? _selectedDegree;
  bool _currentlyStudying = false;

  final List<String> _degrees = [
    'High School Diploma',
    'Associate Degree',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'Doctoral Degree (PhD)',
    'Professional Degree',
    'Certificate',
    'Other',
  ];

  @override
  void dispose() {
    _institutionController.dispose();
    _fieldController.dispose();
    _startDateController.dispose();
    _endDateController.dispose();
    super.dispose();
  }

  void _handleAdd() {
    if (_institutionController.text.trim().isNotEmpty &&
        _selectedDegree != null &&
        _fieldController.text.trim().isNotEmpty) {
      widget.onAdd({
        'institution': _institutionController.text.trim(),
        'degree': _selectedDegree!,
        'field': _fieldController.text.trim(),
        'startDate': _startDateController.text.trim(),
        'endDate': _currentlyStudying ? '' : _endDateController.text.trim(),
        'isCurrentlyStudying': _currentlyStudying,
      });
      Navigator.of(context).pop();
    }
  }

  Widget _buildDateInput(
    String label,
    TextEditingController controller, {
    bool enabled = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white, fontSize: 14)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: enabled ? const Color(0xFF2A2A2A) : const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF444444)),
          ),
          child: TextField(
            controller: controller,
            enabled: enabled,
            readOnly: true,
            style: TextStyle(
              color: enabled ? Colors.white : const Color(0xFF666666),
            ),
            onTap: enabled ? () => _selectDate(controller) : null,
            decoration: const InputDecoration(
              hintText: 'Select date',
              hintStyle: TextStyle(color: Color(0xFF666666)),
              border: InputBorder.none,
              contentPadding: EdgeInsets.all(16),
              suffixIcon: Icon(Icons.calendar_today, color: Color(0xFF666666)),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _selectDate(TextEditingController controller) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1950),
      lastDate: DateTime.now().add(const Duration(days: 365 * 10)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF915EFF),
              onPrimary: Colors.white,
              surface: Color(0xFF1C1C1E),
              onSurface: Colors.white,
            ),
            dialogBackgroundColor: const Color(0xFF1C1C1E),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      // Format ISO: yyyy-mm-dd (backend compatible)
      controller.text =
          "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFF1A1A1A),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        width: 500,
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Add Education',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),

              // Institution
              const Text(
                'Institution',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF2A2A2A),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF444444)),
                ),
                child: TextField(
                  controller: _institutionController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'School or university name',
                    hintStyle: TextStyle(color: Color(0xFF666666)),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(16),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Degree Dropdown
              const Text(
                'Degree',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF2A2A2A),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF444444)),
                ),
                child: DropdownButtonFormField<String>(
                  value: _selectedDegree,
                  dropdownColor: const Color(0xFF2A2A2A),
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(16),
                  ),
                  hint: const Text(
                    'Select degree',
                    style: TextStyle(color: Color(0xFF666666)),
                  ),
                  items:
                      _degrees
                          .map(
                            (degree) => DropdownMenuItem(
                              value: degree,
                              child: Text(
                                degree,
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                          )
                          .toList(),
                  onChanged: (value) => setState(() => _selectedDegree = value),
                ),
              ),

              const SizedBox(height: 16),

              // Field of Study
              const Text(
                'Field of Study',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF2A2A2A),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF444444)),
                ),
                child: TextField(
                  controller: _fieldController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'e.g. Computer Science',
                    hintStyle: TextStyle(color: Color(0xFF666666)),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(16),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Date inputs
              Row(
                children: [
                  Expanded(
                    child: _buildDateInput('Start Date', _startDateController),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildDateInput(
                      'End Date',
                      _endDateController,
                      enabled: !_currentlyStudying,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Currently studying checkbox
              Row(
                children: [
                  Checkbox(
                    value: _currentlyStudying,
                    onChanged:
                        (value) => setState(() {
                          _currentlyStudying = value ?? false;
                          if (_currentlyStudying) {
                            _endDateController.clear();
                          }
                        }),
                    activeColor: const Color(0xFF915EFF),
                  ),
                  const Text(
                    'I\'m currently studying here',
                    style: TextStyle(color: Colors.white),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Add Button
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: 'Add',
                  onPressed: _handleAdd,
                  borderRadius: 8,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Certificate Modal - UPROSZCZONY BEZ EXPIRY DATE
class AddCertificateModal extends StatefulWidget {
  final Function(Map<String, dynamic>) onAdd;

  const AddCertificateModal({super.key, required this.onAdd});

  @override
  State<AddCertificateModal> createState() => _AddCertificateModalState();
}

class _AddCertificateModalState extends State<AddCertificateModal> {
  final _nameController = TextEditingController();
  final _organizationController = TextEditingController();
  final _issueDateController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _organizationController.dispose();
    _issueDateController.dispose();
    super.dispose();
  }

  void _handleAdd() {
    if (_nameController.text.trim().isNotEmpty &&
        _organizationController.text.trim().isNotEmpty) {
      widget.onAdd({
        'name': _nameController.text.trim(),
        'organization': _organizationController.text.trim(),
        'issueDate': _issueDateController.text.trim(),
      });
      Navigator.of(context).pop();
    }
  }

  Widget _buildDateInput(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white, fontSize: 14)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF2A2A2A),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF444444)),
          ),
          child: TextField(
            controller: controller,
            readOnly: true,
            style: const TextStyle(color: Colors.white),
            onTap: () => _selectDate(controller),
            decoration: const InputDecoration(
              hintText: 'Select date',
              hintStyle: TextStyle(color: Color(0xFF666666)),
              border: InputBorder.none,
              contentPadding: EdgeInsets.all(16),
              suffixIcon: Icon(Icons.calendar_today, color: Color(0xFF666666)),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _selectDate(TextEditingController controller) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(1950),
      lastDate: DateTime.now().add(const Duration(days: 365 * 10)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF915EFF),
              onPrimary: Colors.white,
              surface: Color(0xFF1C1C1E),
              onSurface: Colors.white,
            ),
            dialogBackgroundColor: const Color(0xFF1C1C1E),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      controller.text =
          "${picked.day.toString().padLeft(2, '0')}.${picked.month.toString().padLeft(2, '0')}.${picked.year}";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFF1A1A1A),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        width: 500,
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Add Certificate',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),

              // Certificate Name
              const Text(
                'Certificate Name',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF2A2A2A),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF444444)),
                ),
                child: TextField(
                  controller: _nameController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'e.g. AWS Certified Solutions Architect',
                    hintStyle: TextStyle(color: Color(0xFF666666)),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(16),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Issuing Organization
              const Text(
                'Issuing Organization',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF2A2A2A),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF444444)),
                ),
                child: TextField(
                  controller: _organizationController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    hintText: 'e.g. Amazon Web Services',
                    hintStyle: TextStyle(color: Color(0xFF666666)),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.all(16),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Issue Date only
              _buildDateInput('Issue Date', _issueDateController),

              const SizedBox(height: 24),

              // Add Button
              SizedBox(
                width: double.infinity,
                child: CustomButton(
                  text: 'Add',
                  onPressed: _handleAdd,
                  borderRadius: 8,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
